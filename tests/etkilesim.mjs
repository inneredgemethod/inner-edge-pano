import { chromium } from "playwright";
const BASE = process.env.PANO_URL ?? "http://localhost:3000";
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, locale: "tr-TR" });
const p = await ctx.newPage();
const errs = [];
p.on("pageerror", (e) => errs.push(e.message));
const ok = (n, c) => console.log(`${c ? "✓" : "✗ BASARISIZ"}  ${n}`);

// 1) Durum değiştirme
await p.goto(`${BASE}/gorevler`, { waitUntil: "networkidle" });
const before = await p.getByText(/^\d+ görev$/).textContent();
await p.locator("button", { hasText: "45 dakikalık toplantı" }).first().click();
await p.waitForSelector("dialog[open]");
await p.locator('dialog button:text-is("Yapılıyor")').click();
ok("durum 'Yapılıyor' oldu", (await p.locator('dialog [aria-pressed="true"]:text-is("Yapılıyor")').count()) === 1);

// 2) Not ekleme
await p.locator('dialog input[placeholder^="Not ekle"]').fill("Sarah'a saat sordum, cevap bekliyorum.");
await p.locator('dialog button:text-is("Ekle")').click();
ok("not akışa düştü", await p.locator("dialog").getByText("Sarah'a saat sordum").isVisible());
ok("notta kim/ne zaman var", await p.locator("dialog").getByText(/Kürşad · \d/).first().isVisible());
await p.locator('dialog button:text-is("Kapat")').click();

// 3) Durum listede kaldı mı (sekmeler arası state)
await p.locator(`nav[aria-label="Alt sekme çubuğu"] a:text-is("Genel")`).click();
await p.waitForURL("**/");
await p.locator(`nav[aria-label="Alt sekme çubuğu"] a:text-is("Görevler")`).click();
await p.waitForURL("**/gorevler");
const kept = await p.locator("button", { hasText: "45 dakikalık toplantı" }).first().innerText();
ok("durum sekme değişince korundu", kept.includes("Yapılıyor"));

// 4) Filtreler
await p.locator('button:text-is("Sarah")').click();
const sarahCount = Number((await p.getByText(/^\d+ görev$/).textContent()).split(" ")[0]);
ok(`kişi filtresi çalışıyor (Sarah: ${sarahCount}, toplam: ${before})`, sarahCount === 13);
await p.locator('button:text-is("Herkes")').click();
await p.getByLabel("Sadece takılan / geciken").check();
const lateCount = Number((await p.getByText(/^\d+ görev$/).textContent()).split(" ")[0]);
ok(`geciken filtresi çalışıyor (${lateCount} geciken)`, lateCount > 0 && lateCount < 37);
await p.getByLabel("Sadece takılan / geciken").uncheck();

// 5) Faz filtresi
await p.locator('button:has-text("2 · Sosyal medya")').click();
ok("faz filtresi çalışıyor", (await p.getByText(/^\d+ görev$/).textContent()) === "10 görev");

// 6) Kişi değiştirme -> Benim sekmesi
await p.locator("header select").first().selectOption("Yunus");
await p.locator(`nav[aria-label="Alt sekme çubuğu"] a:text-is("Benim")`).click();
await p.waitForURL("**/benim");
ok("Benim sekmesi kişiyi izliyor", await p.getByText("Yunus — benim görevlerim").isVisible());

// 7) Görev ekleme
await p.locator(`nav[aria-label="Alt sekme çubuğu"] a:text-is("Ekle")`).click();
await p.getByLabel("Başlık").fill("TEST: kurulum dogrulama gorevi");
await p.locator('button:text-is("Ekle")').click();
await p.waitForURL("**/gorevler");
await p.locator('button:text-is("Herkes")').click();
ok("yeni görev listede", await p.getByText("TEST: kurulum dogrulama gorevi").isVisible());

// 8) K6: Yunus kendi eklediğini silebilir
await p.getByText("TEST: kurulum dogrulama gorevi").click();
await p.waitForSelector("dialog[open]");
ok("ekleyen silebiliyor (K6)", await p.locator('dialog button:text-is("Sil")').isVisible());
await p.locator('dialog button:text-is("Sil")').click();
ok("silindi", (await p.getByText("TEST: kurulum dogrulama gorevi").count()) === 0);

// 9) K6: Yunus tohum görevi silemez
await p.locator("button", { hasText: "45 dakikalık toplantı" }).first().click();
await p.waitForSelector("dialog[open]");
ok("başkasının görevinde Sil yok (K6)", (await p.locator('dialog button:text-is("Sil")').count()) === 0);
ok("gerekçe yazıyor", await p.locator("dialog").getByText(/yalnızca ekleyen veya Kürşad/).isVisible());

console.log(errs.length ? "\nJS HATASI:\n" + errs.join("\n") : "\nJS hatasi yok");
await b.close();
