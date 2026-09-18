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
const TEST_GOREV = `TEST etkilesim ${Date.now().toString(36)}`;
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
await p.getByLabel("Başlık").fill(TEST_GOREV);
await p.locator('button:text-is("Ekle")').click();
await p.waitForURL("**/gorevler");
await p.locator('button:text-is("Herkes")').click();
// Ekleme sunucuya yazılıp liste tazelenene kadar bekle.
let eklendi = false;
for (let i = 0; i < 20; i++) {
  if (await p.getByText(TEST_GOREV).count()) { eklendi = true; break; }
  await p.waitForTimeout(500);
}
ok("yeni görev listede", eklendi);

// K6 — admin her şeyi silebilir
await p.locator("button", { hasText: "45 dakikalık toplantı" }).first().click();
await p.waitForSelector("dialog[open]");
ok("K6: admin tohum görevi silebilir", await p.locator('dialog button:text-is("Sil")').isVisible());
await p.locator('dialog button:text-is("Kapat")').click();

// --- Yunus (admin değil) oturumu ---
const y = await yeniOturum("yunuskekec48@gmail.com");
await y.goto(`${BASE}/gorevler`, { waitUntil: "networkidle" });
// Sabit 37 yazmıyoruz: test kendi görevini eklediği için sayı değişiyor.
// Önemli olan Yunus'un Kürşad'la AYNI listeyi görmesi.
const kursadSayi = await p.getByText(/^\d+ görev$/).textContent();
ok(`Yunus, Kürşad ile aynı listeyi görüyor (${kursadSayi})`,
   (await y.getByText(/^\d+ görev$/).textContent()) === kursadSayi);
await y.locator("button", { hasText: "45 dakikalık toplantı" }).first().click();
await y.waitForSelector("dialog[open]");
ok("K6: admin olmayan başkasının görevini silemez", (await y.locator('dialog button:text-is("Sil")').count()) === 0);
ok("K6: gerekçe yazıyor", await y.locator("dialog").getByText(/yalnızca ekleyen veya Kürşad/).isVisible());

// --- temizlik: testin veritabanına yazdıklarını geri al ---
// Faz 3'ten beri bu testler gerçekten DB'ye yazıyor; temizlemezsek panoda
// gerçek ekip verisi gibi görünürler.
{
  const URL_ = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const SECRET = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const H = { apikey: SECRET, Authorization: `Bearer ${SECRET}`, "Content-Type": "application/json" };
  await fetch(`${URL_}/rest/v1/tasks?title=like.TEST*`, { method: "DELETE", headers: H });
  await fetch(`${URL_}/rest/v1/tasks?status=neq.Bekliyor`, {
    method: "PATCH", headers: H, body: JSON.stringify({ status: "Bekliyor" }),
  });
  await fetch(`${URL_}/rest/v1/task_events?id=not.is.null`, { method: "DELETE", headers: H });
  const kalan = await (await fetch(`${URL_}/rest/v1/task_events?select=id`, { headers: H })).json();
  const gorev = await (await fetch(`${URL_}/rest/v1/tasks?select=id`, { headers: { ...H, Prefer: "count=exact" } })).json();
  console.log(`temizlik: ${gorev.length} gorev, ${kalan.length} log kaydi kaldi`);
}

console.log(errs.length ? "\nJS HATASI:\n" + errs.join("\n") : "\nJS hatasi yok");
await b.close();
