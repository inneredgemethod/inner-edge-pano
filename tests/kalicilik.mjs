/**
 * Faz 3: yazma kalıcı mı, log düşüyor mu, Realtime çalışıyor mu.
 * İki ayrı tarayıcı oturumu açar (Kürşad ve Yunus).
 */
import { chromium } from "playwright";
import { envYukle, girisYap } from "./oturum.mjs";

envYukle();
const BASE = process.env.PANO_URL ?? "http://localhost:3000";
const ok = (n, c) => console.log(`${c ? "✓" : "✗ BASARISIZ"}  ${n}`);
const HEDEF = "45 dakikalık toplantı";
/** Her koşuda benzersiz: onceki kosunun kalintisiyla karisirsa test yaniltir. */
const NOT = `TEST notu ${Date.now().toString(36)}`;

const b = await chromium.launch();
const oturum = async (email) => {
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const p = await ctx.newPage();
  await girisYap(p, BASE, email);
  return p;
};
const ac = async (p) => {
  await p.locator("button", { hasText: HEDEF }).first().click();
  await p.waitForSelector("dialog[open]");
};

const errs = [];
const k = await oturum("info@inneredgemethod.io");   // Kürşad
const y = await oturum("yunuskekec48@gmail.com");    // Yunus
k.on("pageerror", (e) => errs.push("K: " + e.message));
y.on("pageerror", (e) => errs.push("Y: " + e.message));

await k.goto(`${BASE}/gorevler`, { waitUntil: "networkidle" });
await y.goto(`${BASE}/gorevler`, { waitUntil: "networkidle" });

// --- 1) Durum değişikliği kalıcı mı ---
await ac(k);
await k.locator('dialog button:text-is("Yapılıyor")').click();
// Yazmanın tamamlanmasını bekle: iyimser güncelleme anında görünür ama
// hemen yenilersek PATCH daha yolda olabilir.
await k.waitForTimeout(1200);
await k.locator('dialog button:text-is("Kapat")').click();
await k.reload({ waitUntil: "networkidle" });
const sonra = await k.locator("button", { hasText: HEDEF }).first().innerText();
ok("durum sayfa yenilendikten sonra da duruyor", sonra.includes("Yapılıyor"));

// --- 2) Realtime: Yunus yenilemeden görüyor mu ---
let gorundu = false;
for (let i = 0; i < 40; i++) {
  const t = await y.locator("button", { hasText: HEDEF }).first().innerText();
  if (t.includes("Yapılıyor")) { gorundu = true; break; }
  await y.waitForTimeout(500);
}
ok("Realtime: Yunus yenilemeden gördü", gorundu);

// --- 3) Not kalıcı ve loglu mu ---
await ac(k);
await k.locator('dialog input[placeholder^="Not ekle"]').fill(NOT);
await k.locator('dialog button:text-is("Ekle")').click();
await k.waitForTimeout(1200);
await k.reload({ waitUntil: "networkidle" });
await ac(k);
ok("not yenilemeden sonra da duruyor", await k.locator("dialog").getByText(NOT).isVisible());
ok("notta kim yazdığı var", await k.locator("dialog").getByText(/Kürşad · \d/).first().isVisible());
await k.locator('dialog button:text-is("Kapat")').click();

// --- 4) Realtime: Yunus notu görüyor mu ---
let notGorundu = false;
for (let i = 0; i < 40; i++) {
  if (await y.getByText(NOT).count()) { notGorundu = true; break; }
  await y.waitForTimeout(500);
}
ok("Realtime: not Yunus'a düştü", notGorundu);

// --- 5) Görev ekleme kalıcı mı ---
const ad = `TEST kalicilik ${Date.now().toString(36)}`;
await k.goto(`${BASE}/ekle`, { waitUntil: "networkidle" });
await k.getByLabel("Başlık").fill(ad);
await k.locator('button:text-is("Ekle")').click();
await k.waitForURL("**/gorevler");
await k.reload({ waitUntil: "networkidle" });
ok("yeni görev yenilemeden sonra da var", await k.getByText(ad).isVisible());

// --- 6) K6: Yunus, Kürşad'ın eklediğini silemiyor ---
await y.reload({ waitUntil: "networkidle" });
await y.getByText(ad).click();
await y.waitForSelector("dialog[open]");
ok("K6: başkasının eklediğinde Sil yok", (await y.locator('dialog button:text-is("Sil")').count()) === 0);
await y.locator('dialog button:text-is("Kapat")').click();

// --- 7) Silme kalıcı mı ---
await k.getByText(ad).click();
await k.waitForSelector("dialog[open]");
await k.locator('dialog button:text-is("Sil")').click();
await k.waitForTimeout(1200);
await k.reload({ waitUntil: "networkidle" });
ok("silinen görev geri gelmiyor", (await k.getByText(ad).count()) === 0);

// --- temizlik: testin ürettiği her şeyi geri al ---
await ac(k);
await k.locator('dialog button:text-is("Bekliyor")').click();
await k.waitForTimeout(800);
await k.locator('dialog button:text-is("Kapat")').click();

// Test notlarini ve testin urettigi log satirlarini service_role ile sil,
// yoksa panoda gercek ekip etkinligi gibi gorunuyorlar.
{
  const URL_ = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const SECRET = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const H = { apikey: SECRET, Authorization: `Bearer ${SECRET}` };
  const sil = async (q) => fetch(`${URL_}/rest/v1/task_events?${q}`, { method: "DELETE", headers: H });
  await sil(`body=like.TEST*`);
  await sil(`body=like.*Bekliyor*`);
  await sil(`kind=eq.created`);
  const kalan = await (await fetch(`${URL_}/rest/v1/task_events?select=id`, { headers: H })).json();
  console.log(`temizlik: task_events'te kalan kayit ${kalan.length}`);
}

console.log(errs.length ? "\nJS HATASI:\n" + errs.join("\n") : "\nJS hatasi yok");
await b.close();
