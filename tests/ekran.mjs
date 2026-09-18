import { chromium } from "playwright";
import { envYukle, girisYap } from "./oturum.mjs";

envYukle();
const BASE = process.env.PANO_URL ?? "http://localhost:3000";
const OUT = process.argv[2] ?? "tests/ekran-goruntuleri";

/** Telefon ve masaüstü — ikisinde de yatay taşma olmamalı. */
const OLCULER = [
  { ad: "mobil", width: 390, height: 844, isMobile: true },
  { ad: "masaustu", width: 1280, height: 900, isMobile: false },
];

const SAYFALAR = [
  ["1-genel", "/"],
  ["2-gorevler", "/gorevler"],
  ["3-benim", "/benim"],
  ["4-ekle", "/ekle"],
  ["6-ayarlar", "/ayarlar"],
];

const browser = await chromium.launch();
const problems = [];
let sorunluTasma = 0;

for (const olcu of OLCULER) {
  const ctx = await browser.newContext({
    viewport: { width: olcu.width, height: olcu.height },
    deviceScaleFactor: 2,
    isMobile: olcu.isMobile,
    hasTouch: olcu.isMobile,
    locale: "tr-TR",
  });
  const page = await ctx.newPage();
  page.on("console", (m) => {
    if (m.type() === "error") problems.push(`${olcu.ad} console: ${m.text()}`);
  });
  page.on("pageerror", (e) => problems.push(`${olcu.ad} pageerror: ${e.message}`));

  const tasma = () =>
    page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  const cek = async (ad) => {
    await page.screenshot({ path: `${OUT}/${olcu.ad}-${ad}.png` });
    const o = await tasma();
    if (o > 0) sorunluTasma++;
    console.log(`${olcu.ad.padEnd(9)} ${ad.padEnd(14)} yatay tasma: ${o}px ${o > 0 ? "<-- SORUN" : "OK"}`);
  };

  // Giriş ekranı (oturumsuz)
  await page.goto(`${BASE}/giris`, { waitUntil: "networkidle" });
  await cek("0-giris");

  await girisYap(page, BASE);

  for (const [ad, yol] of SAYFALAR) {
    await page.goto(BASE + yol, { waitUntil: "networkidle" });
    await cek(ad);
  }

  // Görev detayı
  await page.goto(`${BASE}/gorevler`, { waitUntil: "networkidle" });
  await page.locator("button", { hasText: "45 dakikalık toplantı" }).first().click();
  await page.waitForSelector("dialog[open]");
  await cek("5-detay");
  await page.keyboard.press("Escape");

  // Toplu seçim modu
  await page.locator('button:text-is("Seç")').click();
  const kutular = await page.locator('input[type="checkbox"][aria-label*="seç"]').all();
  for (const i of [0, 2, 3]) await kutular[i]?.check();
  await cek("7-toplu-secim");

  // Toplantı notu önizlemesi
  await page.goto(`${BASE}/ekle`, { waitUntil: "networkidle" });
  await page.locator('button:text-is("Toplantı notu")').click();
  await page.locator('button:text-is("Örnek doldur")').click();
  await page.waitForSelector("text=Önizleme");
  await cek("8-toplanti-notu");

  await ctx.close();
}

await browser.close();
console.log(problems.length ? "HATALAR:\n" + problems.join("\n") : "konsol temiz");
if (sorunluTasma > 0) process.exit(1);
