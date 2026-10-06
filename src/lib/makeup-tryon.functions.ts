import { guard } from "./rate-limit";
import { createServerFn } from "@tanstack/react-start";
import { YOUCAM_BASE, pollTask, uploadImage, yfetch } from "./youcam-http";

// YouCam makeup Virtual Try-On: one face photo + one coloured product -> the face with it applied.
// 1 unit per successful try-on. Only the user's face photo goes to YouCam.

export type TryOnKind = "lipstick" | "foundation";

export type TryOnInput = { faceDataUrl: string; kind: TryOnKind; color: string };

function effectFor(kind: TryOnKind, color: string) {
  if (kind === "lipstick") {
    return {
      category: "lip_color",
      shape: { name: "original" },
      palettes: [{ color, texture: "satin", colorIntensity: 70 }],
      style: { type: "full" },
    };
  }
  return {
    category: "foundation",
    palettes: [{ color, colorIntensity: 45, glowIntensity: 30, coverageIntensity: 45 }],
  };
}

export const makeupTryOn = createServerFn({ method: "POST" })
  .inputValidator((data: TryOnInput) => {
    if (!data || typeof data.faceDataUrl !== "string") throw new Error("faceDataUrl required");
    if (data.faceDataUrl.length > 7_000_000) throw new Error("Image is too large");
    if (data.kind !== "lipstick" && data.kind !== "foundation") throw new Error("Unknown product type");
    if (!/^#[0-9a-fA-F]{6}$/.test(data.color)) throw new Error("Invalid colour");
    return data;
  })
  .handler(async ({ data }): Promise<{ imageUrl: string }> => {
    await guard("tryon");
    const apiKey = process.env.YOUCAM_API_KEY;
    if (!apiKey) throw new Error("Try-on: YOUCAM_API_KEY is not configured");
    try {
      const fileId = await uploadImage(apiKey, data.faceDataUrl);
      const taskRes = await yfetch(`${YOUCAM_BASE}/task/makeup-vto`, {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ src_file_id: fileId, version: "1.0", effects: [effectFor(data.kind, data.color)] }),
      });
      if (!taskRes.ok) throw new Error(`Task start failed: ${taskRes.status} ${(await taskRes.text()).slice(0, 300)}`);
      const taskJson: any = await taskRes.json();
      const taskId: string | undefined = taskJson?.data?.task_id ?? taskJson?.result?.task_id;
      if (!taskId) throw new Error("No task_id returned");

      const payload = await pollTask(apiKey, "/task/makeup-vto", taskId);
      const results = payload.results;
      const first = Array.isArray(results) ? results[0] : Array.isArray(results?.output) ? results.output[0] : results;
      const imageUrl: string | undefined =
        first?.url ?? first?.download_url ?? first?.image_url ?? payload.download_url ?? payload.url;
      if (!imageUrl) {
        console.error("[makeup-tryon] success without an image url; keys:", Object.keys(payload ?? {}).join(","));
        throw new Error("No image in the result");
      }
      return { imageUrl };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("[makeup-tryon] failed:", msg.slice(0, 600));
      throw new Error("Try-on: " + msg.slice(0, 200));
    }
  });
