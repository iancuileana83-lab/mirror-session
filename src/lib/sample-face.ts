// The sample face for the judge sample mode: an AI-generated face (StyleGAN2, thispersondoesnotexist.com),
// not a real person. The file lives in public/examples/sample-face.jpg (1024 x 1024). YouCam's skin analysis
// wants the short side to be at least 1080 px, so the browser enlarges it to 1200 px before use.

export const SAMPLE_FACE_URL = "/examples/sample-face.jpg";
export const SAMPLE_FACE_LABEL = "AI-generated face, not a real person";

let cached: Promise<string> | null = null;

/** The sample face as a JPEG data URL (1200 x 1200). Browser only. */
export function loadSampleFace(): Promise<string> {
  if (cached) return cached;
  cached = new Promise<string>((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const side = Math.max(1200, Math.min(img.width, img.height));
      const c = document.createElement("canvas");
      c.width = side;
      c.height = side;
      const ctx = c.getContext("2d");
      if (!ctx) return reject(new Error("Canvas is not available"));
      ctx.drawImage(img, 0, 0, side, side);
      resolve(c.toDataURL("image/jpeg", 0.92));
    };
    img.onerror = () => {
      cached = null;
      reject(new Error("Could not load the sample face"));
    };
    img.src = SAMPLE_FACE_URL;
  });
  return cached;
}
