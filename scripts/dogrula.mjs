/**
 * Panonun SAĞLIK kontrolü.
 *
 * Eskiden 04_gorevler_seed.json ile birebir karşılaştırıyordu. Faz 5'te
 * "Panoyu Sıfırla" geldi ve toplantıda gerçek görevler girilecek — o andan
 * sonra tohum karşılaştırması anlamsız. Artık veriyi kendi içinde tutarlılık
 * açısından denetliyor.
 *
 *   npm run dogrula
 */
import { readFileSync } from "node:fs";

for (const line of readFileSync(new URL("../.env.local", import.meta.url), "utf8").split("\n")) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}

const URL_ = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const PAT = process.env.SUPABASE_ACCESS_TOKEN;
const REF = process.env.SUPABASE_PROJECT_REF;
const H = { apikey: KEY, Authorization: `Bearer ${KEY}` };

const al = async (yol) => (await fetch(`${URL_}/rest/v1/${yol}`, { headers: H })).json();

const tasks = await al("tasks?select=id,title,owner,phase_id,status,sirano,due_date");
const events = await al("task_events?select=id,task_id,kind,actor");
const phases = await al("phases?select=id");
const kadro = await al("kisiler?select=display_name,arsiv");

const sorun = [];
const fazIdler = new Set(phases.map((p) => p.id));
const gorevIdler = new Set(tasks.map((t) => t.id));

// 1) Yetim log: silinen bir göreve bağlı kayıt kalmış mı (cascade tutmuş mu)
const yetim = events.filter((e) => !gorevIdler.has(e.task_id));
if (yetim.length) sorun.push(`${yetim.length} yetim task_events kaydı (görevi silinmiş)`);

// 2) Boş zorunlu alanlar
for (const t of tasks) {
  if (!t.title?.trim()) sorun.push(`baslik bos: ${t.id}`);
  if (!t.owner?.trim()) sorun.push(`sorumlu bos: ${t.title}`);
  if (!fazIdler.has(t.phase_id)) sorun.push(`gecersiz faz "${t.phase_id}": ${t.title}`);
}

// 3) sirano: çakışma veya boşluk
const siralar = tasks.map((t) => t.sirano).filter((n) => n != null);
if (siralar.length !== tasks.length) {
  sorun.push(`${tasks.length - siralar.length} gorevde sirano bos`);
}
const tekrar = siralar.filter((n, i) => siralar.indexOf(n) !== i);
if (tekrar.length) sorun.push(`sirano cakismasi: ${[...new Set(tekrar)].join(", ")}`);

// 4) Log aktörleri kadroda mı (Sistem hariç)
const isimler = new Set([...kadro.map((k) => k.display_name), "Sistem"]);
const yabanci = [...new Set(events.map((e) => e.actor))].filter((a) => !isimler.has(a));
if (yabanci.length) sorun.push(`log'da kadro disi aktor: ${yabanci.join(", ")}`);

// 5) Test kalıntısı
const copluk = tasks.filter((t) => /^TEST/i.test(t.title ?? ""));
if (copluk.length) sorun.push(`${copluk.length} TEST gorevi kalmis: ${copluk.map((t) => t.title).join(" | ")}`);

// 6) Supabase denetçisi
let advisor = "atlandi (SUPABASE_ACCESS_TOKEN yok)";
if (PAT && REF) {
  const d = await (
    await fetch(`https://api.supabase.com/v1/projects/${REF}/advisors/security`, {
      headers: { Authorization: `Bearer ${PAT}` },
    })
  ).json();
  // auth_leaked_password_protection: ucretli plan gerektiriyor, modelimizde
  // anlamsiz (sifreyi kullanici belirlemiyor). Bilerek gormezden geliniyor.
  const ls = (d.lints ?? []).filter(
    (l) => l.level !== "INFO" && l.name !== "auth_leaked_password_protection",
  );
  advisor = ls.length ? ls.map((l) => `[${l.level}] ${l.name}`).join("; ") : "temiz";
  if (ls.length) sorun.push(`advisors: ${advisor}`);
}

console.log(`gorev: ${tasks.length} · log: ${events.length} · faz: ${phases.length} · kadro: ${kadro.length}`);
console.log(`advisors(security): ${advisor}`);
if (sorun.length) {
  console.log(`\n${sorun.length} SORUN:`);
  for (const s of sorun) console.log("  " + s);
  process.exit(1);
}
console.log("Pano saglikli.");
