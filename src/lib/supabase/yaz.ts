"use client";

import type { Status, Task } from "@/lib/types";
import { browserClient } from "./client";

/**
 * Panodaki yazma işlemleri.
 *
 * `kisi` her yazmada gönderiliyor: tek şifreli girişte veritabanı kimin
 * yazdığını bilemez, `task_events` log trigger'ı aktör adını `son_degistiren`
 * sütunundan okuyor. Bu ad kullanıcının BEYANI — doğrulanmış kimlik değil.
 */

export type YazmaHatasi = string | null;

function mesaj(e: { message: string; code?: string } | null): YazmaHatasi {
  if (!e) return null;
  if (e.code === "42501" || e.message.includes("row-level security")) {
    return "Bu işlem için yetkin yok. Çıkıp tekrar girmeyi dene.";
  }
  return `Kaydedilemedi: ${e.message}`;
}

export async function durumYaz(id: string, status: Status, kisi: string): Promise<YazmaHatasi> {
  const { error } = await browserClient()
    .from("tasks")
    .update({ status, son_degistiren: kisi })
    .eq("id", id);
  return mesaj(error);
}

export type Duzenlenebilir = Partial<Pick<Task, "owner" | "due" | "what" | "why" | "done" | "tekrar">>;

export async function alanYaz(
  id: string,
  patch: Duzenlenebilir,
  kisi: string,
): Promise<YazmaHatasi> {
  const db: Record<string, unknown> = { son_degistiren: kisi };
  if (patch.owner !== undefined) db.owner = patch.owner;
  if (patch.due !== undefined) db.due_date = patch.due || null;
  // Açıklamalar (A3). Log trigger'ı bunları loglamıyor: metin düzeltmesi her
  // seferinde "Kürşad bir şey değiştirdi" satırı üretirse akış okunmaz olur.
  if (patch.what !== undefined) db.what = patch.what || null;
  if (patch.why !== undefined) db.why = patch.why || null;
  if (patch.done !== undefined) db.done_when = patch.done || null;
  if (patch.tekrar !== undefined) db.tekrar = patch.tekrar || null;
  const { error } = await browserClient().from("tasks").update(db).eq("id", id);
  return mesaj(error);
}

export async function notYaz(id: string, body: string, kisi: string): Promise<YazmaHatasi> {
  const { error } = await browserClient()
    .from("task_events")
    .insert({ task_id: id, kind: "note", body, actor: kisi });
  return mesaj(error);
}

export type YeniGorev = {
  title: string;
  owner: string;
  phase: string;
  due: string;
  what?: string;
  why?: string;
  done?: string;
};

export async function gorevEkle(input: YeniGorev, kisi: string): Promise<YazmaHatasi> {
  const { error } = await browserClient().from("tasks").insert({
    title: input.title,
    owner: input.owner,
    phase_id: input.phase,
    due_date: input.due || null,
    what: input.what || null,
    why: input.why || null,
    done_when: input.done || null,
    // K6 silme kuralı buna bakıyor.
    created_by: kisi,
    son_degistiren: kisi,
  });
  return mesaj(error);
}

export async function gorevSil(id: string): Promise<YazmaHatasi> {
  const { error } = await browserClient().from("tasks").delete().eq("id", id);
  return mesaj(error);
}

// ---------------------------------------------------------------------------
// Toplu işlemler
// ---------------------------------------------------------------------------

/**
 * Toplu güncelleme. Log trigger'ı her satır için ayrı çalışır, yani 10 görevin
 * sorumlusunu değiştirmek 10 log satırı üretir — istediğimiz bu, "kim neyi
 * değiştirdi" tek tek kalsın.
 */
export async function topluGuncelle(
  ids: string[],
  patch: { owner?: string; phase?: string; due?: string },
  kisi: string,
): Promise<YazmaHatasi> {
  if (ids.length === 0) return null;
  const db: Record<string, unknown> = { son_degistiren: kisi };
  if (patch.owner !== undefined) db.owner = patch.owner;
  if (patch.phase !== undefined) db.phase_id = patch.phase;
  if (patch.due !== undefined) db.due_date = patch.due || null;

  const { error } = await browserClient().from("tasks").update(db).in("id", ids);
  return mesaj(error);
}

