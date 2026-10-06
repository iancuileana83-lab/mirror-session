// A fictional product label for the judge sample mode. Not a real product, no brand.
// Painted on a canvas in the browser and returned as a JPEG data URL.

export const SAMPLE_LABEL_INGREDIENTS = [
  "Aqua", "Glycerin", "Cetearyl Alcohol", "Prunus Amygdalus Dulcis (Sweet Almond) Oil",
  "Butyrospermum Parkii (Shea) Butter", "Citrus Limon (Lemon) Peel Extract",
  "Lavandula Angustifolia (Lavender) Oil", "Dimethicone", "Niacinamide", "Phenoxyethanol",
  "Parfum", "Linalool", "Limonene", "Tocopherol", "Sodium Hydroxide",
];

export function makeSampleLabel(): string {
  const W = 1100;
  const H = 1500;
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const x = c.getContext("2d");
  if (!x) throw new Error("Canvas is not available");

  x.fillStyle = "#f4efe3";
  x.fillRect(0, 0, W, H);
  x.strokeStyle = "#7a8f6a";
  x.lineWidth = 8;
  x.strokeRect(40, 40, W - 80, H - 80);

  x.fillStyle = "#3f5a3a";
  x.textAlign = "center";
  x.font = "bold 78px Georgia, serif";
  x.fillText("MEADOW", W / 2, 210);
  x.fillText("DAY CREAM", W / 2, 305);
  x.font = "italic 36px Georgia, serif";
  x.fillStyle = "#6b6b5c";
  x.fillText("sample product, not real", W / 2, 375);

  x.textAlign = "left";
  x.fillStyle = "#222";
  x.font = "bold 40px Arial, sans-serif";
  x.fillText("INGREDIENTS:", 100, 500);

  x.font = "38px Arial, sans-serif";
  const text = SAMPLE_LABEL_INGREDIENTS.join(", ") + ".";
  const words = text.split(" ");
  let line = "";
  let y = 565;
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (x.measureText(test).width > W - 200 && line) {
      x.fillText(line, 100, y);
      line = w;
      y += 58;
    } else line = test;
  }
  x.fillText(line, 100, y);

  x.fillStyle = "#6b6b5c";
  x.font = "32px Arial, sans-serif";
  x.fillText("50 ml e   Made for demonstration only", 100, H - 110);

  return c.toDataURL("image/jpeg", 0.92);
}
