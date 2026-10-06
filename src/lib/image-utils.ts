// Browser-only image helpers.

/** Shrink a photo so the longest side is at most maxSide (keeps uploads small and fast). */
export function shrinkDataUrl(dataUrl: string, maxSide = 1600, quality = 0.85): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const c = document.createElement("canvas");
      c.width = w;
      c.height = h;
      const ctx = c.getContext("2d");
      if (!ctx) return reject(new Error("Canvas is not available"));
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, w, h);
      ctx.drawImage(img, 0, 0, w, h);
      resolve(c.toDataURL("image/jpeg", quality));
    };
    img.onerror = () => reject(new Error("Could not read the image"));
    img.src = dataUrl;
  });
}

/**
 * Make a face photo fit YouCam's skin analysis: short side at least 1080 px (smaller photos are enlarged to 1200 px),
 * long side at most 2560 px. Photos that already fit are only re-encoded when they are far too large.
 */
export function normalizeFaceImage(dataUrl: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const shortSide = Math.min(img.width, img.height);
      const longSide = Math.max(img.width, img.height);
      let scale = 1;
      if (shortSide < 1080) scale = 1200 / shortSide;
      else if (longSide > 2560) scale = 2560 / longSide;
      if (scale === 1) return resolve(dataUrl);
      const c = document.createElement("canvas");
      c.width = Math.round(img.width * scale);
      c.height = Math.round(img.height * scale);
      const ctx = c.getContext("2d");
      if (!ctx) return reject(new Error("Canvas is not available"));
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(img, 0, 0, c.width, c.height);
      resolve(c.toDataURL("image/jpeg", 0.92));
    };
    img.onerror = () => reject(new Error("Could not read the image"));
    img.src = dataUrl;
  });
}