export async function topluSil(ids: string[]): Promise<YazmaHatasi> {
  if (ids.length === 0) return null;
  const { error } = await browserClient().from("tasks").delete().in("id", ids);
  return mesaj(error);
}

// ---------------------------------------------------------------------------
// Ayarlar (A2)
// ---------------------------------------------------------------------------

/**
 * Panonun tam yedeğini tarayıcıya indirir.
 *
 * `service_role` bilerek tarayıcıya verilmiyor; normal oturum zaten her şeyi
 * okuyabildiği için yedek bununla alınıyor. Yedek kullanıcının cihazına
 * iniyor — sunucuda dosya biriktirmiyoruz.
 */
export async function yedekIndir(): Promise<YazmaHatasi> {
  const sb = browserClient();
  const [tasks, events, phases, kadro] = await Promise.all([
    sb.from("tasks").select("*").order("sirano"),
    sb.from("task_events").select("*").order("created_at"),
    sb.from("phases").select("*").order("sort"),
    sb.from("kisiler").select("*").order("sort"),
  ]);

  const ilkHata = tasks.error ?? events.error ?? phases.error ?? kadro.error;
  if (ilkHata) return mesaj(ilkHata);

  const yedek = {
    alindi: new Date().toISOString(),
    tasks: tasks.data,
    task_events: events.data,
    phases: phases.data,
    kisiler: kadro.data,
  };

  const tarih = new Date().toISOString().slice(0, 19).replaceAll(":", "");
  const blob = new Blob([JSON.stringify(yedek, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `inner-edge-pano-yedek-${tarih}.json`;
  a.click();
  URL.revokeObjectURL(url);
  return null;
}

/**
 * Tüm görevleri siler. `task_events` cascade ile birlikte gider.
 * Fazlar ve kadro DURUR.
 */
export async function panoyuSifirla(): Promise<YazmaHatasi> {
  const { error } = await browserClient().from("tasks").delete().not("id", "is", null);
  return mesaj(error);
}

/** Toplantı notundan çıkan görevleri tek seferde ekler (A4). */
export async function topluEkle(girdiler: YeniGorev[], kisi: string): Promise<YazmaHatasi> {
  if (girdiler.length === 0) return null;
  const { error } = await browserClient()
    .from("tasks")
    .insert(
      girdiler.map((g) => ({
        title: g.title,
        owner: g.owner,
        phase_id: g.phase,
        due_date: g.due || null,
        what: g.what || null,
        why: g.why || null,
        done_when: g.done || null,
        created_by: kisi,
        son_degistiren: kisi,
      })),
    );
  return mesaj(error);
}

// ---------------------------------------------------------------------------
// Faz ve kişi yönetimi (2.1)
// ---------------------------------------------------------------------------
// Silme yok, arşiv var: `tasks.phase_id` fazlara foreign key ile bağlı ve
// `tasks.owner` kişi adını metin olarak tutuyor. Silme, mevcut görevleri
// kırar ya da sahipsiz bırakırdı.

export type FazYaması = Partial<{
  name: string;
  period: string;
  date_from: string | null;
  date_to: string | null;
  gate: string;
  sort: number;
  arsiv: boolean;
}>;

export async function fazYaz(id: string, yama: FazYaması): Promise<YazmaHatasi> {
  const { error } = await browserClient().from("phases").update(yama).eq("id", id);
  return mesaj(error);
}

/** Ad → id. "5 · Yeni hat" -> "yeni-hat". Çakışırsa sonuna sayı eklenir. */
export function fazIdTuret(ad: string, mevcutIdler: string[]): string {
  const taban =
    ad
      .toLocaleLowerCase("tr")
      .replaceAll("ı", "i").replaceAll("ş", "s").replaceAll("ğ", "g")
      .replaceAll("ü", "u").replaceAll("ö", "o").replaceAll("ç", "c")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 24) || "faz";
  if (!mevcutIdler.includes(taban)) return taban;
  for (let i = 2; ; i++) {
    const aday = `${taban}-${i}`;
    if (!mevcutIdler.includes(aday)) return aday;
  }
}

export async function fazEkle(
  girdi: { id: string; name: string; period: string; gate: string; sort: number },
): Promise<YazmaHatasi> {
  const { error } = await browserClient().from("phases").insert({
    id: girdi.id,
    name: girdi.name,
    period: girdi.period || null,
    gate: girdi.gate || null,
    sort: girdi.sort,
  });
  return mesaj(error);
}

export type KisiYaması = Partial<{ color: string; sadece_sorumlu: boolean; arsiv: boolean; sort: number }>;

/** Kadro satırını günceller. (Çerez yazan `kisiYaz` ile karıştırma — o
 *  src/lib/kisi.ts'te ve "Ben" seçimini tarayıcıda saklar.) */
export async function kadroYaz(ad: string, yama: KisiYaması): Promise<YazmaHatasi> {
  const { error } = await browserClient().from("kisiler").update(yama).eq("display_name", ad);
  return mesaj(error);
}

export async function kisiEkle(
  girdi: { display_name: string; color: string; sadece_sorumlu: boolean; sort: number },
): Promise<YazmaHatasi> {
  const { error } = await browserClient().from("kisiler").insert(girdi);
  return mesaj(error);
}

// ---------------------------------------------------------------------------
// JSON dışa/içe aktarma (2.4)
// ---------------------------------------------------------------------------

/** 04_gorevler_seed.json ile aynı biçim — scripts/seed.mjs bunu okuyabilir. */
export type AktarimDosyasi = {
  phases: { id: string; n: string; d: string; from: string; to: string; gate: string }[];
  tasks: {
    phase: string;
    owner: string;
    due: string;
    title: string;
    what: string;
    why: string;
    done: string;
    status: string;
  }[];
};

export async function gorevleriDisaAktar(): Promise<YazmaHatasi> {
  const sb = browserClient();
  const [t, f] = await Promise.all([
    sb.from("tasks").select("phase_id,title,owner,due_date,status,what,why,done_when").order("sirano"),
    sb.from("phases").select("id,name,period,date_from,date_to,gate").order("sort"),
  ]);
  const hata = t.error ?? f.error;
  if (hata) return mesaj(hata);

  const dosya: AktarimDosyasi = {
    phases: (f.data ?? []).map((p) => ({
      id: p.id, n: p.name, d: p.period ?? "",
      from: p.date_from ?? "", to: p.date_to ?? "", gate: p.gate ?? "",
    })),
    tasks: (t.data ?? []).map((r) => ({
      phase: r.phase_id, owner: r.owner, due: r.due_date ?? "", title: r.title,
      what: r.what ?? "", why: r.why ?? "", done: r.done_when ?? "", status: r.status,
    })),
  };

  const tarih = new Date().toISOString().slice(0, 10);
  const blob = new Blob([JSON.stringify(dosya, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `inner-edge-gorevler-${tarih}.json`;
  a.click();
  URL.revokeObjectURL(url);
  return null;
}

/**
 * İçe aktarma YALNIZCA EKLER, mevcut görevlere dokunmaz.
 * "Panoyu sıfırla" zaten var; içe aktarmaya ikinci bir yıkıcı yol koymak
 * gereksiz risk olurdu. Temiz sayfa isteyen önce sıfırlar, sonra aktarır.
 */
export async function gorevleriIceAktar(
  dosya: AktarimDosyasi,
  kisi: string,
): Promise<YazmaHatasi> {
  if (!dosya.tasks?.length) return "Dosyada görev yok.";
  const { error } = await browserClient().from("tasks").insert(
    dosya.tasks.map((t) => ({
      phase_id: t.phase,
      title: t.title,
      owner: t.owner,
      due_date: t.due || null,
      what: t.what || null,
      why: t.why || null,
      done_when: t.done || null,
      created_by: kisi,
      son_degistiren: kisi,
    })),
  );
  return mesaj(error);
}
