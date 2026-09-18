"use client";

import type { Status, Task } from "@/lib/types";
import { browserClient } from "./client";

/**
 * Panodaki yazma işlemleri. Hepsi RLS altında çalışır: yetkisi olmayan
 * bir istek veritabanında durdurulur, arayüzde gizlemek tek başına güvenlik değil.
 *
 * `task_events` logunu buradan YAZMIYORUZ — onu veritabanı trigger'ı yazıyor
 * (0004_degisiklik_logu.sql). Böylece log atlanamaz ve değişiklikle aynı
 * işlemin içinde kalır.
 */

export type YazmaHatasi = string | null;

function mesaj(e: { message: string; code?: string } | null): YazmaHatasi {
  if (!e) return null;
  // RLS reddi kullanıcıya "satır bulunamadı" gibi görünür; anlaşılır hale getir.
  if (e.code === "42501" || e.message.includes("row-level security")) {
    return "Bu işlem için yetkin yok.";
  }
  return `Kaydedilemedi: ${e.message}`;
}

export async function durumYaz(id: string, status: Status): Promise<YazmaHatasi> {
  const { error } = await browserClient().from("tasks").update({ status }).eq("id", id);
  return mesaj(error);
}

export async function alanYaz(
  id: string,
  patch: Partial<Pick<Task, "owner" | "due">>,
): Promise<YazmaHatasi> {
  const db: Record<string, unknown> = {};
  if (patch.owner !== undefined) db.owner = patch.owner;
  if (patch.due !== undefined) db.due_date = patch.due || null;
  const { error } = await browserClient().from("tasks").update(db).eq("id", id);
  return mesaj(error);
}

export async function notYaz(
  id: string,
  body: string,
  actor: string,
  actorEmail: string,
): Promise<YazmaHatasi> {
  const { error } = await browserClient()
    .from("task_events")
    .insert({ task_id: id, kind: "note", body, actor, actor_email: actorEmail });
  return mesaj(error);
}

export async function gorevEkle(input: {
  title: string;
  owner: string;
  phase: string;
  due: string;
  week: string;
}): Promise<YazmaHatasi> {
  // created_by'ı trigger dolduruyor; K6 silme kuralı ona dayanıyor.
  const { error } = await browserClient().from("tasks").insert({
    title: input.title,
    owner: input.owner,
    phase_id: input.phase,
    due_date: input.due || null,
    week_label: input.week || null,
  });
  return mesaj(error);
}

export async function gorevSil(id: string): Promise<YazmaHatasi> {
  const { error } = await browserClient().from("tasks").delete().eq("id", id);
  return mesaj(error);
}
