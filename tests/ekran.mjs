import { chromium } from "playwright";
import { envYukle, girisYap } from "./oturum.mjs";

envYukle();
const BASE = process.env.PANO_URL ?? "http://localhost:3000";
const OUT = process.argv[2] ?? "tests/ekran-goruntuleri";

const browser = await chromium.launch();
const ctx = await browser.newContext({
  viewport: { width: 390, height: 844 }, // iPhone 14 Pro
  deviceScaleFactor: 2,
  isMobile: true,
  hasTouch: true,
  locale: "tr-TR",
});
const page = await ctx.newPage();

const problems = [];
page.on("console", (m) => { if (m.type() === "error") problems.push("console: " + m.text()); });
page.on("pageerror", (e) => problems.push("pageerror: " + e.message));

/** Yatay taşma mobilde en sık çıkan hata; 0 değilse düzeltilmeli. */
const tasma = () => page.evaluate(() =>
  document.documentElement.scrollWidth - document.documentElement.clientWidth);
const cek = async (ad) => {
  await page.screenshot({ path: `${OUT}/${ad}.png` });
  const o = await tasma();
  console.log(`${ad.padEnd(14)} yatay tasma: ${o}px ${o > 0 ? "<-- SORUN" : "OK"}`);
};

// Giriş ekranı (oturumsuz)
await page.goto(`${BASE}/giris`, { waitUntil: "networkidle" });
await cek("0-giris");

await girisYap(page, BASE);

for (const [ad, yol] of [["1-genel", "/"], ["2-gorevler", "/gorevler"], ["3-benim", "/benim"], ["4-ekle", "/ekle"]]) {
  await page.goto(BASE + yol, { waitUntil: "networkidle" });
  await cek(ad);
}

await page.goto(`${BASE}/gorevler`, { waitUntil: "networkidle" });
await page.locator("button", { hasText: "45 dakikalık toplantı" }).first().click();
await page.waitForSelector("dialog[open]");
await cek("5-detay");

console.log(problems.length ? "HATALAR:\n" + problems.join("\n") : "konsol temiz");
await browser.close();
