"use client";

import { useState } from "react";
import { isLate } from "@/lib/data";
import { useStore } from "@/lib/store";
import type { Task } from "@/lib/types";
import { DueLabel, OwnerBadge, StatusBadge } from "./Badges";
import { IkonCop, IkonNot, IkonOnay, IkonSagOk } from "./Ikon";
import { OnayDialog } from "./OnayDialog";

/**
 * Görev satırı.
 *
 * DİKKAT: satırın kendisi ESKİDEN bir `<button>`'dı. İçine eylem düğmesi
 * koyabilmek için `<div>`'e çevrildi — iç içe `<button>` geçersiz HTML'dir ve
 * tarayıcılar iç düğmeyi dışarı atarak düzeni bozar. Başlık+rozetler artık
 * İÇTEKİ butonda; `ekran.mjs`'in `locator("button", { hasText })` seçicisi bu
 * sayede çalışmaya devam ediyor.
 */
export function TaskRow({
  task,
  onOpen,
  secimModu = false,
  secili = false,
  onSec,
}: {
  task: Task;
  onOpen: (t: Task) => void;
  secimModu?: boolean;
  secili?: boolean;
  onSec?: (id: string) => void;
}) {
  const { today, setStatus, removeTask } = useStore();
  const [silOnayi, setSilOnayi] = useState(false);
  const late = isLate(task, today);
  const lastNote = task.notes.at(-1);
  const bitti = task.status === "Yapıldı";

  const govde = (
    <span className="min-w-0 flex-1">
      <span className="block text-base leading-snug font-semibold">{task.title}</span>
      <span className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
        <OwnerBadge owner={task.owner} />
        <DueLabel due={task.due} late={late} />
        <StatusBadge status={task.status} />
        {lastNote && (
          <span
            className="inline-flex min-w-0 items-center gap-1 truncate text-xs"
            style={{ color: "var(--c-mute)" }}
          >
            <IkonNot boyut={13} />
            <span className="truncate">
              {lastNote.actor}: {lastNote.body}
            </span>
          </span>
        )}
      </span>
    </span>
  );

  const kutu = {
    background: secili ? "var(--c-bg3)" : "var(--c-bg2)",
    // Geciken görev kırmızı çerçeveyle öne çıkar (A6).
    borderColor: secili
      ? "var(--c-teal)"
      : task.status === "Yapılamadı" || late
        ? "var(--c-red)"
        : "var(--c-line)",
    opacity: bitti ? 0.55 : 1,
  };

  if (secimModu) {
    // Seçim modunda eylem düğmesi YOK: toplu çubuk zaten o işi yapıyor ve
    // satırın tamamı seçim hedefi olmalı.
    return (
      <label
        className="mb-1.5 flex w-full cursor-pointer items-center gap-3 rounded-lg border px-3.5 py-2.5 text-left"
        style={kutu}
      >
        <input
          type="checkbox"
          checked={secili}
          onChange={() => onSec?.(task.id)}
          className="size-5 shrink-0"
          aria-label={`${task.title} — seç`}
        />
        {govde}
      </label>
    );
  }

  return (
    <div
      className="mb-1.5 flex w-full items-center gap-1 rounded-lg border py-1.5 pr-1 pl-2"
      style={kutu}
    >
      {/* Tek dokunuşla bitir/geri al. Onay yok: geri alınabilir bir işlem. */}
      <button
        type="button"
        onClick={() => setStatus(task.id, bitti ? "Bekliyor" : "Yapıldı")}
        aria-pressed={bitti}
        aria-label={`${task.title} — ${bitti ? "yapıldıyı geri al" : "yapıldı işaretle"}`}
        title={bitti ? "Yapıldıyı geri al" : "Yapıldı işaretle"}
        className="grid size-10 shrink-0 place-items-center rounded-full border-2 text-sm leading-none"
        style={{
          borderColor: bitti ? "var(--c-green)" : "var(--c-line)",
          // Boşken tamamen görünmez değil: soluk tik, dairenin ne işe
          // yaradığını anlatan tek ipucu.
          color: bitti ? "var(--c-green)" : "color-mix(in srgb, var(--c-mute) 45%, transparent)",
          background: bitti ? "color-mix(in srgb, var(--c-green) 18%, transparent)" : "transparent",
        }}
      >
        <IkonOnay boyut={18} />
      </button>

      <button
        type="button"
        onClick={() => onOpen(task)}
        className="flex min-h-[2.5rem] min-w-0 flex-1 items-center gap-2 px-1.5 py-1 text-left"
      >
        {govde}
        <span className="shrink-0" style={{ color: "var(--c-mute)" }}>
          <IkonSagOk boyut={17} />
        </span>
      </button>

      <button
        type="button"
        onClick={() => setSilOnayi(true)}
        aria-label={`${task.title} — sil`}
        title="Sil"
        className="grid size-10 shrink-0 place-items-center rounded-lg border text-sm leading-none"
        style={{ borderColor: "var(--c-line)", color: "var(--c-red)" }}
      >
        <IkonCop boyut={17} />
      </button>

      {/* Yalnızca açıkken basılıyor. Sürekli basılsaydı her satır başlığı
          DOM'da İKİ kez geçerdi (biri onay metninde) — hem liste 37 gizli
          `<dialog>` taşırdı hem `getByText(başlık)` iki eleman bulurdu. */}
      {silOnayi && (
      <OnayDialog
        acik
        baslik="Görev silinecek"
        aciklama={`"${task.title}" ve notları kalıcı olarak silinir. Bu geri alınamaz.`}
        onayEtiketi="Görevi sil"
        onOnay={() => {
          removeTask(task.id);
          setSilOnayi(false);
        }}
        onVazgec={() => setSilOnayi(false)}
      />
      )}
    </div>
  );
}
