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

export async function alanYaz(
  id: string,
  patch: Partial<Pick<Task, "owner" | "due">>,
  kisi: string,
): Promise<YazmaHatasi> {
  const db: Record<string, unknown> = { son_degistiren: kisi };
  if (patch.owner !== undefined) db.owner = patch.owner;
  if (patch.due !== undefined) db.due_date = patch.due || null;
  const { error } = await browserClient().from("tasks").update(db).eq("id", id);
  return mesaj(error);
}

export async function notYaz(id: string, body: string, kisi: string): Promise<YazmaHatasi> {
  const { error } = await browserClient()
    .from("task_events")
    .insert({ task_id: id, kind: "note", body, actor: kisi });
  return mesaj(error);
}

export async function gorevEkle(
  input: { title: string; owner: string; phase: string; due: string; week: string },
  kisi: string,
): Promise<YazmaHatasi> {
  const { error } = await browserClient().from("tasks").insert({
    title: input.title,
    owner: input.owner,
    phase_id: input.phase,
    due_date: input.due || null,
    week_label: input.week || null,
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
