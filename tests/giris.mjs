/**
 * Giriş akışı testi. Gerçek e-posta göndermez: Supabase admin API'sinden
 * generate_link ile jeton üretip /auth/confirm'e verir.
 */
import { readFileSync } from "node:fs";
import { chromium } from "playwright";

for (const line of readFileSync(new URL("../.env.local", import.meta.url), "utf8").split("\n")) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}

const BASE = process.env.PANO_URL ?? "http://localhost:3000";
const SB = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SECRET = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ok = (n, c) => console.log(`${c ? "✓" : "✗ BASARISIZ"}  ${n}`);

const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
const p = await ctx.newPage();
const errs = [];
p.on("pageerror", (e) => errs.push(e.message));

// 1) Girişsiz erişim engelleniyor mu
await p.goto(`${BASE}/gorevler`, { waitUntil: "networkidle" });
ok("girişsiz /gorevler -> /giris", new URL(p.url()).pathname === "/giris");
ok("giriş formu görünüyor", await p.getByText("Şifre yok").isVisible());

// 2) İzin listesi dışı e-posta
await p.getByLabel("E-posta").fill("yabanci@ornek.com");
await p.locator('button[type="submit"]').click();
await p.waitForSelector("text=Bu pano ekibe özel");
ok("izinsiz e-posta reddedildi", await p.getByText("Bu pano ekibe özel").isVisible());
ok("izinsize link GONDERILMEDI", !(await p.getByText("Link gönderildi").isVisible().catch(() => false)));

// 3) Geçersiz link
await p.goto(`${BASE}/auth/confirm?token_hash=cop&type=magiclink`, { waitUntil: "networkidle" });
ok("bozuk link -> anlaşılır mesaj", await p.getByText(/Link çalışmadı/).isVisible());

// 4) Gerçek jetonla giriş
const r = await fetch(`${SB}/auth/v1/admin/generate_link`, {
  method: "POST",
  headers: { apikey: SECRET, Authorization: `Bearer ${SECRET}`, "Content-Type": "application/json" },
  body: JSON.stringify({ type: "magiclink", email: "info@inneredgemethod.io" }),
});
const { hashed_token } = await r.json();
await p.goto(`${BASE}/auth/confirm?token_hash=${hashed_token}&type=magiclink`, { waitUntil: "networkidle" });
ok("giriş yapıldı, panoya düştü", new URL(p.url()).pathname === "/");
ok("kimlik rozeti Kürşad", await p.getByTitle("info@inneredgemethod.io").isVisible());

// 5) Veri veritabanından geliyor mu
await p.goto(`${BASE}/gorevler`, { waitUntil: "networkidle" });
const sayi = await p.getByText(/^\d+ görev$/).textContent();
ok(`37 görev veritabanından geldi (${sayi})`, sayi === "37 görev");
const ilk = await p.locator("button", { hasText: "45 dakikalık toplantı" }).first().isVisible();
ok("tohum görev içeriği doğru", ilk);

// 6) Faz verisi de veritabanından
ok("fazlar yüklendi", await p.getByText("1 · Toparlanma").first().isVisible());

// 7) Çıkış
await p.locator('form[action="/cikis"] button').click();
await p.waitForURL("**/giris");
ok("çıkış -> /giris", new URL(p.url()).pathname === "/giris");
await p.goto(`${BASE}/`, { waitUntil: "networkidle" });
ok("çıkıştan sonra pano kapalı", new URL(p.url()).pathname === "/giris");

console.log(errs.length ? "\nJS HATASI:\n" + errs.join("\n") : "\nJS hatasi yok");
await b.close();
