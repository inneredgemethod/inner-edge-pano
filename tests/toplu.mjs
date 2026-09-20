/** Paket A: toplu seçim ve toplu işlemler. */
import { chromium } from "playwright";
import { db, envYukle, girisYap } from "./oturum.mjs";

envYukle();
const BASE = process.env.PANO_URL ?? "http://localhost:3000";
const ok = (n, c) => console.log(`${c ? "✓" : "✗ BASARISIZ"}  ${n}`);

// Baslamadan once temizle: bu paketler mutlak gorev sayisi kontrol ediyor.
// Onceki bir kosu yarida kalirsa bıraktığı TEST gorevleri buradaki sayimi
// bozuyor ve hata sanki burada varmis gibi gorunuyor.
await db().temizle();

// Baslangic sayisi VERITABANINDAN. Sabit 37 yazili olsaydi toplantidan sonra
// gercek gorevler girilince bu paket kirmiziya donerdi.
const _H = {
  apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
};
const oncesi = (await (await fetch(
  `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/tasks?select=id`, { headers: _H })).json()).length;

const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
const p = await ctx.newPage();
const errs = [];
p.on("pageerror", (e) => errs.push(e.message));

await girisYap(p, BASE, "Kürşad");

// Test için kendi görevlerimizi ekle — tohum veriye dokunmuyoruz.
const ETIKET = `TEST toplu ${Date.now().toString(36)}`;
for (let i = 1; i <= 3; i++) {
  await p.goto(`${BASE}/ekle`, { waitUntil: "networkidle" });
  await p.getByLabel("Başlık").fill(`${ETIKET} ${i}`);
  await p.locator('button:text-is("Ekle")').click();
  await p.waitForURL("**/gorevler");
}

await p.goto(`${BASE}/gorevler`, { waitUntil: "networkidle" });
const sayi = async () => Number((await p.getByText(/^\d+ görev$/).textContent()).split(" ")[0]);
const basta = await sayi();
ok(`3 test görevi eklendi (${basta})`, basta === oncesi + 3);

// Seçim modu
await p.locator('button:text-is("Seç")').click();
ok("seçim modu açıldı", await p.getByText(/Görünen \d+ görevin tümünü seç/).isVisible());
ok("satırlarda kutucuk var", (await p.locator('input[type="checkbox"][aria-label*="seç"]').count()) > 0);

// Tek tek seçim
await p.locator(`label:has-text("${ETIKET} 1") input[type="checkbox"]`).check();
await p.locator(`label:has-text("${ETIKET} 2") input[type="checkbox"]`).check();
ok("2 seçili yazıyor", await p.getByText("2 seçili").isVisible());

// Toplu sorumlu değiştirme
await p.getByLabel("Sorumlu ata").selectOption("Yunus");
await p.waitForTimeout(1500);
await p.reload({ waitUntil: "networkidle" });
{
  const URL_ = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const H = { apikey: KEY, Authorization: `Bearer ${KEY}` };
  const r = await (await fetch(
    `${URL_}/rest/v1/tasks?select=title,owner&title=like.${encodeURIComponent(ETIKET)}*&order=title`,
    { headers: H })).json();
  ok(`toplu sorumlu değişti (${r.map((x) => x.owner).join(",")})`,
     r[0].owner === "Yunus" && r[1].owner === "Yunus" && r[2].owner === "Kürşad");

  const loglar = await (await fetch(`${URL_}/rest/v1/task_events?select=kind,body,actor&kind=eq.edit`,
    { headers: H })).json();
  ok(`toplu değişiklik loglandı (${loglar.length} kayıt, aktör ${loglar[0]?.actor})`,
     loglar.length === 2 && loglar.every((l) => l.actor === "Kürşad"));
}

// Tümünü seç
await p.locator('button:text-is("Seç")').click();
await p.getByText(/Görünen \d+ görevin tümünü seç/).locator("input").check();
ok(`tümünü seç çalıştı (${basta} seçili)`, await p.getByText(`${basta} seçili`).isVisible());

// Filtre + tümünü seç: sadece görünenler seçilmeli
await p.getByText(/Görünen \d+ görevin tümünü seç/).locator("input").uncheck();
await p.locator('button:text-is("Sarah")').click();
const sarahSayi = await sayi();
await p.getByText(/Görünen \d+ görevin tümünü seç/).locator("input").check();
ok(`filtreliyken sadece görünenler seçildi (${sarahSayi})`, await p.getByText(`${sarahSayi} seçili`).isVisible());
await p.getByText(/Görünen \d+ görevin tümünü seç/).locator("input").uncheck();
await p.locator('button:text-is("Herkes")').click();

// Toplu silme + onay
await p.locator(`label:has-text("${ETIKET} 1") input[type="checkbox"]`).check();
await p.locator(`label:has-text("${ETIKET} 2") input[type="checkbox"]`).check();
await p.locator(`label:has-text("${ETIKET} 3") input[type="checkbox"]`).check();
await p.locator('button:text-is("Sil")').click();
await p.waitForSelector("dialog[open]");
ok("silme onayı sayıyı yazıyor", await p.getByText("3 görev silinecek").isVisible());

await p.locator('dialog button:text-is("Vazgeç")').click();
await p.waitForTimeout(300);
ok("vazgeçince silinmedi", (await sayi()) === basta);

await p.locator('button:text-is("Sil")').click();
await p.waitForSelector("dialog[open]");
await p.locator('dialog button:text-is("3 görevi sil")').click();
await p.waitForTimeout(1500);
await p.reload({ waitUntil: "networkidle" });
ok(`toplu silme çalıştı (${await sayi()})`, (await sayi()) === oncesi);
ok("seçim modu kapandı", (await p.locator('button:text-is("Seç")').count()) === 1);

const { gorev, log } = await db().temizle();
console.log(`temizlik: ${gorev} gorev, ${log} log kaldi`);
console.log(errs.length ? "\nJS HATASI:\n" + errs.join("\n") : "\nJS hatasi yok");
await b.close();
