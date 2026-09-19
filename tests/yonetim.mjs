/** Kontrol noktası 2: faz + kişi yönetimi, tekrarlayan görev, şablon, JSON aktarım. */
import { chromium } from "playwright";
import { db, envYukle, girisYap } from "./oturum.mjs";

envYukle();
const BASE = process.env.PANO_URL ?? "http://localhost:3000";
const ok = (n, c) => console.log(`${c ? "✓" : "✗ BASARISIZ"}  ${n}`);
const D = Date.now().toString(36);
const FAZ = `TEST faz ${D}`;
const KISI = `TEST${D.slice(-4)}`;

const URL_ = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const H = { apikey: KEY, Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" };
const dbAl = async (yol) => (await fetch(`${URL_}/rest/v1/${yol}`, { headers: H })).json();

await db().temizle();

// Testin BASLANGICTAKI gorev kimliklerini not et. Sonda yalnizca bunlarin
// disindakiler silinecek: "created_by = Kursad olanlari sil" demek, Kursad'in
// gercek gorevlerini de silmek olurdu.
const baslangicIdleri = new Set((await dbAl("tasks?select=id")).map((t) => t.id));

const b = await chromium.launch();
const ctx = await b.newContext({
  viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, acceptDownloads: true,
});
const p = await ctx.newPage();
const errs = [];
p.on("pageerror", (e) => errs.push(e.message));
await girisYap(p, BASE, "Kürşad");

// ============ FAZ YÖNETİMİ ============
await p.goto(`${BASE}/ayarlar`, { waitUntil: "networkidle" });
ok("Faz yönetimi bölümü var", await p.getByRole("heading", { name: "Fazlar" }).isVisible());

await p.getByLabel("Yeni faz adı").fill(FAZ);
await p.locator('form:has([aria-label="Yeni faz adı"]) button[type="submit"]').click();
await p.waitForTimeout(1800);
{
  const f = await dbAl(`phases?select=id,name,sort&name=eq.${encodeURIComponent(FAZ)}`);
  ok(`faz eklendi, id addan türedi (${f[0]?.id})`, !!f[0] && /^test-faz/.test(f[0].id));
}
ok("yeni faz listede", await p.getByText(FAZ).first().isVisible());

// Düzenle
await p.getByLabel(`${FAZ} düzenle`).click();
await p.getByLabel("Dönem etiketi").fill("1 – 7 Ocak");
await p.locator('button:text-is("Kaydet")').click();
await p.waitForTimeout(1800);
{
  const f = await dbAl(`phases?select=period&name=eq.${encodeURIComponent(FAZ)}`);
  ok(`faz düzenlendi (${f[0]?.period})`, f[0]?.period === "1 – 7 Ocak");
}

// Sırala (yukarı)
{
  const once = await dbAl(`phases?select=sort&name=eq.${encodeURIComponent(FAZ)}`);
  await p.getByLabel(`${FAZ} yukarı`).click();
  await p.waitForTimeout(2200);
  const sonra = await dbAl(`phases?select=sort&name=eq.${encodeURIComponent(FAZ)}`);
  ok(`faz sırası değişti (${once[0]?.sort} -> ${sonra[0]?.sort})`, sonra[0]?.sort < once[0]?.sort);
}

// Arşivle → menülerden düşmeli
await p.getByLabel(`${FAZ} arşivle`).click();
await p.waitForTimeout(1800);
await p.goto(`${BASE}/gorevler`, { waitUntil: "networkidle" });
ok("arşivli faz şeritte yok", (await p.getByText(FAZ).count()) === 0);

// Geri al
await p.goto(`${BASE}/ayarlar`, { waitUntil: "networkidle" });
await p.getByText(/Arşivdeki \d+ faz/).click();
await p.getByLabel(`${FAZ} arşivden geri al`).click();
await p.waitForTimeout(1800);
{
  const f = await dbAl(`phases?select=arsiv&name=eq.${encodeURIComponent(FAZ)}`);
  ok("faz arşivden geri alındı", f[0]?.arsiv === false);
}

// ============ KİŞİ YÖNETİMİ ============
ok("Kişi yönetimi bölümü var", await p.getByRole("heading", { name: "Kişiler" }).isVisible());
await p.getByLabel("Yeni kişi adı").fill(KISI);
await p.locator('form:has([aria-label="Yeni kişi adı"]) button[type="submit"]').click();
await p.waitForTimeout(1800);
{
  const k = await dbAl(`kisiler?select=display_name,sadece_sorumlu,arsiv&display_name=eq.${KISI}`);
  ok(`yeni kişi varsayılanı "panoya giremez" (${k[0]?.sadece_sorumlu})`, k[0]?.sadece_sorumlu === true);
}

// Sorumlu menüsünde çıkmalı, "Ben" menüsünde çıkmamalı
await p.goto(`${BASE}/ekle`, { waitUntil: "networkidle" });
const sorumlular = await p.getByLabel("Sorumlu").locator("option").allInnerTexts();
ok(`yeni kişi sorumlu menüsünde (${sorumlular.length} kişi)`, sorumlular.includes(KISI));
const benler = await p.locator("header select").first().locator("option").allInnerTexts();
ok("yeni kişi 'Ben' menüsünde YOK", !benler.includes(KISI));

// "Panoya girebilir" isaretle
await p.goto(`${BASE}/ayarlar`, { waitUntil: "networkidle" });
// .check() degil .click(): kutu `sadece_sorumlu` ile kontrol ediliyor ve
// deger sunucu tazelenince geliyor, .check() ise tiklama sonrasi ANINDA
// isaretli olmasini bekleyip hata veriyor.
await p.getByLabel(`${KISI} panoya girebilir`).click();
await p.waitForTimeout(2200);
{
  const k = await dbAl(`kisiler?select=sadece_sorumlu&display_name=eq.${KISI}`);
  ok("işaret veritabanına yazıldı", k[0]?.sadece_sorumlu === false);
}
await p.reload({ waitUntil: "networkidle" });
{
  const benler2 = await p.locator("header select").first().locator("option").allInnerTexts();
  ok("işaretlenince 'Ben' menüsüne girdi", benler2.includes(KISI));
}

// ============ TEKRARLAYAN GÖREV ============
await p.goto(`${BASE}/ekle`, { waitUntil: "networkidle" });
const TEKRAR_GOREV = `TEST tekrar ${D}`;
await p.getByLabel("Başlık").fill(TEKRAR_GOREV);
await p.getByLabel("Hedef tarih").fill("2026-10-05");
await p.locator('button:text-is("Ekle")').click();
await p.waitForURL("**/gorevler");
await p.waitForTimeout(1500);

await p.getByLabel("Görevlerde ara").fill(TEKRAR_GOREV);
await p.waitForTimeout(500);
await p.getByText(TEKRAR_GOREV).first().click();
await p.waitForSelector("dialog[open]");
await p.getByLabel("Tekrar").selectOption("haftalik");
await p.waitForTimeout(1500);
ok("tekrar rozeti çıktı", await p.locator("dialog").getByText(/Her hafta/).first().isVisible());

await p.locator('dialog button:text-is("Yapıldı")').click();
await p.waitForTimeout(2000);
await p.locator('dialog button:text-is("Kapat")').click();
{
  const g = await dbAl(`tasks?select=due_date,status&title=eq.${encodeURIComponent(TEKRAR_GOREV)}&order=due_date`);
  ok(`Yapıldı işaretlenince bir sonraki üretildi (${g.map((x) => x.due_date).join(", ")})`,
     g.length === 2 && g[1].due_date === "2026-10-12" && g[1].status === "Bekliyor");
}

// Cift uretim olmamali: Bekliyor'a al, tekrar Yapildi yap
await p.reload({ waitUntil: "networkidle" });
await p.getByLabel("Görevlerde ara").fill(TEKRAR_GOREV);
await p.waitForTimeout(500);
await p.getByText(TEKRAR_GOREV).first().click();
await p.waitForSelector("dialog[open]");
await p.locator('dialog button:text-is("Bekliyor")').click();
await p.waitForTimeout(1200);
await p.locator('dialog button:text-is("Yapıldı")').click();
await p.waitForTimeout(2000);
await p.locator('dialog button:text-is("Kapat")').click();
{
  const g = await dbAl(`tasks?select=id&title=eq.${encodeURIComponent(TEKRAR_GOREV)}`);
  ok(`tekrar işaretlemek çoğaltmadı (${g.length} kopya)`, g.length === 2);
}

// ============ ŞABLON ============
await p.goto(`${BASE}/ekle`, { waitUntil: "networkidle" });
await p.locator('button:text-is("Şablon")').click();
await p.waitForTimeout(400);
ok("şablon önizlemesi var", await p.getByText(/Önizleme — \d+ görev/).first().isVisible());
await p.getByLabel("Başlangıç tarihi").fill("2026-11-02");
await p.waitForTimeout(400);
const oncekiSayi = (await dbAl("tasks?select=id")).length;
await p.locator('button:text-is("10 görevi ekle")').click();
await p.waitForURL("**/gorevler");
await p.waitForTimeout(2500);
{
  const sonra = (await dbAl("tasks?select=id")).length;
  ok(`şablon 10 görev ekledi (${oncekiSayi} -> ${sonra})`, sonra === oncekiSayi + 10);
  const ilk = await dbAl(`tasks?select=due_date&title=like.*Zoom%20linklerini*`);
  ok(`tarih ofseti uygulandı (-7 gün: ${ilk[0]?.due_date})`, ilk[0]?.due_date === "2026-10-26");
}

// ============ JSON AKTARIM ============
await p.goto(`${BASE}/ayarlar`, { waitUntil: "networkidle" });
const indirme = p.waitForEvent("download");
await p.locator('button:text-is("Görevleri indir")').click();
const dosya = await indirme;
ok(`dışa aktarma indi (${dosya.suggestedFilename()})`,
   /^inner-edge-gorevler-\d{4}-\d{2}-\d{2}\.json$/.test(dosya.suggestedFilename()));

const { readFileSync } = await import("node:fs");
const icerik = JSON.parse(readFileSync(await dosya.path(), "utf8"));
const toplamGorev = (await dbAl("tasks?select=id")).length;
ok(`dosya tohum biçiminde ve tam (${icerik.tasks.length} görev, ${icerik.phases.length} faz)`,
   icerik.tasks.length === toplamGorev && icerik.phases.length >= 5 &&
   "what" in icerik.tasks[0] && "gate" in icerik.phases[0]);

// Ice aktar: yalnizca EKLEMELI
await p.locator('input[aria-label="İçe aktarılacak JSON dosyası"]')
  .setInputFiles(await dosya.path());
await p.waitForTimeout(800);
ok(`önizleme sayıyı gösteriyor`, await p.getByText(new RegExp(`${toplamGorev} görev`)).first().isVisible());
await p.getByLabel("İçe aktarmayı onayla").click();
await p.waitForTimeout(3000);
{
  const sonra = (await dbAl("tasks?select=id")).length;
  ok(`içe aktarma EKLEDİ, değiştirmedi (${toplamGorev} -> ${sonra})`, sonra === toplamGorev * 2);
}

await db().temizle();
// Sablon ve ice aktarma tohum disi gorev birakti. Yalnizca testin urettiklerini
// sil: baslangicta olmayan kimlikler.
const sonIdler = (await dbAl("tasks?select=id")).map((t) => t.id);
const testinUrettikleri = sonIdler.filter((id) => !baslangicIdleri.has(id));
if (testinUrettikleri.length) {
  await fetch(`${URL_}/rest/v1/tasks?id=in.(${testinUrettikleri.join(",")})`, {
    method: "DELETE", headers: H,
  });
}
await fetch(`${URL_}/rest/v1/task_events?id=not.is.null`, { method: "DELETE", headers: H });
const kalan = (await dbAl("tasks?select=id")).length;
console.log(`temizlik: ${testinUrettikleri.length} test gorevi silindi, ${kalan} gorev kaldi`);
console.log(errs.length ? "\nJS HATASI:\n" + errs.join("\n") : "\nJS hatasi yok");
await b.close();
