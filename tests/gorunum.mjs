/** Kontrol noktası 1: kadro, görünüm modları, arama, URL filtreleri. */
import { chromium } from "playwright";
import { db, envYukle, girisYap } from "./oturum.mjs";

envYukle();
const BASE = process.env.PANO_URL ?? "http://localhost:3000";
const ok = (n, c) => console.log(`${c ? "✓" : "✗ BASARISIZ"}  ${n}`);
const ET = `TEST gorunum ${Date.now().toString(36)}`;

await db().temizle();

const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
const p = await ctx.newPage();
const errs = [];
p.on("pageerror", (e) => errs.push(e.message));
await girisYap(p, BASE, "Kürşad");

const sayi = async () => Number((await p.getByText(/^\d+ görev$/).textContent()).split(" ")[0]);
const url = () => new URL(p.url());

// ---------- Kadro veritabanından (C2) ----------
await p.goto(`${BASE}/gorevler`, { waitUntil: "networkidle" });
ok("kişi filtresi kadrodan geliyor",
   (await p.locator('button:text-is("Kürşad")').count()) === 1 &&
   (await p.locator('button:text-is("Sarah")').count()) === 1 &&
   (await p.locator('button:text-is("Yunus")').count()) === 1);

await p.locator("button", { hasText: "45 dakikalık toplantı" }).first().click();
await p.waitForSelector("dialog[open]");
// Menu sabit bir listeden degil, kadro tablosundan geliyor: arsivli kisiler
// (Sibel/Emine/Ortak) burada YOK. Arsivli sorumlusu olan bir gorevin kendi
// menusunde nasil davrandigi tests/arsiv.mjs'de.
const sorumlular = await p.locator("dialog select").first().locator("option").allInnerTexts();
ok(`sorumlu menüsü aktif kadrodan (${sorumlular.join(",")})`,
   sorumlular.length === 3 && sorumlular.includes("Kürşad") && !sorumlular.includes("Sibel"));
await p.locator('dialog button:text-is("Kapat")').click();

// "Ben" menüsünde yalnızca panoya girenler olmalı
const benSecenekleri = await p.locator("header select").first().locator("option").allInnerTexts();
ok(`"Ben" menüsünde sadece 3 kişi (${benSecenekleri.join(",")})`,
   benSecenekleri.length === 3 && !benSecenekleri.includes("Sibel"));

// ---------- Ayristirici kadroyu VERITABANINDAN okuyor ----------
// Bu, C2'de duzelen hatanin testi: eskiden sorumlu listeleri kodda sabitti ve
// ayristirici yalnizca giris yapan 3 kisiyi taniyordu. Artik kaynak tek:
// kisiler tablosu. (Arsivli isimlerin uyari vermesi tests/arsiv.mjs'de.)
await p.goto(`${BASE}/ekle`, { waitUntil: "networkidle" });
await p.locator('button:text-is("Toplantı notu")').click();
await p.getByLabel("Toplantı notu").fill(`${ET} yunus @Yunus`);
await p.waitForTimeout(300);
ok("aktif kadro ismi tanınıyor", (await p.getByText(/kimse ile eşleşmedi/).count()) === 0);
await p.locator('button:text-is("1 görevi ekle")').click();
// Toplanti notu artik /gorevler'e yonlendirmiyor (toplantida sirayla kisi
// girebilmek icin sayfada kaliyor); onay satirini bekliyoruz.
await p.getByText(/1 görev eklendi/).first().waitFor({ timeout: 15000 });
await p.waitForTimeout(1200);
{
  const URL_ = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const r = await (await fetch(
    `${URL_}/rest/v1/tasks?select=title,owner&title=like.*${encodeURIComponent(ET)}*`,
    { headers: { apikey: KEY, Authorization: `Bearer ${KEY}` } })).json();
  ok(`@Yunus sorumlu olarak kaydedildi (${r[0]?.owner})`, r[0]?.owner === "Yunus");
}

// ---------- Tarihten gruplama (B1) ----------
await p.goto(`${BASE}/gorevler`, { waitUntil: "networkidle" });
const basliklar = await p.locator("main section > h3").allInnerTexts();
ok(`gruplar tarihten türüyor (${basliklar.map((x) => x.split(" ·")[0]).join(" | ")})`,
   basliklar.some((h) => h.startsWith("Gecikmiş")) && basliklar.some((h) => h.startsWith("Bu hafta")));
ok("eski hafta etiketleri kalmadı", !basliklar.some((h) => h.includes("14-20 Eyl")));

// ---------- Arama (B5) ----------
const hepsi = await sayi();
await p.getByLabel("Görevlerde ara").fill("instagram");
await p.waitForTimeout(400);
const aramaSonucu = await sayi();
ok(`arama daraltıyor (${hepsi} -> ${aramaSonucu})`, aramaSonucu > 0 && aramaSonucu < hepsi);
ok("arama URL'ye yazıldı", url().searchParams.get("q") === "instagram");

// Turkce buyuk/kucuk harf duyarsizligi
await p.getByLabel("Görevlerde ara").fill("İNSTAGRAM");
await p.waitForTimeout(400);
ok(`büyük harf/İ duyarsız (${await sayi()})`, (await sayi()) === aramaSonucu);

