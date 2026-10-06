// Records the Counter Check demo video with Playwright, following docs/VIDEO-SCRIPT.md.
// Usage: node record.mjs <BASE_URL> <OUT_DIR> [rehearse]
import { chromium } from "playwright";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const BASE = process.argv[2];
const OUT = process.argv[3];
const REHEARSE = process.argv[4] === "rehearse";
const FACE = process.env.FACE || new URL("../../../public/examples/sample-face.jpg", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
const dur = Object.fromEntries(JSON.parse(readFileSync(join(OUT, "durations.json"), "utf8").replace(/^﻿/, "")).map((d) => [d.id, d.seconds * 1000]));
mkdirSync(join(OUT, "raw"), { recursive: true });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const W = 1920, H = 1080;

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: W, height: H },
  deviceScaleFactor: 1,
  recordVideo: { dir: join(OUT, "raw"), size: { width: W, height: H } },
  locale: "en-US",
  colorScheme: "light",
});

// bigger text for 1080p (rem based, so layout and mouse coordinates stay exact) + a visible mouse pointer
await context.addInitScript(() => {
  const setup = () => {
    document.documentElement.style.fontSize = "21px";
    if (document.getElementById("__cur")) return;
    const c = document.createElement("div");
    c.id = "__cur";
    c.style.cssText = "position:fixed;z-index:2147483647;pointer-events:none;left:0;top:0;width:30px;height:30px;will-change:transform;";
    c.innerHTML = '<svg width="30" height="30" viewBox="0 0 24 24"><path d="M3 2l7 19 3-8 8-3z" fill="#fff" stroke="#222" stroke-width="1.6" stroke-linejoin="round"/></svg>';
    document.body.appendChild(c);
    const st = document.createElement("style");
    st.textContent = "@keyframes __rip{from{transform:scale(.3);opacity:.7}to{transform:scale(1.6);opacity:0}}";
    document.head.appendChild(st);
    const pos = () => { try { return JSON.parse(sessionStorage.getItem("__mp") || "[40,40]"); } catch { return [40, 40]; } };
    const place = (x, y) => { c.style.transform = `translate(${x}px,${y}px)`; };
    place(...pos());
    document.addEventListener("mousemove", (e) => { place(e.clientX, e.clientY); try { sessionStorage.setItem("__mp", JSON.stringify([e.clientX, e.clientY])); } catch {} }, true);
    document.addEventListener("mousedown", (e) => {
      const r = document.createElement("div");
      r.style.cssText = `position:fixed;z-index:2147483646;pointer-events:none;left:${e.clientX - 22}px;top:${e.clientY - 22}px;width:44px;height:44px;border-radius:50%;border:3px solid #c8553d;animation:__rip .5s ease-out forwards;`;
      document.body.appendChild(r);
      setTimeout(() => r.remove(), 600);
    }, true);
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", setup); else setup();
});

const page = await context.newPage();
const t0 = Date.now();
const marks = {};
const cuts = []; // loading waits that are cut out of the final video (the voice is shifted to match)
async function waitCut(promise, keepHead = 3000, keepTail = 900) {
  const a = Date.now() - t0 + keepHead;
  const result = await promise;
  const b = Date.now() - t0 - keepTail;
  if (b - a > 1200) cuts.push({ start: a, end: b });
  return result;
}
page.setDefaultTimeout(45000);

// ---- helpers ----
async function scrollBy(dy, ms = 1200) {
  const steps = Math.max(1, Math.round(ms / 20));
  for (let i = 0; i < steps; i++) { await page.mouse.wheel(0, dy / steps); await sleep(20); }
}
async function scrollToTop(ms = 700) { await scrollBy(-(await page.evaluate(() => window.scrollY)), ms); }
async function scrollIntoCenter(loc, ms = 900) {
  const dy = await loc.evaluate((el) => { const r = el.getBoundingClientRect(); return r.top + r.height / 2 - window.innerHeight / 2; });
  if (Math.abs(dy) > 8) await scrollBy(dy, ms);
}
async function moveTo(loc, steps = 28) {
  const box = await loc.boundingBox();
  if (!box) return;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps });
}
async function click(loc, { pause = 450 } = {}) {
  await loc.waitFor({ state: "visible" });
  await scrollIntoCenter(loc, 700);
  await moveTo(loc);
  await sleep(pause);
  await loc.click();
}
async function segment(id, fn) {
  marks[id] = Date.now() - t0;
  const started = Date.now();
  await fn();
  const need = dur[id] + 700 - (Date.now() - started);
  if (need > 0) await sleep(need);
  await sleep(350);
}
const btn = (re) => page.getByRole("button", { name: re }).first();
const link = (re) => page.getByRole("link", { name: re }).first();
async function go(path) { await page.goto(BASE + path, { waitUntil: "networkidle" }); await sleep(500); }

// warm the service so the first page is not slow
await fetch(BASE + "/").catch(() => {});

// ---- 1 home ----
await segment("s1", async () => {
  await go("/");
  await sleep(2500);
  await scrollBy(520, 3500);
  await sleep(2500);
  await scrollBy(-520, 1800);
});

