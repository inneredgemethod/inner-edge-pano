/**
 * Arşivlenmiş kişinin davranışı.
 *
 * Sibel/Emine/Ortak arşivlendi. Arşivli kişi sorumlu MENÜLERİNDE çıkmamalı,
 * ama üzerinde görev varsa O GÖREVİN menüsünde kalmalı — yoksa <select>
 * karşılığı olmayan bir değere bakar, tarayıcı ilk seçeneği gösterir ve
 * kullanıcı başka bir alanı düzenlerken sorumluyu sessizce değiştirir.
 */
import { chromium } from "playwright";
import { db, envYukle, girisYap } from "./oturum.mjs";

envYukle();
const BASE = process.env.PANO_URL ?? "http://localhost:3000";
const ok = (n, c) => console.log(`${c ? "✓" : "✗ BASARISIZ"}  ${n}`);

await db().temizle();

const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
const p = await ctx.newPage();
const errs = [];
p.on("pageerror", (e) => errs.push(e.message));
await girisYap(p, BASE, "Kürşad");

// ---------- Arşivli kişiler menülerde yok ----------
await p.goto(`${BASE}/ekle`, { waitUntil: "networkidle" });
const ekleSecenekleri = await p.getByLabel("Sorumlu").locator("option").allInnerTexts();
ok(`Ekle formunda sadece aktif kadro (${ekleSecenekleri.join(",")})`,
   ekleSecenekleri.length === 3 && !ekleSecenekleri.some((o) => o.includes("Sibel")));

await p.goto(`${BASE}/gorevler`, { waitUntil: "networkidle" });
const cipler = await p.locator('button:text-is("Sibel")').count();
ok("kişi filtresinde arşivli isim yok", cipler === 0);

// ---------- Arşivli sorumlusu olan görev ----------
await p.getByLabel("Görevlerde ara").fill("nörobilim");
await p.waitForTimeout(500);
ok("Sibel'in görevi hâlâ listede", (await p.getByText(/nörobilim/).count()) > 0);

await p.locator("button", { hasText: "nörobilim" }).first().click();
await p.waitForSelector("dialog[open]");

const secim = p.locator("dialog select").first();
const secenekler = await secim.locator("option").allInnerTexts();
ok(`arşivli sorumlu menüde "(arşivde)" olarak duruyor (${secenekler[0]})`,
   secenekler[0] === "Sibel (arşivde)");
ok("seçili değer doğru — Kürşad'a kaymamış", (await secim.inputValue()) === "Sibel");
ok("aktif kadro da menüde", secenekler.length === 4 && secenekler.includes("Sarah"));

// Baska bir alani duzenlemek sorumluyu DEGISTIRMEMELI
await p.locator('dialog button:text-is("Yapılıyor")').click();
await p.waitForTimeout(1500);
await p.locator('dialog button:text-is("Kapat")').click();
await p.reload({ waitUntil: "networkidle" });
{
  const URL_ = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const r = await (await fetch(
    `${URL_}/rest/v1/tasks?select=owner,status&title=like.*nörobilim*`,
    { headers: { apikey: KEY, Authorization: `Bearer ${KEY}` } })).json();
  ok(`durum değişti ama sorumlu Sibel kaldı (${r[0]?.owner}/${r[0]?.status})`,
     r[0]?.owner === "Sibel" && r[0]?.status === "Yapılıyor");
}

// ---------- Ayristirici arsivli ismi tanimamali ----------
await p.goto(`${BASE}/ekle`, { waitUntil: "networkidle" });
await p.locator('button:text-is("Toplantı notu")').click();
await p.getByLabel("Toplantı notu").fill("TEST arsiv denemesi @Sibel");
await p.waitForTimeout(300);
ok("@Sibel artık uyarı veriyor (arşivde)",
   (await p.getByText(/kimse ile eşleşmedi/).count()) > 0);

const { gorev, log } = await db().temizle();
console.log(`temizlik: ${gorev} gorev, ${log} log kaldi`);
console.log(errs.length ? "\nJS HATASI:\n" + errs.join("\n") : "\nJS hatasi yok");
await b.close();
