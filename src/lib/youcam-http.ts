// Small server-side helpers for the YouCam REST API (used by the makeup try-on function).
// Logs status codes and timings only: never the key, signed upload links or photos.

export const YOUCAM_BASE = "https://yce-api-01.makeupar.com/s2s/v2.0";

export async function yfetch(url: string, init: RequestInit, timeoutMs = 25_000): Promise<Response> {
  let where = "?";
  try {
    const u = new URL(url);
    where = u.host + (u.host.includes("makeupar") ? u.pathname.replace(/\/[A-Za-z0-9_-]{40,}$/, "/<id>") : "");
  } catch {
    // ignore
  }
  const started = Date.now();
  try {
    const res = await fetch(url, { ...init, signal: AbortSignal.timeout(timeoutMs) });
    console.log(`[youcam] ${init.method ?? "GET"} ${where} -> ${res.status} (${Date.now() - started} ms)`);
    return res;
  } catch (err) {
    console.error(`[youcam] ${init.method ?? "GET"} ${where} failed after ${Date.now() - started} ms:`, err instanceof Error ? err.message : err);
    throw err;
  }
}

export function dataUrlToBytes(dataUrl: string): { bytes: Uint8Array; contentType: string } {
  const m = /^data:(image\/(?:jpeg|png));base64,(.+)$/.exec(dataUrl);
  if (!m) throw new Error("Invalid image data");
  const binary = atob(m[2]);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return { bytes, contentType: m[1] };
}

/** Upload an image through the generic file API; returns the file_id to use in a task. */
export async function uploadImage(apiKey: string, dataUrl: string): Promise<string> {
  const { bytes, contentType } = dataUrlToBytes(dataUrl);
  const ext = contentType.split("/")[1] === "png" ? "png" : "jpg";
  const init = await yfetch(`${YOUCAM_BASE}/file`, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ files: [{ file_name: `upload.${ext}`, content_type: contentType, file_size: bytes.byteLength }] }),
  });
  if (!init.ok) throw new Error(`File init failed: ${init.status} ${(await init.text()).slice(0, 300)}`);
  const json: any = await init.json();
  const file = json?.data?.files?.[0];
  const req = file?.requests?.[0];
  if (!file?.file_id || !req?.url) throw new Error("No upload entry returned");
  const headers: Record<string, string> = { "Content-Type": contentType };
  if (Array.isArray(req.headers)) for (const h of req.headers) headers[h.key] = h.value;
  else if (req.headers && typeof req.headers === "object") for (const [k, v] of Object.entries(req.headers)) headers[k] = String(v);
  const up = await yfetch(req.url, { method: req.method || "PUT", headers, body: bytes as BodyInit }, 40_000);
  if (!up.ok) throw new Error(`Image upload failed: ${up.status}`);
  return file.file_id as string;
}

/** Poll a task until it succeeds. A single slow poll is retried; the overall limit still applies. */
export async function pollTask(apiKey: string, path: string, taskId: string, maxMs = 90_000): Promise<any> {
  const deadline = Date.now() + maxMs;
  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, 2000));
    let res: Response;
    try {
      res = await yfetch(`${YOUCAM_BASE}${path}/${taskId}`, { headers: { Authorization: `Bearer ${apiKey}` } }, 10_000);
    } catch {
      continue;
    }
    if (!res.ok) throw new Error(`Poll failed: ${res.status} ${(await res.text()).slice(0, 300)}`);
    const json: any = await res.json();
    const payload = json?.data ?? json?.result ?? {};
    if (payload.task_status === "success") return payload;
    if (payload.task_status === "error" || payload.task_status === "failed") {
      throw new Error(`Task failed: ${payload.error ?? "unknown"} ${String(payload.error_message ?? "").slice(0, 200)}`);
    }
  }
  throw new Error("Timed out waiting for the result");
}
