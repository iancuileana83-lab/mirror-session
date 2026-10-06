// Limits for the calls that cost something. Server side only.
//
// YouCam units: an HD Skin Analysis costs 20 units, a makeup try-on costs 1 unit (balance 1,891 on Oct 6, 2026,
// valid until Jan 3, 2027). The Gemini label reader has no YouCam cost.
//
// Two layers:
//  1. Per visitor (soft, in memory, per instance): stops one person from hammering a button.
//  2. A HARD total and a daily cap kept in a counter that survives restarts. On Cloud Run the counter is one small
//     object in a Cloud Storage bucket (USAGE_BUCKET), updated with compare-and-swap so two instances cannot
//     both spend the last call. Without USAGE_BUCKET (local development) it falls back to memory.
// If the counter cannot be read or written, the call is refused (fail closed) to protect the units.
// DEMO_LOCKDOWN=1 pauses all three calls; DEMO_LIMIT_SCALE (1 or more) multiplies every cap.

export type Feature = "skin" | "label" | "tryon";

export type Policy = {
  /** Calls one visitor may make per hour and per day. */
  visitorHour: number;
  visitorDay: number;
  /** Calls for everyone per UTC day. */
  perDay: number;
  /** Calls for everyone until the end of the demo (Jan 3, 2027). */
  total: number;
};

/** YouCam units one call costs (0 for the Gemini label reader). */
export const UNITS_PER_CALL: Record<Feature, number> = { skin: 20, tryon: 1, label: 0 };

/**
 * Caps. Real-photo scans: 60 x 20 = 1,200 units at most. Try-ons: 250 x 1 = 250 units at most.
 * Together at most 1,450 of the 1,891 units, so at least 441 units stay in reserve.
 */
export const POLICY: Record<Feature, Policy> = {
  skin: { visitorHour: 1, visitorDay: 2, perDay: 6, total: 60 },
  tryon: { visitorHour: 3, visitorDay: 4, perDay: 20, total: 250 },
  label: { visitorHour: 6, visitorDay: 12, perDay: 100, total: 2000 },
};

export type LimitReason = "visitor" | "daily" | "total" | "paused";

/** The error message prefix the browser looks for. */
export const LIMIT_PREFIX = "Limit:";

// ---------- the counter ----------

export type Usage = {
  total: Record<Feature, number>;
  /** UTC date (YYYY-MM-DD) that `today` belongs to. */
  day: string;
  today: Record<Feature, number>;
};

export const emptyUsage = (day: string): Usage => ({
  total: { skin: 0, label: 0, tryon: 0 },
  day,
  today: { skin: 0, label: 0, tryon: 0 },
});

/** A place to keep the counter. `version` is any token the store uses for compare-and-swap. */
export interface UsageStore {
  load(): Promise<{ usage: Usage | null; version: string }>;
  /** Returns false when someone else changed the counter since `load` (the caller then retries). */
  save(usage: Usage, version: string): Promise<boolean>;
}

export class MemoryStore implements UsageStore {
  private usage: Usage | null = null;
  private n = 0;
  async load() {
    return { usage: this.usage ? structuredClone(this.usage) : null, version: String(this.n) };
  }
  async save(usage: Usage, version: string) {
    if (version !== String(this.n)) return false;
    this.usage = structuredClone(usage);
    this.n += 1;
    return true;
  }
}

/** One JSON object in a Cloud Storage bucket, written with ifGenerationMatch (compare-and-swap). */
export class GcsStore implements UsageStore {
  private token: { value: string; expires: number } | null = null;
  private bucket: string;
  private object: string;
  constructor(bucket: string, object = "usage.json") {
    this.bucket = bucket;
    this.object = object;
  }