// ---- 2 scan (live scan of the uploaded AI-generated face) ----
await segment("s2", async () => {
  await go("/skin");
  await sleep(800);
  await page.setInputFiles('input[type="file"]', FACE);
  await page.locator('img[alt="Your uploaded photo"]').waitFor();
  await sleep(1500);
  await click(btn(/Analyze Skin/));
  await waitCut(page.getByText(/Scores run from|saved example|demo limit|not running/i).first().waitFor({ timeout: 120000 }));
  await sleep(1200);
  await scrollBy(780, 1800);
  await sleep(2800);
  const not = page.getByText(/^Not: /).first();
  await scrollIntoCenter(not, 900);
  await moveTo(not);
  await sleep(1500);
});

// ---- 3 profile ----
await segment("s3", async () => {
  await go("/profile");
  await sleep(700);
  await click(btn(/Demo: fill in a sample profile/));
  await sleep(1500);
  await scrollBy(560, 1800);
  await sleep(1500);
  await scrollBy(700, 2000);
  await sleep(1200);
});

// ---- 4 label ----
await segment("s4", async () => {
  await go("/product");
  await sleep(800);
  await click(btn(/Try the sample label/));
  await sleep(1800);
  await click(btn(/Read the ingredient list/));
  try {
    await waitCut(page.waitForFunction(() => (document.querySelector("#inci")?.value || "").length > 20, null, { timeout: REHEARSE ? 6000 : 60000 }));
  } catch {
    if (!REHEARSE) throw new Error("label reading did not finish");
    await click(btn(/Use the sample list/));
  }
  await scrollIntoCenter(page.locator("#inci"), 1000);
  await sleep(1500);
});

// ---- 5 check ----
await segment("s5", async () => {
  await scrollBy(420, 1200);
  await click(link(/Check this product/));
  await page.waitForURL(/\/check/);
  await sleep(1500);
  await scrollBy(300, 1800);
  await sleep(2200);
  await scrollBy(380, 2200);
  await sleep(2200);
  await scrollBy(400, 2200);
  await sleep(2000);
  await scrollBy(420, 2200);
});

// ---- 6 try-on (one live try-on) ----
await segment("s6", async () => {
  await click(link(/Try it on/));
  await page.waitForURL(/\/tryon/);
  await sleep(1000);
  await click(btn(/Use the sample/));
  await sleep(1800);
  await click(btn(/^Try Rosewood/));
  await waitCut(page.locator('figure img[alt*="with Rosewood"], figure img[alt*="Example result"]').first().waitFor({ timeout: 120000 }));
  await sleep(1000);
  await scrollIntoCenter(page.locator("figure").first(), 1000);
});

// ---- 7 compare ----
await segment("s7", async () => {
  await go("/compare");
  await sleep(700);
  await click(btn(/Demo: load sample products/));
  await page.getByRole("heading", { name: "The coach proposes" }).waitFor();
  await sleep(1500);
  await scrollIntoCenter(page.getByRole("heading", { name: "The coach proposes" }), 1200);
  await scrollBy(420, 2400);
  await sleep(1500);
  await click(btn(/Confirm this basket/));
  await sleep(800);
  await scrollToTop(1400);
  await sleep(2200);
});

// ---- 8 progress ----
await segment("s8", async () => {
  await go("/progress");
  await sleep(700);
  await click(btn(/Demo: load two scans/));
  await page.getByText("Earlier scan").first().waitFor();
  await sleep(1000);
  await scrollBy(560, 1800);
  await sleep(1500);
});

// ---- 9 closing card (plain text, no logos) ----
await segment("s9", async () => {
  await page.goto("about:blank");
  await page.setContent(`<!doctype html><meta charset="utf-8"><body style="margin:0;height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;background:#faf8f4;color:#2b1d14;font-family:Georgia,serif;text-align:center">
    <h1 style="font-size:96px;margin:0">Counter Check</h1>
    <p style="font-size:40px;margin:18px 0 0">Check a product before you buy it.</p>
    <p style="font-size:30px;margin:48px 0 0;font-family:Arial,sans-serif">Built with the YouCam Skin Analysis API and the YouCam Makeup Virtual Try-On API</p>
    <p style="font-size:26px;margin:22px 0 0;font-family:Arial,sans-serif">Open source (MIT): github.com/iancuileana83-lab/mirror-session</p>
    <p style="font-size:24px;margin:48px 0 0;font-family:Arial,sans-serif;color:#6b5a4d">Not medical advice. Faces are AI-generated and products are fictional.</p></body>`);
  await sleep(500);
});

const elapsed = Date.now() - t0;
const video = page.video();
await context.close();
const videoPath = await video.path();
await browser.close();
writeFileSync(join(OUT, "marks.json"), JSON.stringify({ marks, cuts, elapsedMs: elapsed, videoPath }, null, 2));
console.log("cuts:", JSON.stringify(cuts));
console.log("recorded", videoPath, "elapsed", (elapsed / 1000).toFixed(1), "s");
console.log(JSON.stringify(marks));
