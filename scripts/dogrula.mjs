/**
 * Panodaki veriyi 04_gorevler_seed.json ile karşılaştırır.
 *
 * Neden var: bir teşhis scripti gerçek bir görevin `week_label` alanını test
 * değeriyle değiştirmiş ve geri almamıştı; görev panoda yanlış hafta grubuna
 * düşmüştü. Ekran görüntüsüne dikkatli bakılmasa fark edilmeyecekti.
 * Ekibe bir şey göstermeden önce bunu çalıştır.
 *
 *   node scripts/dogrula.mjs
 */
import { readFileSync } from "node:fs";

for (const line of readFileSync(new URL("../.env.local", import.meta.url), "utf8").split("\n")) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}

const URL_ = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const H = { apikey: KEY, Authorization: `Bearer ${KEY}` };

const seed = JSON.parse(readFileSync(new URL("../04_gorevler_seed.json", import.meta.url), "utf8")).tasks;
const satirlar = await (
  await fetch(
    `${URL_}/rest/v1/tasks?select=title,owner,week_label,due_date,status,phase_id,what,why,done_when,sirano`,
    { headers: H },
  )
).json();
const db = new Map(satirlar.map((r) => [r.title, r]));

const ALANLAR = [
  ["owner", "owner"], ["week", "week_label"], ["due", "due_date"],
  ["status", "status"], ["phase", "phase_id"], ["what", "what"],
  ["why", "why"], ["done", "done_when"],
];

const sapma = [];
seed.forEach((t, i) => {
  const d = db.get(t.title);
  if (!d) return sapma.push(`EKSIK: ${t.title}`);
  if (d.sirano !== i + 1) sapma.push(`SIRA: ${t.title.slice(0, 40)} -> ${d.sirano}, olmali ${i + 1}`);
  for (const [tohumAlan, dbAlan] of ALANLAR) {
    if ((t[tohumAlan] || null) !== (d[dbAlan] || null)) {
      sapma.push(`${dbAlan}: ${t.title.slice(0, 34)} -> ${JSON.stringify(d[dbAlan])?.slice(0, 50)}`);
    }
  }
});

const fazla = satirlar.filter((r) => !seed.some((t) => t.title === r.title));
for (const f of fazla) sapma.push(`FAZLADAN: ${f.title}`);

const log = await (await fetch(`${URL_}/rest/v1/task_events?select=id`, { headers: H })).json();

console.log(`gorev: ${satirlar.length}/${seed.length} · log kaydi: ${log.length}`);
if (sapma.length) {
  console.log(`\nTOHUMDAN ${sapma.length} SAPMA:`);
  for (const s of sapma) console.log("  " + s);
  process.exit(1);
}
console.log("Pano tohum verisiyle birebir ayni.");
