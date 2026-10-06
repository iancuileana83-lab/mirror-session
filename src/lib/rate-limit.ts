// Per-visitor and daily limits for the calls that cost something (YouCam scan, Gemini label reader,
// YouCam try-on). Server side only. Counts live in memory, so each Cloud Run instance counts for
// itself and a cold start resets it; together with `--max-instances` this bounds the total, and the
// API providers' own balances are the hard stop. DEMO_LOCKDOWN=1 pauses all three at once.

export type Feature = "skin" | "label" | "tryon";

type Limit = { hour: number; day: number; global: number };

/** Defaults per visitor (per hour and per day) and in total per instance per UTC day. */
export const DEFAULT_LIMITS: Record<Feature, Limit> = {
  skin: { hour: 3, day: 6, global: 40 },
  label: { hour: 6, day: 12, global: 100 },
  tryon: { hour: 3, day: 6, global: 30 },
};

export type LimitReason = "visitor" | "daily" | "paused";

/** The error message prefix the browser looks for. */
export const LIMIT_PREFIX = "Limit:";

const HOUR = 3_600_000;
const DAY = 24 * HOUR;
const MAX_KEYS = 5000;

const visits = new Map<string, number[]>();
const globalCount = new Map<Feature, { day: string; count: number }>();

function scaled(limit: Limit, scale: number): Limit {
  const s = Number.isFinite(scale) && scale >= 1 ? scale : 1;
  return { hour: Math.round(limit.hour * s), day: Math.round(limit.day * s), global: Math.round(limit.global * s) };
}

/** Pure check: returns the reason to refuse, or null (and counts the call) when it is allowed. */
export function checkLimit(
  feature: Feature,
  visitor: string,
  now = Date.now(),
  opts: { scale?: number; lockdown?: boolean } = {},
): LimitReason | null {
  if (opts.lockdown) return "paused";
  const limit = scaled(DEFAULT_LIMITS[feature], opts.scale ?? 1);

  const key = `${feature}|${visitor}`;
  const recent = (visits.get(key) ?? []).filter((t) => now - t < DAY);
  if (recent.length >= limit.day) {
    visits.set(key, recent);
    return "visitor";
  }
  if (recent.filter((t) => now - t < HOUR).length >= limit.hour) {
    visits.set(key, recent);
    return "visitor";
  }

  const dayKey = new Date(now).toISOString().slice(0, 10);
  const g = globalCount.get(feature);
  const count = g && g.day === dayKey ? g.count : 0;
  if (count >= limit.global) return "daily";

  recent.push(now);
  visits.set(key, recent);
  globalCount.set(feature, { day: dayKey, count: count + 1 });

  if (visits.size > MAX_KEYS) {
    // drop the oldest keys so memory stays small
    for (const k of [...visits.keys()].slice(0, visits.size - MAX_KEYS)) visits.delete(k);
  }
  return null;
}

/** Test helper: forget all counts. */
export function resetLimits() {
  visits.clear();
  globalCount.clear();
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

/** Call at the start of a server function. Throws "Limit: visitor | daily | paused" when over a limit. */
export async function guard(feature: Feature): Promise<void> {
  const reason = checkLimit(feature, await visitorId(), Date.now(), {
    scale: Number(process.env.DEMO_LIMIT_SCALE ?? "1"),
    lockdown: process.env.DEMO_LOCKDOWN === "1",
  });
  if (reason) {
    console.warn(`[limit] ${feature} refused: ${reason}`);
    throw new Error(`${LIMIT_PREFIX} ${reason}`);
  }
}
