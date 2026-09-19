/** Paket A: açıklama alanları (A3), toplantı notu (A4), ayarlar/yedek (A2). */
import { chromium } from "playwright";
import { db, envYukle, girisYap } from "./oturum.mjs";

envYukle();
const BASE = process.env.PANO_URL ?? "http://localhost:3000";
const ok = (n, c) => console.log(`${c ? "✓" : "✗ BASARISIZ"}  ${n}`);
const ET = `TEST paketa ${Date.now().toString(36)}`;

// Baslamadan once temizle: bu paketler mutlak gorev sayisi kontrol ediyor.
// Onceki bir kosu yarida kalirsa bıraktığı TEST gorevleri buradaki sayimi
// bozuyor ve hata sanki burada varmis gibi gorunuyor.
await db().temizle();

const b = await chromium.launch();
const ctx = await b.newContext({
  viewport: { width: 390, height: 844 },
  isMobile: true,
  hasTouch: true,
  acceptDownloads: true,
});
const p = await ctx.newPage();
const errs = [];
p.on("pageerror", (e) => errs.push(e.message));
await girisYap(p, BASE, "Kürşad");

const sayi = async () => Number((await p.getByText(/^\d+ görev$/).textContent()).split(" ")[0]);
const dbBasliklari = async (desen) => {
  const URL_ = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return (
    await fetch(
      `${URL_}/rest/v1/tasks?select=title,owner,phase_id,due_date,what&title=like.*${encodeURIComponent(desen)}*&order=title`,
      { headers: { apikey: KEY, Authorization: `Bearer ${KEY}` } },
    )
  ).json();
};

// ---------- A3: Ekle formunda açıklamalar ----------
await p.goto(`${BASE}/ekle`, { waitUntil: "networkidle" });
ok("Ekle'de iki mod var", await p.locator('button:text-is("Toplantı notu")').isVisible());
await p.getByLabel("Başlık").fill(`${ET} A3`);
await p.getByLabel(/Ne yapılacak/).fill("Adım adım şunu yap.");
await p.getByLabel(/Neden önemli/).fill("Atlanırsa faz kayar.");
await p.getByLabel(/Bitti sayılır/).fill("Gruba yazıldı.");
await p.locator('button:text-is("Ekle")').click();
await p.waitForURL("**/gorevler");
await p.waitForTimeout(1500);
await p.reload({ waitUntil: "networkidle" });
await p.getByText(`${ET} A3`).click();
await p.waitForSelector("dialog[open]");
ok("açıklamalar kaydedildi", await p.locator("dialog").getByText("Adım adım şunu yap.").isVisible());
ok("üçü de kaydedildi", await p.locator("dialog").getByText("Gruba yazıldı.").isVisible());

// ---------- A3: detaydan düzenleme ----------
await p.locator('dialog button:text-is("Düzenle")').click();
await p.locator("dialog textarea").first().fill("Güncellenmiş adım.");
await p.locator('dialog button:text-is("Kaydet")').click();
await p.waitForTimeout(1500);
await p.reload({ waitUntil: "networkidle" });
await p.getByText(`${ET} A3`).click();
await p.waitForSelector("dialog[open]");
ok("detaydan düzenleme kalıcı", await p.locator("dialog").getByText("Güncellenmiş adım.").isVisible());
await p.locator('dialog button:text-is("Kapat")').click();

// ---------- A4: toplantı notu ----------
await p.goto(`${BASE}/ekle`, { waitUntil: "networkidle" });
await p.locator('button:text-is("Toplantı notu")').click();
await p.getByLabel("Toplantı notu").fill(
  `${ET} B1 @Sarah #C !25.09\n- ${ET} B2 @Yunus #2\n${ET} B3\n@Sarh bozuk ${ET} B4`,
);
ok("önizleme 4 görev sayıyor", await p.getByText(/Önizleme — 4 görev/).first().isVisible());
// Önizleme mobilde liste, masaüstünde tablo olarak render oluyor; ikisi de
// DOM'da, o yüzden .first().
ok("bozuk işaret uyarı veriyor", await p.getByText(/kimse ile eşleşmedi/).first().isVisible());
await p.locator('button:text-is("4 görevi ekle")').click();
// Artik /gorevler'e YONLENDIRMIYOR: toplantida ikinci kisinin satirlarini
// girmek icin sayfada kalmak gerekiyor. Onay satirini bekliyoruz.
await p.getByText(/4 görev eklendi/).first().waitFor({ timeout: 15000 });
await p.waitForTimeout(1500);