// Aciklama icinde arama
//
// Eskiden bir TOHUM gorevinin aciklamasindaki "stopaj" kelimesi araniyordu.
// Ekip o gorevi silince test kirildi — arama kendi ekledigi goreve dayanmali.
{
  const ARANAN = `zxq${Date.now().toString(36)}`;
  // Gorev dogrudan veritabanina yaziliyor: arayuzden eklemek bir de
  // router.refresh() beklemek demek ve arama ona yetisemiyordu.
  await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/tasks`, {
    method: "POST",
    headers: {
      apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      phase_id: "A", title: `${ET} aciklamali`, owner: "Kürşad",
      what: `Icinde ${ARANAN} gecen aciklama.`,
    }),
  });
  await p.goto(`${BASE}/gorevler`, { waitUntil: "networkidle" });
  await p.getByLabel("Görevlerde ara").fill(ARANAN);
  await p.waitForTimeout(600);
  ok(`açıklama içinde de arıyor (${await sayi()})`, (await sayi()) === 1);
}
await p.getByLabel("Görevlerde ara").fill("");
await p.waitForTimeout(400);

// ---------- Filtreler URL'de ve linkten geri yukleniyor ----------
await p.locator('button:text-is("Sarah")').click();
await p.getByLabel("Yapılanları gizle").check();
await p.waitForTimeout(400);
const paylasilan = p.url();
ok(`filtreler URL'de (${url().search})`,
   url().searchParams.get("kisi") === "Sarah" && url().searchParams.get("bitenler") === "gizli");

const sarahSayisi = await sayi();
const p2 = await ctx.newPage();
await p2.goto(paylasilan, { waitUntil: "networkidle" });
await p2.waitForTimeout(500);
const p2Sayi = Number((await p2.getByText(/^\d+ görev$/).textContent()).split(" ")[0]);
ok(`paylaşılan link filtreyi geri yüklüyor (${p2Sayi})`, p2Sayi === sarahSayisi);
await p2.close();

await p.locator('button:text-is("Herkes")').click();
await p.getByLabel("Yapılanları gizle").uncheck();
await p.waitForTimeout(400);

// ---------- Hafta gorunumu (B2) ----------
await p.locator('button:text-is("Hafta")').click();
await p.waitForTimeout(500);
ok("hafta görünümü açıldı", await p.getByText("Bu hafta", { exact: true }).first().isVisible());
ok("görünüm URL'de", url().searchParams.get("gorunum") === "hafta");
const gunBasliklari = await p.locator("main section h3").allInnerTexts();
ok(`7 gün listeleniyor (${gunBasliklari.length})`, gunBasliklari.length >= 7);
ok("Pazartesi ilk gün", gunBasliklari[0].startsWith("Pzt"));

await p.getByLabel("Sonraki hafta").click();
await p.waitForTimeout(400);
ok("sonraki haftaya geçildi", !!url().searchParams.get("tarih"));
ok("Bugüne dön düğmesi çıktı", await p.locator('button:text-is("Bugüne dön")').isVisible());
await p.locator('button:text-is("Bugüne dön")').click();
await p.waitForTimeout(400);
ok("bugüne dönüldü", !url().searchParams.get("tarih"));

// ---------- Takvim (B3) ----------
await p.locator('button:text-is("Takvim")').click();
await p.waitForTimeout(500);
ok("takvim açıldı", await p.getByText(/^Eylül \d{4}$/).isVisible());
ok("42 günlük ızgara", (await p.locator('main button[aria-label*="görev"]').count()) === 42);

await p.locator('main button[aria-label^="17 Eyl"]').click();
await p.waitForTimeout(300);
ok("güne tıklayınca o günün görevleri açıldı",
   await p.getByText(/17 Eyl Per · \d+ görev/).isVisible());
await p.getByText("Sarah ve Yunus'la 45 dakikalık toplantı ayarla").last().click();
await p.waitForSelector("dialog[open]");
ok("takvimden detay açılıyor", await p.locator("dialog h2").isVisible());
await p.locator('dialog button:text-is("Kapat")').click();

// ---------- Genel bakis "Bu hafta" karti (B4) ----------
await p.goto(`${BASE}/`, { waitUntil: "networkidle" });
// Kart bolumune kilitle: "Kürşad" sayfada baska yerlerde de geciyor
// (header'daki "Ben" secicisinin <option>'lari dahil, onlar gorunur sayilmiyor).
const kart = p.locator("main section").filter({ hasText: "Hafta görünümü" }).first();
ok("Bu hafta kartı var", await kart.getByRole("heading", { name: "Bu hafta" }).isVisible());
ok("kart kişi başı sayı gösteriyor",
   await kart.getByText(/Kürşad/).first().isVisible() && await kart.getByText(/açık/).first().isVisible());
ok("hafta görünümüne link var", await kart.getByText("Hafta görünümü →").isVisible());

const { gorev, log } = await db().temizle();
console.log(`temizlik: ${gorev} gorev, ${log} log kaldi`);
console.log(errs.length ? "\nJS HATASI:\n" + errs.join("\n") : "\nJS hatasi yok");
await b.close();
