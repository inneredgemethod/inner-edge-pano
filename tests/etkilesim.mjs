/** Pano etkileşimleri: filtreler, durum, not, ekleme, K6 silme kuralı. */
import { chromium } from "playwright";
import { db, envYukle, girisYap } from "./oturum.mjs";

envYukle();
const BASE = process.env.PANO_URL ?? "http://localhost:3000";
const ok = (n, c) => console.log(`${c ? "✓" : "✗ BASARISIZ"}  ${n}`);
const TEST_GOREV = `TEST etkilesim ${Date.now().toString(36)}`;

// Baslamadan once temizle: bu paketler mutlak gorev sayisi kontrol ediyor.
// Onceki bir kosu yarida kalirsa bıraktığı TEST gorevleri buradaki sayimi
// bozuyor ve hata sanki burada varmis gibi gorunuyor.
await db().temizle();

const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
const p = await ctx.newPage();
const errs = [];
p.on("pageerror", (e) => errs.push(e.message));

const alt = (t) => p.locator(`nav[aria-label="Alt sekme çubuğu"] a:text-is("${t}")`);
const benSecici = () => p.locator("header select").first();
/**
 * "Ben"i değiştirir ve arayüzün gerçekten güncellendiğini bekler.
 * Sadece selectOption + sabit bekleme kırılgan: seçim state'e yansımadan
 * devam edilirse K6 kontrolleri bazen eski kişiyle koşuyor.
 */
const benSec = async (ad) => {
  await benSecici().selectOption(ad);
  await p.waitForFunction(
    (beklenen) => document.querySelector("header select")?.value === beklenen,
    ad,
  );
  await p.waitForFunction(
    (beklenen) => document.cookie.includes(`pano-kisi=${encodeURIComponent(beklenen)}`),
    ad,
  );
};
const acGorev = async (baslik) => {
  await p.locator("button", { hasText: baslik }).first().click();
  await p.waitForSelector("dialog[open]");
};

await girisYap(p, BASE, "Kürşad");
ok("Ben seçicisi üstte", await benSecici().isVisible());
ok("seçili kişi Kürşad", (await benSecici().inputValue()) === "Kürşad");

await p.goto(`${BASE}/gorevler`, { waitUntil: "networkidle" });
ok("37 görev veritabanından", (await p.getByText(/^\d+ görev$/).textContent()) === "37 görev");

// Durum
await acGorev("45 dakikalık toplantı");
await p.locator('dialog button:text-is("Yapılıyor")').click();
ok("durum 'Yapılıyor' oldu", (await p.locator('dialog [aria-pressed="true"]:text-is("Yapılıyor")').count()) === 1);

// Not — aktör seçili kişi olmalı
await p.locator('dialog input[placeholder^="Not ekle"]').fill("Sarah'a saat sordum.");
await p.locator('dialog button:text-is("Ekle")').click();
ok("not akışa düştü", await p.locator("dialog").getByText("Sarah'a saat sordum.").isVisible());
ok("not Kürşad adına yazıldı", await p.locator("dialog").getByText(/Kürşad · \d/).first().isVisible());
await p.locator('dialog button:text-is("Kapat")').click();

// Sekmeler arası
await alt("Genel").click();
await p.waitForURL("**/");
await alt("Görevler").click();
await p.waitForURL("**/gorevler");
ok("durum sekme değişince korundu",
   (await p.locator("button", { hasText: "45 dakikalık toplantı" }).first().innerText()).includes("Yapılıyor"));

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

// Benim sekmesi seçili kişiyi izliyor
await alt("Benim").click();
await p.waitForURL("**/benim");
// Baslik artik sadece isim: altina "Görevlerim / Notlarım" sekmeleri geldi.
ok("Benim sekmesi Kürşad'ı gösteriyor", (await p.locator("h1").innerText()) === "Kürşad");

// Ben'i değiştir -> Benim sekmesi takip etsin
await benSec("Yunus");
ok("Ben değişince Benim sekmesi de değişti", (await p.locator("h1").innerText()) === "Yunus");
await benSec("Kürşad");

// Görev ekleme
await alt("Ekle").click();
await p.waitForURL("**/ekle");
await p.getByLabel("Başlık").fill(TEST_GOREV);
await p.locator('button:text-is("Ekle")').click();
await p.waitForURL("**/gorevler");
await p.locator('button:text-is("Herkes")').click();
let eklendi = false;
for (let i = 0; i < 20; i++) {
  if (await p.getByText(TEST_GOREV).count()) { eklendi = true; break; }
  await p.waitForTimeout(500);
}
ok("yeni görev listede", eklendi);

// Silme kuralı (Faz 5 A5): K6 kaldırıldı, herkes her görevi silebilir.
// Veritabanında zaten zorlanamıyordu (kimlik beyan, DELETE'te karşılaştırılacak
// alan yok); arayüzde tutmak korunuyormuş yanılsaması veriyordu.
await acGorev("45 dakikalık toplantı");
ok("Kürşad tohum görevini silebiliyor", await p.locator('dialog button:text-is("Sil")').isVisible());
await p.locator('dialog button:text-is("Kapat")').click();

await benSec("Yunus");
await acGorev("45 dakikalık toplantı");
ok("Yunus da silebiliyor (K6 kalktı)", await p.locator('dialog button:text-is("Sil")').isVisible());
ok("eski K6 gerekçesi kalmadı",
   (await p.locator("dialog").getByText(/yalnızca ekleyen veya Kürşad/).count()) === 0);
await p.locator('dialog button:text-is("Kapat")').click();

await p.getByText(TEST_GOREV).click();
await p.waitForSelector("dialog[open]");
ok("Yunus, Kürşad'ın eklediğini de silebiliyor", await p.locator('dialog button:text-is("Sil")').isVisible());
await p.locator('dialog button:text-is("Kapat")').click();

const { gorev, log } = await db().temizle();
console.log(`temizlik: ${gorev} gorev, ${log} log kaldi`);
console.log(errs.length ? "\nJS HATASI:\n" + errs.join("\n") : "\nJS hatasi yok");
await b.close();
