/** Tek şifreli giriş akışı. */
import { chromium } from "playwright";
import { envYukle, girisYap } from "./oturum.mjs";

envYukle();
const BASE = process.env.PANO_URL ?? "http://localhost:3000";
const ok = (n, c) => console.log(`${c ? "✓" : "✗ BASARISIZ"}  ${n}`);

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
ok("37 görev veritabanından", (await p.getByText(/^\d+ görev$/).textContent()) === "37 görev");
ok("fazlar yüklendi", await p.getByText("1 · Toparlanma").first().isVisible());

// 6) Seçim hatırlanıyor mu (aynı tarayıcı, yeni sekme)
const p2 = await ctx.newPage();
await p2.goto(`${BASE}/`, { waitUntil: "networkidle" });
ok("oturum hatırlandı, şifre sorulmadı", new URL(p2.url()).pathname === "/");
ok("kişi seçimi hatırlandı", (await p2.locator("header select").first().inputValue()) === "Sarah");
await p2.close();

// 7) Çıkış
await p.locator('form[action="/cikis"] button').click();
await p.waitForURL("**/giris");
ok("çıkış -> /giris", new URL(p.url()).pathname === "/giris");
await p.goto(`${BASE}/`, { waitUntil: "networkidle" });
ok("çıkıştan sonra pano kapalı", new URL(p.url()).pathname === "/giris");

console.log(errs.length ? "\nJS HATASI:\n" + errs.join("\n") : "\nJS hatasi yok");
await b.close();
