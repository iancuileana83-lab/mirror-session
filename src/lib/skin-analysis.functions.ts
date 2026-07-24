import { createServerFn } from "@tanstack/react-start";

type UiResult = {
  hd_moisture?: number;
  hd_texture?: number;
  hd_pore?: number;
  hd_redness?: number;
};

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

export const analyzeSkin = createServerFn({ method: "POST" })
  .inputValidator((data: { dataUrl: string }) => {
    if (!data || typeof data.dataUrl !== "string") throw new Error("dataUrl required");
    return data;
  })
  .handler(async ({ data }): Promise<UiResult> => {
    const apiKey = process.env.YOUCAM_API_KEY;
    if (!apiKey) throw new Error("YOUCAM_API_KEY is not configured");

    const { bytes, contentType } = dataUrlToBytes(data.dataUrl);

    // 1. Request upload URL + file_id
    const fileRes = await fetch(`${BASE}/file/skin-analysis`, {
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
    const fileJson = (await fileRes.json()) as {
      result?: { files?: Array<{ file_id: string; requests: Array<{ url: string; method: string; headers?: Array<{ key: string; value: string }> }> }> };
    };
    const file = fileJson.result?.files?.[0];
    if (!file) throw new Error("No file entry returned");
    const fileId = file.file_id;
    const req = file.requests[0];

    // 2. Upload bytes to signed URL
    const uploadHeaders: Record<string, string> = { "Content-Type": contentType };
    for (const h of req.headers ?? []) uploadHeaders[h.key] = h.value;
    const uploadRes = await fetch(req.url, {
      method: req.method || "PUT",
      headers: uploadHeaders,
      body: bytes as BodyInit,
    });
    if (!uploadRes.ok) {
      throw new Error(`Image upload failed: ${uploadRes.status} ${await uploadRes.text()}`);
    }

    // 3. Start task
    const taskRes = await fetch(`${BASE}/task/skin-analysis`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        file_id: fileId,
        dst_actions: ["hd_moisture", "hd_texture", "hd_pore", "hd_redness"],
        format: "json",
      }),
    });
    if (!taskRes.ok) {
      throw new Error(`Task start failed: ${taskRes.status} ${await taskRes.text()}`);
    }
    const taskJson = (await taskRes.json()) as { result?: { task_id: string } };
    const taskId = taskJson.result?.task_id;
    if (!taskId) throw new Error("No task_id returned");

    // 4. Poll
    const deadline = Date.now() + 60_000;
    while (Date.now() < deadline) {
      await new Promise((r) => setTimeout(r, 2000));
      const pollRes = await fetch(`${BASE}/task/skin-analysis/${taskId}`, {
        headers: { Authorization: `Bearer ${apiKey}` },
      });
      if (!pollRes.ok) {
        throw new Error(`Poll failed: ${pollRes.status} ${await pollRes.text()}`);
      }
      const pollJson = (await pollRes.json()) as {
        result?: {
          task_status?: string;
          results?: Array<{ data?: Array<{ dst?: string; ui_score?: number }> }>;
        };
      };
      const status = pollJson.result?.task_status;
      if (status === "success") {
        const out: UiResult = {};
        for (const r of pollJson.result?.results ?? []) {
          for (const d of r.data ?? []) {
            if (d.dst && typeof d.ui_score === "number") {
              (out as Record<string, number>)[d.dst] = d.ui_score;
            }
          }
        }
        return out;
      }
      if (status === "error" || status === "failed") {
        throw new Error(`Analysis failed with status: ${status}`);
      }
    }
    throw new Error("Analysis timed out");
  });
