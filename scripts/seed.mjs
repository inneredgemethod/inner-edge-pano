/**
 * 04_gorevler_seed.json -> Supabase `tasks`.
 *
 * NOT: tohum dosyasındaki `week` alanı artık kullanılmıyor. Zaman grupları
 * (Gecikmiş / Bu hafta / ...) hedef tarihten türetiliyor; elle yazılan hafta
 * etiketi yeni görevlerde boş kalıyor ve tarih değişince güncellenmiyordu.
 *
 * Tek seferlik. Tablo doluysa KENDİLİĞİNDEN DURUR — CLAUDE.md: "Kullanıcıya
 * sormadan veritabanını sıfırlama veya tohum veriyi yeniden yükleme" yasak.
 * Bilerek tekrar yüklemek istiyorsan: node scripts/seed.mjs --force
 *
 * `secret` anahtarı RLS'i atlar; bu script yalnızca terminalde çalışır,
 * anahtar tarayıcıya ASLA gitmez.
 */
import { readFileSync } from "node:fs";

for (const line of readFileSync(new URL("../.env.local", import.meta.url), "utf8").split("\n")) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}

const URL_ = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!URL_ || !KEY) {
  console.error("HATA: .env.local'de NEXT_PUBLIC_SUPABASE_URL veya SUPABASE_SERVICE_ROLE_KEY yok.");
  process.exit(1);
}

const H = { apikey: KEY, Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" };
const force = process.argv.includes("--force");

const mevcut = await fetch(`${URL_}/rest/v1/tasks?select=id`, {
  headers: { ...H, Prefer: "count=exact" },
});
const sayi = Number(mevcut.headers.get("content-range")?.split("/")[1] ?? 0);

if (sayi > 0 && !force) {
  console.error(`DURDU: tasks tablosunda zaten ${sayi} kayıt var.`);
  console.error("Üzerine eklemek istediğinden eminsen: node scripts/seed.mjs --force");
  process.exit(1);
}

const seed = JSON.parse(readFileSync(new URL("../04_gorevler_seed.json", import.meta.url), "utf8"));

// Tohum id'leri ("6si48z3") uuid değil ve hiçbir yerden referans verilmiyor;
// atılıyor, gen_random_uuid() üretiyor.
const satirlar = seed.tasks.map((t, i) => ({
  // Listeleme sırası: tohum dosyasındaki sıra anlamlı, korunmalı.
  sirano: i + 1,
  phase_id: t.phase,
  title: t.title,
  owner: t.owner,
  due_date: t.due || null,
  status: t.status,
  what: t.what || null,
  why: t.why || null,
  done_when: t.done || null,
  // created_by boş: bu görevleri bir kişi eklemedi, devir paketinden geldiler.
  // (K6 silme kuralı Faz 5'te kaldırıldı; alan yine de "kim ekledi"yi gösteriyor.)
  created_by: null,
}));

const r = await fetch(`${URL_}/rest/v1/tasks`, {
  method: "POST",
  headers: { ...H, Prefer: "return=minimal" },
  body: JSON.stringify(satirlar),
});

if (!r.ok) {
  console.error("HATA", r.status, (await r.text()).slice(0, 400));
  process.exit(1);
}

const son = await fetch(`${URL_}/rest/v1/tasks?select=id`, {
  headers: { ...H, Prefer: "count=exact" },
});
console.log(`${satirlar.length} görev yüklendi. Tabloda toplam: ${son.headers.get("content-range")?.split("/")[1]}`);
