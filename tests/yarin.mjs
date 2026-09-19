/**
 * 20 Eylül sürümünün duman testi: toplantı varsayılanları, satır eylemleri,
 * Notlarım, Geçmiş görünümü, Nasıl kullanılır sayfası.
 *
 * Kapsamlı değil, bilerek: yeni özelliklerin CALISTIGINI gösterir, her kenar
 * durumunu değil.
 */
import { chromium } from "playwright";
import { db, envYukle, girisYap } from "./oturum.mjs";

envYukle();
const BASE = process.env.PANO_URL ?? "http://localhost:3000";
const ok = (n, c) => console.log(`${c ? "✓" : "✗ BASARISIZ"}  ${n}`);
const D = Date.now().toString(36);
const ET = `TEST yarin ${D}`;

const URL_ = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const H = { apikey: KEY, Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" };
const dbAl = async (yol) => (await fetch(`${URL_}/rest/v1/${yol}`, { headers: H })).json();

await db().temizle();
const baslangicIdleri = new Set((await dbAl("tasks?select=id")).map((t) => t.id));

const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
const p = await ctx.newPage();
const errs = [];
p.on("pageerror", (e) => errs.push(e.message));
await girisYap(p, BASE, "Kürşad");

// ============ P3: toplantı notu varsayılanları ============
await p.goto(`${BASE}/ekle`, { waitUntil: "networkidle" });
await p.locator('button:text-is("Toplantı notu")').click();
await p.getByLabel("Varsayılan sorumlu").selectOption("Yunus");
await p.getByLabel("Varsayılan tarih").fill("2026-11-10");
await p.getByLabel("Toplantı notu").fill(`${ET} A\n${ET} B @Sarah\n${ET} C !12.12.2026`);
await p.waitForTimeout(400);

ok("kişi dağılımı gösteriliyor", await p.getByText(/Yunus 2/).first().isVisible());
await p.locator('button:text-is("3 görevi ekle")').click();
await p.getByText(/3 görev eklendi/).first().waitFor({ timeout: 15000 });
ok("ekledikten sonra sayfada kalındı", new URL(p.url()).pathname === "/ekle");
await p.waitForTimeout(1500);

{
  const r = await dbAl(`tasks?select=title,owner,due_date&title=like.*${encodeURIComponent(ET)}*`);
  const bul = (son) => r.find((x) => x.title.endsWith(son));
  ok(`işaretsiz satır varsayılan sorumluya gitti (${bul("A")?.owner})`, bul("A")?.owner === "Yunus");
  ok(`@Sarah varsayılanı ezdi (${bul("B")?.owner})`, bul("B")?.owner === "Sarah");
  ok(`işaretsiz satır varsayılan tarihi aldı (${bul("A")?.due_date})`, bul("A")?.due_date === "2026-11-10");
  ok(`!tarih varsayılanı ezdi (${bul("C")?.due_date})`, bul("C")?.due_date === "2026-12-12");
}

// ============ P2: satır eylemleri ============
await p.goto(`${BASE}/gorevler`, { waitUntil: "networkidle" });
await p.getByLabel("Görevlerde ara").fill(`${ET} A`);
await p.waitForTimeout(600);

await p.getByLabel(`${ET} A — yapıldı işaretle`).click();
await p.waitForTimeout(1800);
{
  const r = await dbAl(`tasks?select=status,completed_at&title=eq.${encodeURIComponent(`${ET} A`)}`);
  ok(`satırdaki ✓ görevi bitirdi (${r[0]?.status})`, r[0]?.status === "Yapıldı");
  ok("bitiş anı veritabanına yazıldı (0011)", !!r[0]?.completed_at);
}

// Geri al -> completed_at temizlenmeli
await p.getByLabel(`${ET} A — yapıldıyı geri al`).click();
await p.waitForTimeout(1800);
{
  const r = await dbAl(`tasks?select=status,completed_at&title=eq.${encodeURIComponent(`${ET} A`)}`);
  ok("geri alınca bitiş anı temizlendi", r[0]?.status === "Bekliyor" && r[0]?.completed_at === null);
}
// Geçmiş görünümü için tekrar bitir
await p.getByLabel(`${ET} A — yapıldı işaretle`).click();
await p.waitForTimeout(1800);

// Satırdan silme onay ister
await p.getByLabel("Görevlerde ara").fill(`${ET} C`);
await p.waitForTimeout(600);
await p.getByLabel(`${ET} C — sil`).click();
await p.waitForSelector("dialog[open]");
ok("satırdan silme önce onay soruyor", await p.getByText("Görev silinecek").isVisible());
await p.locator('dialog button:text-is("Vazgeç")').click();
await p.waitForTimeout(800);
ok("vazgeçince silinmedi",
   (await dbAl(`tasks?select=id&title=eq.${encodeURIComponent(`${ET} C`)}`)).length === 1);

await p.getByLabel(`${ET} C — sil`).click();
await p.waitForSelector("dialog[open]");
await p.locator('dialog button:text-is("Görevi sil")').click();
await p.waitForTimeout(2000);
ok("onaylayınca silindi",
   (await dbAl(`tasks?select=id&title=eq.${encodeURIComponent(`${ET} C`)}`)).length === 0);

// ============ P5: Geçmiş görünümü ============
await p.goto(`${BASE}/gorevler?gorunum=gecmis`, { waitUntil: "networkidle" });
await p.waitForTimeout(800);
ok("Geçmiş görünümü açıldı", await p.getByRole("button", { name: "Geçmiş" }).isVisible());
ok("biten görev Geçmiş'te görünüyor", (await p.getByText(`${ET} A`).count()) > 0);
{
  const bugun = new Date().toLocaleDateString("tr-TR", { day: "numeric", month: "long", timeZone: "Europe/Istanbul" });
  ok(`bitiş günü başlık olarak yazıyor (${bugun})`, (await p.getByText(new RegExp(bugun)).count()) > 0);
}

// ============ P4: Notlarım ============
const NOT = `${ET} notum`;
await p.goto(`${BASE}/benim`, { waitUntil: "networkidle" });
await p.locator("button[aria-label='Notlarım']").click();
ok("gizlilik uyarısı görünüyor", await p.getByText(/Gizli değildir/).isVisible());
await p.getByLabel("Yeni not").fill(NOT);
await p.locator('button:text-is("Not ekle")').click();
await p.waitForTimeout(2000);
ok("not listede görünüyor", await p.getByText(NOT).isVisible());
{
  const r = await dbAl(`notlar?select=kisi,icerik&icerik=eq.${encodeURIComponent(NOT)}`);
  ok(`not seçili kişiye yazıldı (${r[0]?.kisi})`, r[0]?.kisi === "Kürşad");
}

// Başka kişide görünmemeli
await p.locator("header select").first().selectOption("Yunus");
await p.waitForTimeout(1800);
await p.locator("button[aria-label='Notlarım']").click();
ok("not başka kişide görünmüyor", (await p.getByText(NOT).count()) === 0);

await p.locator("header select").first().selectOption("Kürşad");
await p.waitForTimeout(1800);
await p.locator("button[aria-label='Notlarım']").click();
await p.getByLabel("Notu sil").first().click();
await p.waitForSelector("dialog[open]");
await p.locator('dialog button:text-is("Notu sil")').click();
await p.waitForTimeout(2000);
ok("not silindi", (await dbAl(`notlar?select=id&icerik=eq.${encodeURIComponent(NOT)}`)).length === 0);

// ============ P6: Nasıl kullanılır ============
await p.goto(`${BASE}/nasil-kullanilir`, { waitUntil: "networkidle" });
ok("Nasıl kullanılır açıldı", await p.getByRole("heading", { name: "Nasıl kullanılır" }).isVisible());
ok("bölümler var", (await p.locator("section[id]").count()) >= 7);
await p.goto(`${BASE}/`, { waitUntil: "networkidle" });
ok("ana sayfada kılavuz bağlantısı var", await p.getByText(/Nasıl kullanılır/).first().isVisible());

// ============ temizlik ============
await db().temizle();
await fetch(`${URL_}/rest/v1/notlar?icerik=like.*TEST*`, { method: "DELETE", headers: H });
const sonIdler = (await dbAl("tasks?select=id")).map((t) => t.id);
const testinUrettikleri = sonIdler.filter((id) => !baslangicIdleri.has(id));
if (testinUrettikleri.length) {
  await fetch(`${URL_}/rest/v1/tasks?id=in.(${testinUrettikleri.join(",")})`, { method: "DELETE", headers: H });
}
await fetch(`${URL_}/rest/v1/task_events?id=not.is.null`, { method: "DELETE", headers: H });
console.log(`temizlik: ${testinUrettikleri.length} test gorevi silindi, ${(await dbAl("tasks?select=id")).length} gorev kaldi`);
console.log(errs.length ? "\nJS HATASI:\n" + errs.join("\n") : "\nJS hatasi yok");
await b.close();
