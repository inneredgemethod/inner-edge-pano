/**
 * Panonun tam yedeğini scripts/yedek-<tarih>.json dosyasına yazar.
 * Sıfırlamadan önce çalıştır.
 *
 *   node scripts/yedek.mjs
 */
import { readFileSync, writeFileSync } from "node:fs";

for (const line of readFileSync(new URL("../.env.local", import.meta.url), "utf8").split("\n")) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}

const URL_ = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const H = { apikey: KEY, Authorization: `Bearer ${KEY}` };
const al = async (yol) => (await fetch(`${URL_}/rest/v1/${yol}`, { headers: H })).json();

const yedek = {
  alindi: new Date().toISOString(),
  tasks: await al("tasks?select=*&order=sirano"),
  task_events: await al("task_events?select=*&order=created_at"),
  phases: await al("phases?select=*&order=sort"),
  kisiler: await al("kisiler?select=*&order=sort"),
  notlar: await al("notlar?select=*&order=created_at"),
};

const tarih = new Date().toISOString().slice(0, 19).replaceAll(":", "");
const yol = new URL(`./yedek-${tarih}.json`, import.meta.url);
writeFileSync(yol, JSON.stringify(yedek, null, 2), "utf8");
console.log(
  `yedek alindi: scripts/yedek-${tarih}.json ` +
    `(${yedek.tasks.length} gorev, ${yedek.task_events.length} log)`,
);
