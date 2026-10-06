// Free pre-flight on the live site: home page, sample scan (saved, no API call), label reader (no YouCam units).
import { chromium } from "playwright";
const BASE = process.argv[2];
const browser = await chromium.launch({ headless: true });
const page = await (await browser.newContext({ viewport: { width: 1280, height: 800 } })).newPage();
page.setDefaultTimeout(60000);
const out = {};
await page.goto(BASE + "/", { waitUntil: "networkidle" });
out.badge = (await page.locator("text=/Made by someone/").first().textContent())?.trim();
out.tagline = (await page.locator("h1").first().textContent())?.trim();

// sample scan must show the saved example and make no scan request
const requests = [];
page.on("request", (r) => { if (r.method() === "POST") requests.push(r.url().replace(BASE, "")); });
await page.goto(BASE + "/skin", { waitUntil: "networkidle" });
await page.getByRole("button", { name: /Try the sample/ }).click();
await page.locator('img[alt="Your uploaded photo"], img').first().waitFor();
await page.waitForTimeout(1500);
await page.getByRole("button", { name: /Analyze Skin/ }).click();
await page.getByText(/Saved example/).first().waitFor();
out.sampleScanNote = (await page.getByText(/Saved example/).first().textContent())?.slice(0, 90);
out.postRequestsDuringSampleScan = requests.length;

// label reader (Gemini, no YouCam units): exercises the usage counter
await page.goto(BASE + "/product", { waitUntil: "networkidle" });
await page.getByRole("button", { name: /Try the sample label/ }).click();
await page.waitForTimeout(1200);
await page.getByRole("button", { name: /Read the ingredient list/ }).click();
await page.waitForFunction(() => (document.querySelector("#inci")?.value || "").length > 20, null, { timeout: 60000 });
out.labelIngredients = (await page.locator("#inci").inputValue()).split(",").length;
console.log(JSON.stringify(out, null, 2));
await browser.close();
