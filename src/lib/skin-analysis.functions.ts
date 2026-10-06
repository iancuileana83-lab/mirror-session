import { createServerFn } from "@tanstack/react-start";
import { CONCERNS, HD_ACTIONS, type ConcernId, type Scores } from "./skin-concerns";

type UiResult = Scores & { all?: number };

const KNOWN = new Set<string>(CONCERNS.map((c) => c.id));

const BASE = "https://yce-api-01.makeupar.com/s2s/v2.0";

function dataUrlToBytes(dataUrl: string): { bytes: Uint8Array; contentType: string } {
  const match = /^data:([^;]+);base64,(.+)$/.exec(dataUrl);
  if (!match) throw new Error("Invalid image data");
  const contentType = match[1];
  const b64 = match[2];
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return { bytes, contentType };
}

/** fetch with a timeout and a safe log line (host and path only, never query strings or the key). */
async function yfetch(url: string, init: RequestInit, timeoutMs = 25_000): Promise<Response> {
  let where = "?";
  try {
    const u = new URL(url);
    where = u.host + (u.host.includes("makeupar") ? u.pathname : "");
  } catch {
    // ignore
  }
  const started = Date.now();
  try {
    const res = await fetch(url, { ...init, signal: AbortSignal.timeout(timeoutMs) });
    console.log(`[skin-analysis] ${init.method ?? "GET"} ${where} -> ${res.status} (${Date.now() - started} ms)`);
    return res;
  } catch (err) {
    console.error(`[skin-analysis] ${init.method ?? "GET"} ${where} failed after ${Date.now() - started} ms:`, err instanceof Error ? err.message : err);
    throw err;
  }
}
export const analyzeSkin = createServerFn({ method: "POST" })
  .inputValidator((data: { dataUrl: string }) => {
    if (!data || typeof data.dataUrl !== "string") throw new Error("dataUrl required");
    return data;
  })
  .handler(async ({ data }): Promise<UiResult> => {
    try {
      return await runAnalysis(data.dataUrl);
    } catch (err) {
      // Log the real reason on the server (status + YouCam message; never the key or the photo).
      const msg = err instanceof Error ? err.message : String(err);
      console.error('[skin-analysis] failed:', msg.slice(0, 1500));
      throw new Error('YouCam: ' + msg.slice(0, 300));
    }
  });

async function runAnalysis(dataUrl: string): Promise<UiResult> {
  const data = { dataUrl };
    const apiKey = process.env.YOUCAM_API_KEY;
    console.log('[skin-analysis] key loaded:', Boolean(apiKey));
    if (!apiKey) throw new Error("YOUCAM_API_KEY is not configured");

    const { bytes, contentType } = dataUrlToBytes(data.dataUrl);

    // 1. Request upload URL + file_id
    const fileRes = await yfetch(`${BASE}/file/skin-analysis`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        files: [
          {
            file_name: `upload.${contentType.split("/")[1] || "jpg"}`,
            content_type: contentType,
            file_size: bytes.byteLength,
          },
        ],
      }),
    });
    if (!fileRes.ok) {
      throw new Error(`File init failed: ${fileRes.status} ${await fileRes.text()}`);
    }
    const fileJson: any = await fileRes.json();
    const file = fileJson?.data?.files?.[0] ?? fileJson?.result?.files?.[0];
    if (!file?.file_id || !file?.requests?.[0]?.url) {
      console.error("Unexpected file init response", JSON.stringify(fileJson));
      throw new Error(`No file entry returned: ${JSON.stringify(fileJson).slice(0, 300)}`);
    }
    const fileId: string = file.file_id;
    const req = file.requests[0];

    // 2. Upload bytes to signed URL
    const uploadHeaders: Record<string, string> = { "Content-Type": contentType };
    const reqHeaders = req.headers;
    if (Array.isArray(reqHeaders)) {
      for (const h of reqHeaders) uploadHeaders[h.key] = h.value;
    } else if (reqHeaders && typeof reqHeaders === "object") {
      for (const [k, v] of Object.entries(reqHeaders)) uploadHeaders[k] = String(v);
    }
    const uploadRes = await yfetch(req.url, {
      method: req.method || "PUT",
      headers: uploadHeaders,
      body: bytes as BodyInit,
    });
    if (!uploadRes.ok) {
      throw new Error(`Image upload failed: ${uploadRes.status} ${await uploadRes.text()}`);
    }

    // 3. Start task
    const taskRes = await yfetch(`${BASE}/task/skin-analysis`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        src_file_id: fileId,
        dst_actions: HD_ACTIONS,
        format: "json",
      }),
    });
    if (!taskRes.ok) {
      throw new Error(`Task start failed: ${taskRes.status} ${await taskRes.text()}`);
    }
    const taskJson: any = await taskRes.json();
    const taskId: string | undefined = taskJson?.data?.task_id ?? taskJson?.result?.task_id;
    if (!taskId) throw new Error("No task_id returned");

    // 4. Poll
    const deadline = Date.now() + 90_000;
    while (Date.now() < deadline) {
      await new Promise((r) => setTimeout(r, 2000));
      let pollRes: Response;
      try {
        pollRes = await yfetch(`${BASE}/task/skin-analysis/${taskId}`, {
          headers: { Authorization: `Bearer ${apiKey}` },
        }, 10_000);
      } catch {
        continue; // a single slow poll is not a failure; the overall deadline still applies
      }
      if (!pollRes.ok) {
        throw new Error(`Poll failed: ${pollRes.status} ${await pollRes.text()}`);
      }
      const pollJson: any = await pollRes.json();
      const payload = pollJson?.data ?? pollJson?.result ?? {};
      const status = payload.task_status;
      if (status === "success") {
        const out: UiResult = {};
        const output = payload.results?.output ?? [];
        for (const d of output) {
          if (typeof d?.ui_score !== "number") continue;
          const key = String(d.type ?? d.dst ?? "").replace(/^hd_/, "");
          if (key === "all") out.all = d.ui_score;
          else if (KNOWN.has(key)) out[key as ConcernId] = d.ui_score;
        }
        return out;
      }
      if (status === "error" || status === "failed") {
        throw new Error(`Analysis failed with status: ${status}`);
      }
    }
    throw new Error("Analysis timed out");
  }


