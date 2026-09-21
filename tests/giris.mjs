/** Tek şifreli giriş akışı. */
import { chromium } from "playwright";
import { db, envYukle, girisYap } from "./oturum.mjs";

envYukle();
const BASE = process.env.PANO_URL ?? "http://localhost:3000";
const ok = (n, c) => console.log(`${c ? "✓" : "✗ BASARISIZ"}  ${n}`);
// Beklenen sayilar VERITABANINDAN geliyor, sabit degil. Tohumdaki 37 gorev
// yazili olsaydi, toplantidan sonra gercek gorevler girilince butun paket
// kirmiziya donerdi — testler o gun en cok lazim olacagi an ise yaramazdi.
const _H = {
  apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
};
const dbSay = async (sorgu = "") =>
  (await (await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/tasks?select=id${sorgu}`,
    { headers: _H })).json()).length;


// Baslamadan once temizle: bu paketler mutlak gorev sayisi kontrol ediyor.
// Onceki bir kosu yarida kalirsa bıraktığı TEST gorevleri buradaki sayimi
// bozuyor ve hata sanki burada varmis gibi gorunuyor.
await db().temizle();

const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
const p = await ctx.newPage();
const errs = [];
p.on("pageerror", (e) => errs.push(e.message));

// 1) Girişsiz erişim
await p.goto(`${BASE}/gorevler`, { waitUntil: "networkidle" });
ok("girişsiz /gorevler -> /giris", new URL(p.url()).pathname === "/giris");
ok("şifre alanı var", await p.getByLabel("Ekip şifresi").isVisible());
ok("Ben kimim seçicisi var", await p.getByLabel("Ben kimim").isVisible());
ok("form sunucuda render olmuş", (await (await fetch(`${BASE}/giris`)).text()).includes("Ekip şifresi"));

// 1b) Ana ekrana "uygulama" olarak eklenebilmesi (PWA)
//
// Manifest oturumdan ONCE okunuyor. Middleware matcher'inda unutulursa 307 ile
// /giris'e donuyor, tarayici manifest yerine HTML aliyor ve site yuklenebilir
// uygulama sayilmiyor. iOS'taki sonucu: ana ekran kisayolu HER acilista sifre
// soruyor. Yasandi — matcher'i bozan bir degisiklik buradan yakalanmali.
{
  const c = await fetch(`${BASE}/manifest.webmanifest`, { redirect: "manual" });
  ok(`manifest oturumsuz erisilebilir (HTTP ${c.status})`, c.status === 200);
  const m = await c.json().catch(() => ({}));
  ok(`manifest standalone (${m.display})`, m.display === "standalone");
  ok(`manifest ikonlari tanimli (${m.icons?.length ?? 0})`, (m.icons?.length ?? 0) >= 2);
  const ikon = await fetch(`${BASE}/apple-touch-icon.png`);
  ok(`apple-touch-icon sunuluyor (${ikon.status})`, ikon.status === 200);
  // Android tarafi: WebAPK icin manifest TEK BASINA yetmiyor, Chrome bir
  // service worker + fetch dinleyicisi de ariyor. Yoksa "ana ekrana ekle"
  // sadece kisayol yapiyor ve oturum her acilista kayboluyor.
  const sw = await fetch(`${BASE}/sw.js`, { redirect: "manual" });
  const swKod = sw.status === 200 ? await sw.text() : "";
  ok(`sw.js oturumsuz erisilebilir (HTTP ${sw.status})`, sw.status === 200);
  ok("sw.js fetch dinleyicisi var", swKod.includes('addEventListener("fetch"'));
  // Next 15 `appleWebApp.capable` icin modern `mobile-web-app-capable` basiyor;
  // iOS Safari hala yalnizca apple- onekli olani taniyor, o yuzden elle ekli.
  const girisHtml = await (await fetch(`${BASE}/giris`)).text();
  ok("apple-mobile-web-app-capable etiketi var",
     girisHtml.includes('name="apple-mobile-web-app-capable"'));
}

// 2) Yanlış şifre
await p.getByLabel("Ekip şifresi").fill("yanlissifre");
await p.locator('button[type="submit"]').click();
await p.waitForSelector("text=Şifre yanlış");
ok("yanlış şifre reddedildi", await p.getByText("Şifre yanlış").isVisible());
ok("yanlış şifrede içeri girilmedi", new URL(p.url()).pathname === "/giris");

// 3) Şifre istemciye sızmıyor mu
const html = await (await fetch(`${BASE}/giris`)).text();
ok("şifre sunucu HTML'inde YOK", !html.includes(process.env.PANO_SITE_PASSWORD));
ok("Supabase hesap şifresi HTML'de YOK", !html.includes(process.env.PANO_SUPABASE_PASSWORD));

// 4) Doğru şifre
await girisYap(p, BASE, "Sarah");
ok("doğru şifreyle girildi", new URL(p.url()).pathname === "/");
ok("seçilen kişi üstte", (await p.locator("header select").first().inputValue()) === "Sarah");

// 5) Veri veritabanından
await p.goto(`${BASE}/gorevler`, { waitUntil: "networkidle" });
{
  const bek = await dbSay();
  ok(`görev sayısı veritabanıyla aynı (${bek})`,
     (await p.getByText(/^\d+ görev$/).textContent()) === `${bek} görev`);
}
ok("fazlar yüklendi", await p.getByText("1 · Toparlanma").first().isVisible());

// 6) Seçim hatırlanıyor mu (aynı tarayıcı, yeni sekme)
const p2 = await ctx.newPage();
await p2.goto(`${BASE}/`, { waitUntil: "networkidle" });
ok("oturum hatırlandı, şifre sorulmadı", new URL(p2.url()).pathname === "/");
ok("kişi seçimi hatırlandı", (await p2.locator("header select").first().inputValue()) === "Sarah");
await p2.close();

// 7) Çıkış
// Cikis ust cubuktan AYARLAR'a tasindi (tasarim bulgusu 4).
await p.goto(`${BASE}/ayarlar`, { waitUntil: "networkidle" });
await p.locator('form[action="/cikis"] button').click();
await p.waitForURL("**/giris");
ok("çıkış -> /giris", new URL(p.url()).pathname === "/giris");
await p.goto(`${BASE}/`, { waitUntil: "networkidle" });
ok("çıkıştan sonra pano kapalı", new URL(p.url()).pathname === "/giris");

console.log(errs.length ? "\nJS HATASI:\n" + errs.join("\n") : "\nJS hatasi yok");
await b.close();
