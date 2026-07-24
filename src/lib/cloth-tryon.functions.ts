import { createServerFn } from "@tanstack/react-start";

const BASE = "https://yce-api-01.makeupar.com/s2s/v2.0";

type GarmentCategory = "auto" | "full_body" | "upper_body" | "lower_body" | "shoes";

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

async function uploadImage(apiKey: string, dataUrl: string): Promise<string> {
  const { bytes, contentType } = dataUrlToBytes(dataUrl);
  const ext = contentType.split("/")[1] || "jpg";

  const fileRes = await fetch(`${BASE}/file/cloth`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      files: [
        {
          file_name: `upload.${ext}`,
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
  const req = file.requests[0];
  const uploadHeaders: Record<string, string> = { "Content-Type": contentType };
  const reqHeaders = req.headers;
  if (Array.isArray(reqHeaders)) {
    for (const h of reqHeaders) uploadHeaders[h.key] = h.value;
  } else if (reqHeaders && typeof reqHeaders === "object") {
    for (const [k, v] of Object.entries(reqHeaders)) uploadHeaders[k] = String(v);
  }
  const uploadRes = await fetch(req.url, {
    method: req.method || "PUT",
    headers: uploadHeaders,
    body: bytes as BodyInit,
  });
  if (!uploadRes.ok) {
    throw new Error(`Image upload failed: ${uploadRes.status} ${await uploadRes.text()}`);
  }
  return file.file_id as string;
}

export const tryOnCloth = createServerFn({ method: "POST" })
  .inputValidator(
    (data: { personDataUrl: string; garmentDataUrl: string; garmentCategory?: GarmentCategory }) => {
      if (!data || typeof data.personDataUrl !== "string" || typeof data.garmentDataUrl !== "string") {
        throw new Error("personDataUrl and garmentDataUrl required");
      }
      return {
        personDataUrl: data.personDataUrl,
        garmentDataUrl: data.garmentDataUrl,
        garmentCategory: (data.garmentCategory ?? "auto") as GarmentCategory,
      };
    },
  )
  .handler(async ({ data }): Promise<{ imageUrl: string }> => {
    const apiKey = process.env.YOUCAM_API_KEY;
    if (!apiKey) throw new Error("YOUCAM_API_KEY is not configured");

    const [srcFileId, refFileId] = await Promise.all([
      uploadImage(apiKey, data.personDataUrl),
      uploadImage(apiKey, data.garmentDataUrl),
    ]);

    const taskRes = await fetch(`${BASE}/task/cloth`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        src_file_id: srcFileId,
        ref_file_id: refFileId,
        garment_category: data.garmentCategory,
      }),
    });
    if (!taskRes.ok) {
      throw new Error(`Task start failed: ${taskRes.status} ${await taskRes.text()}`);
    }
    const taskJson: any = await taskRes.json();
    const taskId: string | undefined = taskJson?.data?.task_id ?? taskJson?.result?.task_id;
    if (!taskId) throw new Error(`No task_id returned: ${JSON.stringify(taskJson).slice(0, 300)}`);

    const deadline = Date.now() + 120_000;
    while (Date.now() < deadline) {
      await new Promise((r) => setTimeout(r, 2000));
      const pollRes = await fetch(`${BASE}/task/cloth/${taskId}`, {
        headers: { Authorization: `Bearer ${apiKey}` },
      });
      if (!pollRes.ok) {
        throw new Error(`Poll failed: ${pollRes.status} ${await pollRes.text()}`);
      }
      const pollJson: any = await pollRes.json();
      const payload = pollJson?.data ?? pollJson?.result ?? {};
      const status = payload.task_status;
      if (status === "success") {
        const output = payload.results?.output ?? payload.output ?? [];
        const first = Array.isArray(output) ? output[0] : output;
        const imageUrl: string | undefined =
          first?.image_url ??
          first?.url ??
          (Array.isArray(first?.image_urls) ? first.image_urls[0] : undefined) ??
          payload.results?.image_url;
        if (!imageUrl) {
          console.error("Try-on success but no image URL", JSON.stringify(pollJson));
          throw new Error(`No image URL in result: ${JSON.stringify(pollJson).slice(0, 500)}`);
        }
        return { imageUrl };
      }
      if (status === "error" || status === "failed") {
        const detail = JSON.stringify(pollJson);
        console.error("Try-on failed", detail);
        throw new Error(`Try-on failed: ${detail.slice(0, 800)}`);
      }
    }
    throw new Error("Try-on timed out");
  });
