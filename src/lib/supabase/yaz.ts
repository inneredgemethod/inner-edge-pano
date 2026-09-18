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

export type Duzenlenebilir = Partial<Pick<Task, "owner" | "due" | "what" | "why" | "done">>;

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
  week: string;
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
    week_label: input.week || null,
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
    sb.from("allowed_users").select("*").order("display_name"),
  ]);

  const ilkHata = tasks.error ?? events.error ?? phases.error ?? kadro.error;
  if (ilkHata) return mesaj(ilkHata);

  const yedek = {
    alindi: new Date().toISOString(),
    tasks: tasks.data,
    task_events: events.data,
    phases: phases.data,
    allowed_users: kadro.data,
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
        week_label: g.week || null,
        what: g.what || null,
        why: g.why || null,
        done_when: g.done || null,
        created_by: kisi,
        son_degistiren: kisi,
      })),
    );
  return mesaj(error);
}
