import { chromium } from "playwright";

const BASE = process.env.PANO_URL ?? "http://localhost:3000";
const OUT = process.argv[2] ?? "tests/ekran-goruntuleri";
const browser = await chromium.launch();
const ctx = await browser.newContext({
  viewport: { width: 390, height: 844 },   // iPhone 14 Pro
  deviceScaleFactor: 2,
  isMobile: true,
  hasTouch: true,
  locale: "tr-TR",
});
const page = await ctx.newPage();

const problems = [];
page.on("console", (m) => { if (m.type() === "error") problems.push("console: " + m.text()); });
page.on("pageerror", (e) => problems.push("pageerror: " + e.message));

for (const [name, path] of [["1-genel", "/"], ["2-gorevler", "/gorevler"], ["3-benim", "/benim"], ["4-ekle", "/ekle"]]) {
  await page.goto(BASE + path, { waitUntil: "networkidle" });
  await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: false });
  // Yatay kaydırma mobilde en sık görülen hata — ölç.
  const over = await page.evaluate(() =>
    document.documentElement.scrollWidth - document.documentElement.clientWidth);
  console.log(`${name.padEnd(12)} yatay tasma: ${over}px ${over > 0 ? "<-- SORUN" : "OK"}`);
}

// Görev detayını aç
await page.goto(BASE + "/gorevler", { waitUntil: "networkidle" });
await page.locator("button", { hasText: "45 dakikalık toplantı" }).first().click();
await page.waitForSelector("dialog[open]");
await page.screenshot({ path: `${OUT}/5-detay.png` });
const overD = await page.evaluate(() =>
  document.documentElement.scrollWidth - document.documentElement.clientWidth);
console.log(`5-detay      yatay tasma: ${overD}px ${overD > 0 ? "<-- SORUN" : "OK"}`);

console.log(problems.length ? "HATALAR:\n" + problems.join("\n") : "konsol temiz");
await browser.close();
