// A drawn, fictional face for the judge sample mode. No real person, no photo.
// Painted on a canvas in the browser and returned as a JPEG data URL (1200 x 1600).

export function makeSampleFace(): string {
  const W = 1200;
  const H = 1600;
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const x = c.getContext("2d");
  if (!x) throw new Error("Canvas is not available");

  // soft even background
  x.fillStyle = "#e4e0d8";
  x.fillRect(0, 0, W, H);

  // hair behind the head
  x.fillStyle = "#3a2a22";
  x.beginPath();
  x.ellipse(600, 760, 470, 640, 0, 0, Math.PI * 2);
  x.fill();

  // neck and shoulders
  x.fillStyle = "#d9a98b";
  x.fillRect(470, 1250, 260, 250);
  x.fillStyle = "#6b7f8c";
  x.beginPath();
  x.ellipse(600, 1640, 560, 230, 0, Math.PI, 0);
  x.fill();

  // ears
  x.fillStyle = "#dcae90";
  [[175, 820], [1025, 820]].forEach(([ex, ey]) => {
    x.beginPath();
    x.ellipse(ex, ey, 48, 90, 0, 0, Math.PI * 2);
    x.fill();
  });

  // face
  x.fillStyle = "#e4b89b";
  x.beginPath();
  x.ellipse(600, 800, 430, 560, 0, 0, Math.PI * 2);
  x.fill();

  // fringe
  x.fillStyle = "#3a2a22";
  x.beginPath();
  x.ellipse(600, 330, 440, 190, 0, Math.PI, 0);
  x.fill();

  // eyebrows
  x.strokeStyle = "#4a3428";
  x.lineWidth = 22;
  x.lineCap = "round";
  [[330, 560, 500, 540], [700, 540, 870, 560]].forEach(([a, b, d, e]) => {
    x.beginPath();
    x.moveTo(a, b);
    x.quadraticCurveTo((a + d) / 2, Math.min(b, e) - 30, d, e);
    x.stroke();
  });

  // eyes
  [[415, 670], [785, 670]].forEach(([ex, ey]) => {
    x.fillStyle = "#fbf7f2";
    x.beginPath();
    x.ellipse(ex, ey, 78, 38, 0, 0, Math.PI * 2);
    x.fill();
    x.fillStyle = "#5a3d2b";
    x.beginPath();
    x.arc(ex, ey, 30, 0, Math.PI * 2);
    x.fill();
    x.fillStyle = "#1c120c";
    x.beginPath();
    x.arc(ex, ey, 14, 0, Math.PI * 2);
    x.fill();
  });

  // nose
  x.strokeStyle = "#b98569";
  x.lineWidth = 12;
  x.beginPath();
  x.moveTo(600, 700);
  x.quadraticCurveTo(570, 880, 548, 930);
  x.quadraticCurveTo(600, 965, 652, 930);
  x.stroke();

  // lips
  x.fillStyle = "#b5524f";
  x.beginPath();
  x.moveTo(470, 1070);
  x.quadraticCurveTo(540, 1030, 600, 1052);
  x.quadraticCurveTo(660, 1030, 730, 1070);
  x.quadraticCurveTo(600, 1160, 470, 1070);
  x.fill();

  return c.toDataURL("image/jpeg", 0.92);
}
