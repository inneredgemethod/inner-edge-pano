import { chromium } from "playwright";
import { envYukle, girisYap } from "./oturum.mjs";

envYukle();
const BASE = process.env.PANO_URL ?? "http://localhost:3000";
const ok = (n, c) => console.log(`${c ? "✓" : "✗ BASARISIZ"}  ${n}`);

const b = await chromium.launch();
const yeniOturum = async (email) => {
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const p = await ctx.newPage();
  await girisYap(p, BASE, email);
  return p;
};
const alt = (p, t) => p.locator(`nav[aria-label="Alt sekme çubuğu"] a:text-is("${t}")`);

const errs = [];
const p = await yeniOturum("info@inneredgemethod.io");
p.on("pageerror", (e) => errs.push(e.message));

// --- Kürşad (admin) oturumu ---
ok("kimlik oturumdan geliyor", await p.getByTitle("info@inneredgemethod.io").isVisible());

await p.goto(`${BASE}/gorevler`, { waitUntil: "networkidle" });
ok("37 görev veritabanından", (await p.getByText(/^\d+ görev$/).textContent()) === "37 görev");

// Durum değiştirme
await p.locator("button", { hasText: "45 dakikalık toplantı" }).first().click();
await p.waitForSelector("dialog[open]");
await p.locator('dialog button:text-is("Yapılıyor")').click();
ok("durum 'Yapılıyor' oldu", (await p.locator('dialog [aria-pressed="true"]:text-is("Yapılıyor")').count()) === 1);

// Not ekleme
await p.locator('dialog input[placeholder^="Not ekle"]').fill("Sarah'a saat sordum, cevap bekliyorum.");
await p.locator('dialog button:text-is("Ekle")').click();
ok("not akışa düştü", await p.locator("dialog").getByText("Sarah'a saat sordum").isVisible());
ok("notta kim/ne zaman var", await p.locator("dialog").getByText(/Kürşad · \d/).first().isVisible());
await p.locator('dialog button:text-is("Kapat")').click();

// Sekmeler arası state
await alt(p, "Genel").click();
await p.waitForURL("**/");
await alt(p, "Görevler").click();
await p.waitForURL("**/gorevler");
const kept = await p.locator("button", { hasText: "45 dakikalık toplantı" }).first().innerText();
ok("durum sekme değişince korundu", kept.includes("Yapılıyor"));

// Filtreler
await p.locator('button:text-is("Sarah")').click();
ok("kişi filtresi (Sarah 13)", (await p.getByText(/^\d+ görev$/).textContent()) === "13 görev");
await p.locator('button:text-is("Herkes")').click();
await p.getByLabel("Sadece takılan / geciken").check();
const geciken = Number((await p.getByText(/^\d+ görev$/).textContent()).split(" ")[0]);
ok(`geciken filtresi (${geciken})`, geciken > 0 && geciken < 37);
await p.getByLabel("Sadece takılan / geciken").uncheck();
await p.locator('button:has-text("2 · Sosyal medya")').click();
ok("faz filtresi (B 10)", (await p.getByText(/^\d+ görev$/).textContent()) === "10 görev");

// Benim sekmesi
await alt(p, "Benim").click();
await p.waitForURL("**/benim");
ok("Benim sekmesi giriş yapana ait", await p.getByText("Kürşad — benim görevlerim").isVisible());

// Görev ekleme
await alt(p, "Ekle").click();
await p.waitForURL("**/ekle");
await p.getByLabel("Başlık").fill("TEST: kurulum dogrulama gorevi");
await p.locator('button:text-is("Ekle")').click();
await p.waitForURL("**/gorevler");
await p.locator('button:text-is("Herkes")').click();
ok("yeni görev listede", await p.getByText("TEST: kurulum dogrulama gorevi").isVisible());

// K6 — admin her şeyi silebilir
await p.locator("button", { hasText: "45 dakikalık toplantı" }).first().click();
await p.waitForSelector("dialog[open]");
ok("K6: admin tohum görevi silebilir", await p.locator('dialog button:text-is("Sil")').isVisible());
await p.locator('dialog button:text-is("Kapat")').click();

// --- Yunus (admin değil) oturumu ---
const y = await yeniOturum("yunuskekec48@gmail.com");
await y.goto(`${BASE}/gorevler`, { waitUntil: "networkidle" });
ok("Yunus da 37 görevi görüyor", (await y.getByText(/^\d+ görev$/).textContent()) === "37 görev");
await y.locator("button", { hasText: "45 dakikalık toplantı" }).first().click();
await y.waitForSelector("dialog[open]");
ok("K6: admin olmayan başkasının görevini silemez", (await y.locator('dialog button:text-is("Sil")').count()) === 0);
ok("K6: gerekçe yazıyor", await y.locator("dialog").getByText(/yalnızca ekleyen veya Kürşad/).isVisible());

console.log(errs.length ? "\nJS HATASI:\n" + errs.join("\n") : "\nJS hatasi yok");
await b.close();