  private async accessToken(): Promise<string> {
    if (this.token && this.token.expires > Date.now() + 60_000) return this.token.value;
    const res = await fetch("http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token", {
      headers: { "Metadata-Flavor": "Google" },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) throw new Error(`metadata token ${res.status}`);
    const j: any = await res.json();
    this.token = { value: j.access_token as string, expires: Date.now() + (Number(j.expires_in) || 300) * 1000 };
    return this.token.value;
  }

  async load() {
    const token = await this.accessToken();
    const url = `https://storage.googleapis.com/storage/v1/b/${encodeURIComponent(this.bucket)}/o/${encodeURIComponent(this.object)}?alt=media`;
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(8000) });
    if (res.status === 404) return { usage: null, version: "0" };
    if (!res.ok) throw new Error(`usage load ${res.status}`);
    const version = res.headers.get("x-goog-generation") ?? "";
    if (!version) throw new Error("usage load: no generation");
    return { usage: (await res.json()) as Usage, version };
  }

  async save(usage: Usage, version: string) {
    const token = await this.accessToken();
    const url =
      `https://storage.googleapis.com/upload/storage/v1/b/${encodeURIComponent(this.bucket)}/o` +
      `?uploadType=media&name=${encodeURIComponent(this.object)}&ifGenerationMatch=${encodeURIComponent(version)}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(usage),
      signal: AbortSignal.timeout(8000),
    });
    if (res.status === 412) return false;
    if (!res.ok) throw new Error(`usage save ${res.status}`);
    return true;
  }
}

// ---------- the decision ----------

const HOUR = 3_600_000;
const DAY = 24 * HOUR;
const MAX_KEYS = 5000;
const visits = new Map<string, number[]>();

function scaled(p: Policy, scale: number): Policy {
  const s = Number.isFinite(scale) && scale >= 1 ? scale : 1;
  return {
    visitorHour: Math.round(p.visitorHour * s),
    visitorDay: Math.round(p.visitorDay * s),
    perDay: Math.round(p.perDay * s),
    total: Math.round(p.total * s),
  };
}

/**
 * Decide whether one call may go ahead and, if so, count it. Returns the reason to refuse, or null.
 * `opts.store` makes it testable; in production the store comes from getStore().
 */
export async function reserveCall(
  feature: Feature,
  visitor: string,
  store: UsageStore,
  now = Date.now(),
  opts: { scale?: number; lockdown?: boolean } = {},
): Promise<LimitReason | null> {
  if (opts.lockdown) return "paused";
  const policy = scaled(POLICY[feature], opts.scale ?? 1);

  // 1. per visitor (soft)
  const key = `${feature}|${visitor}`;
  const recent = (visits.get(key) ?? []).filter((t) => now - t < DAY);
  if (recent.length >= policy.visitorDay || recent.filter((t) => now - t < HOUR).length >= policy.visitorHour) {
    visits.set(key, recent);
    return "visitor";
  }

  // 2. the hard counter, with compare-and-swap retries
  const day = new Date(now).toISOString().slice(0, 10);
  try {
    for (let attempt = 0; attempt < 8; attempt++) {
      const { usage: loaded, version } = await store.load();
      const usage = loaded ?? emptyUsage(day);
      if (usage.day !== day) {
        usage.day = day;
        usage.today = { skin: 0, label: 0, tryon: 0 };
      }
      if (usage.total[feature] >= policy.total) return "total";
      if (usage.today[feature] >= policy.perDay) return "daily";
      usage.total[feature] += 1;
      usage.today[feature] += 1;
      if (await store.save(usage, version)) {
        recent.push(now);
        visits.set(key, recent);
        if (visits.size > MAX_KEYS) for (const k of [...visits.keys()].slice(0, visits.size - MAX_KEYS)) visits.delete(k);
        console.log(
          `[limit] ${feature} ok: today ${usage.today[feature]}/${policy.perDay}, total ${usage.total[feature]}/${policy.total} (${usage.total[feature] * UNITS_PER_CALL[feature]} units)`,
        );
        return null;
      }
    }
    return "paused"; // too much contention: refuse rather than risk an over-spend
  } catch (err) {
    console.error("[limit] counter unavailable, refusing the call:", err instanceof Error ? err.message : err);
    return "paused";
  }
}

/** Test helper: forget the per-visitor counts. */
export function resetLimits() {
  visits.clear();
}

let memoryStore: MemoryStore | null = null;
let gcsStore: GcsStore | null = null;

/** The Cloud Storage counter when USAGE_BUCKET is set, otherwise memory (local development). */
export function getStore(): UsageStore {
  const bucket = process.env.USAGE_BUCKET;
  if (bucket) return (gcsStore ??= new GcsStore(bucket));
  return (memoryStore ??= new MemoryStore());
}

/**
 * Who is asking: the last entry of X-Forwarded-For (the address Google's front end appended, which a
 * visitor cannot forge), or "local" when there is none (local development).
 */
export async function visitorId(): Promise<string> {
  try {
    const { getRequestHeader } = await import("@tanstack/react-start/server");
    const xff = getRequestHeader("x-forwarded-for");
    if (xff) {
      const parts = xff.split(",").map((p) => p.trim()).filter(Boolean);
      if (parts.length) return parts[parts.length - 1];
    }
  } catch {
    // no request context
  }
  return "local";
}

/** Call at the start of a server function. Throws "Limit: visitor | daily | total | paused" when refused. */
export async function guard(feature: Feature): Promise<void> {
  const reason = await reserveCall(feature, await visitorId(), getStore(), Date.now(), {
    scale: Number(process.env.DEMO_LIMIT_SCALE ?? "1"),
    lockdown: process.env.DEMO_LOCKDOWN === "1",
  });
  if (reason) {
    console.warn(`[limit] ${feature} refused: ${reason}`);
    throw new Error(`${LIMIT_PREFIX} ${reason}`);
  }
}