{
  const r = await dbBasliklari(ET);
  const bul = (son) => r.find((x) => x.title.endsWith(son));
  const b1 = bul("B1");
  const b2 = bul("B2");
  const b3 = bul("B3");
  const b4 = bul("B4");
  ok(
    `B1 işaretleri uygulandı (${b1?.owner}/${b1?.phase_id}/${b1?.due_date})`,
    b1?.owner === "Sarah" && b1?.phase_id === "C" && b1?.due_date === "2026-09-25",
  );
  ok(`B2: #2 -> faz B ve madde imi temiz ("${b2?.title}")`, b2?.phase_id === "B" && b2?.title === `${ET} B2`);
  // Varsayilan sorumlu artik "Ortak" degil, secilen kisi (girisYap -> Kürşad).
  // "Ortak" arsivlendigi icin eski sabit varsayilan arsivli kisiye atiyordu.
  ok(`B3 varsayılanlar (${b3?.owner}/${b3?.phase_id})`, b3?.owner === "Kürşad" && b3?.phase_id === "A");
  ok(`B4 bozuk işarete rağmen eklendi ("${b4?.title}")`, b4?.title === `bozuk ${ET} B4`);
}

// ---------- A2: Ayarlar ve yedek ----------
await p.goto(`${BASE}/ayarlar`, { waitUntil: "networkidle" });
ok("Ayarlar açıldı", await p.getByText("Panoyu sıfırla").first().isVisible());

const indirme = p.waitForEvent("download");
await p.locator('button:text-is("Yedeği indir")').click();
const dosya = await indirme;
ok(
  `yedek indi (${dosya.suggestedFilename()})`,
  /^inner-edge-pano-yedek-.*\.json$/.test(dosya.suggestedFilename()),
);

// Yedeğin içi gerçekten dolu mu
{
  const yol = await dosya.path();
  const { readFileSync } = await import("node:fs");
  const y = JSON.parse(readFileSync(yol, "utf8"));
  ok(
    `yedek içeriği dolu (${y.tasks.length} görev, ${y.phases.length} faz, ${y.kisiler.length} kişi)`,
    y.tasks.length > 0 && y.phases.length === 5 && y.kisiler.length === 6,
  );
}

// Sıfırlama onay kapısı
await p.locator('button:text-is("Panoyu sıfırla…")').click();
await p.waitForSelector("dialog[open]");
const silDugmesi = p.locator('dialog button:text-is("Yedekle ve sıfırla")');
ok("onay yazılmadan sıfırlama kapalı", await silDugmesi.isDisabled());
await p.getByLabel(/Onay için/).fill("sil");
ok("küçük harf 'sil' kabul edilmiyor", await silDugmesi.isDisabled());
await p.getByLabel(/Onay için/).fill("SİL");
ok("doğru onayla düğme açıldı", await silDugmesi.isEnabled());

// YIKICI ADIM BİLEREK KOŞULMUYOR:
// "Yedekle ve sıfırla" panodaki TÜM görevleri siler. Toplantıya kadar 37 gerçek
// görev orada duracak, o yüzden otomatik test son tıklamayı YAPMIYOR.
// Buraya kadar her şey doğrulandı: yedek iniyor ve dolu, onay kelimesi olmadan
// düğme kapalı, yanlış yazımda açılmıyor, doğru yazımda açılıyor.
await p.locator('dialog button:text-is("Vazgeç")').click();
await p.waitForTimeout(300);
await p.goto(`${BASE}/gorevler`, { waitUntil: "networkidle" });
ok(`vazgeçince pano duruyor (${await sayi()} görev)`, (await sayi()) > 0);

const { gorev, log } = await db().temizle();
console.log(`temizlik: ${gorev} gorev, ${log} log kaldi`);
console.log(errs.length ? "\nJS HATASI:\n" + errs.join("\n") : "\nJS hatasi yok");
await b.close();
