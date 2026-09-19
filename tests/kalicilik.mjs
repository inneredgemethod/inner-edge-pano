/**
 * Yazma kalıcı mı, log doğru kişiyi yazıyor mu, Realtime çalışıyor mu.
 * İki ayrı tarayıcı oturumu: Kürşad ve Yunus.
 */
import { chromium } from "playwright";
import { db, envYukle, girisYap } from "./oturum.mjs";

envYukle();
const BASE = process.env.PANO_URL ?? "http://localhost:3000";
const ok = (n, c) => console.log(`${c ? "✓" : "✗ BASARISIZ"}  ${n}`);
const HEDEF = "45 dakikalık toplantı";
const NOT = `TEST notu ${Date.now().toString(36)}`;
const GOREV = `TEST kalicilik ${Date.now().toString(36)}`;

// Baslamadan once temizle: bu paketler mutlak gorev sayisi kontrol ediyor.
// Onceki bir kosu yarida kalirsa bıraktığı TEST gorevleri buradaki sayimi
// bozuyor ve hata sanki burada varmis gibi gorunuyor.
await db().temizle();

const b = await chromium.launch();
const oturum = async (kisi) => {
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const p = await ctx.newPage();
  await girisYap(p, BASE, kisi);
  return p;
};
const ac = async (p, baslik = HEDEF) => {
  await p.locator("button", { hasText: baslik }).first().click();
  await p.waitForSelector("dialog[open]");
};
/** Realtime beklerken yenilemeden yokla. */
const bekle = async (p, kontrol, sn = 20) => {
  for (let i = 0; i < sn * 2; i++) {
    if (await kontrol()) return true;
    await p.waitForTimeout(500);
  }
  return false;
};

const errs = [];
const k = await oturum("Kürşad");
const y = await oturum("Yunus");
k.on("pageerror", (e) => errs.push("K: " + e.message));
y.on("pageerror", (e) => errs.push("Y: " + e.message));

await k.goto(`${BASE}/gorevler`, { waitUntil: "networkidle" });
await y.goto(`${BASE}/gorevler`, { waitUntil: "networkidle" });

// 1) Durum kalıcı
await ac(k);
await k.locator('dialog button:text-is("Yapılıyor")').click();
await k.waitForTimeout(1200);
await k.locator('dialog button:text-is("Kapat")').click();
await k.reload({ waitUntil: "networkidle" });
ok("durum yenilendikten sonra da duruyor",
   (await k.locator("button", { hasText: HEDEF }).first().innerText()).includes("Yapılıyor"));

// 2) Realtime: Yunus yenilemeden görüyor
ok("Realtime: durum Yunus'a düştü",
   await bekle(y, async () =>
     (await y.locator("button", { hasText: HEDEF }).first().innerText()).includes("Yapılıyor")));

// 3) Not kalıcı ve doğru kişiye yazılı
await ac(k);
await k.locator('dialog input[placeholder^="Not ekle"]').fill(NOT);
await k.locator('dialog button:text-is("Ekle")').click();
await k.waitForTimeout(1200);
await k.reload({ waitUntil: "networkidle" });
await ac(k);
ok("not yenilendikten sonra da duruyor", await k.locator("dialog").getByText(NOT).isVisible());
ok("not Kürşad adına", await k.locator("dialog").getByText(/Kürşad · \d/).first().isVisible());
await k.locator('dialog button:text-is("Kapat")').click();

// 4) Realtime: not Yunus'a düşüyor
ok("Realtime: not Yunus'a düştü", await bekle(y, async () => (await y.getByText(NOT).count()) > 0));

// 5) Yunus yazınca log ONUN adına olmalı (beyan edilen kimlik)
await ac(y);
await y.locator('dialog button:text-is("Yapıldı")').click();
await y.waitForTimeout(1500);
await y.locator('dialog button:text-is("Kapat")').click();
{
  const URL_ = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const olaylar = await (await fetch(`${URL_}/rest/v1/task_events?select=kind,body,actor,created_at&kind=eq.status&order=created_at.asc`,
    { headers: { apikey: KEY, Authorization: `Bearer ${KEY}` } })).json();
  // ORDER ZORUNLU: PostgREST siralamasiz rastgele donuyor ve ".at(-1)" bazen
  // bir onceki adimin (Kürşad'in) kaydini yakaliyordu.
  const sonu = olaylar.at(-1);
  ok(`log Yunus adına yazıldı (${sonu?.body} — ${sonu?.actor})`, sonu?.actor === "Yunus");
}

// 6) Görev ekleme kalıcı
await k.goto(`${BASE}/ekle`, { waitUntil: "networkidle" });
await k.getByLabel("Başlık").fill(GOREV);
await k.locator('button:text-is("Ekle")').click();
await k.waitForURL("**/gorevler");
await k.reload({ waitUntil: "networkidle" });
ok("yeni görev yenilendikten sonra da var", await k.getByText(GOREV).isVisible());

// 7) K6: Yunus, Kürşad'ın eklediğini silemiyor
ok("Realtime: yeni görev Yunus'a düştü", await bekle(y, async () => (await y.getByText(GOREV).count()) > 0));
// K6 Faz 5'te kaldırıldı: herkes her görevi silebilir.
await ac(y, GOREV);
ok("Yunus, Kürşad'ın eklediğini silebiliyor (K6 kalktı)",
   await y.locator('dialog button:text-is("Sil")').isVisible());
await y.locator('dialog button:text-is("Kapat")').click();

// 8) Silme kalıcı
await ac(k, GOREV);
await k.locator('dialog button:text-is("Sil")').click();
// Silme artik iki adimli: "Sil" onay satirini aciyor, "Evet, sil" uyguluyor.
await k.locator('dialog button:text-is("Evet, sil")').click();
await k.waitForTimeout(1500);
await k.reload({ waitUntil: "networkidle" });
ok("silinen görev geri gelmiyor", (await k.getByText(GOREV).count()) === 0);

const { gorev, log } = await db().temizle();
console.log(`temizlik: ${gorev} gorev, ${log} log kaldi`);
console.log(errs.length ? "\nJS HATASI:\n" + errs.join("\n") : "\nJS hatasi yok");
await b.close();
