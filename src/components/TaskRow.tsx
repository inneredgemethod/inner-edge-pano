"use client";

import { isLate } from "@/lib/data";
import { useStore } from "@/lib/store";
import type { Task } from "@/lib/types";
import { DueLabel, OwnerBadge, StatusBadge } from "./Badges";

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
  const { today } = useStore();
  const late = isLate(task, today);
  const lastNote = task.notes.at(-1);

  const govde = (
    <span className="min-w-0 flex-1">
      <span className="block text-[15px] font-medium">{task.title}</span>
      <span className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
        <OwnerBadge owner={task.owner} />
        <DueLabel due={task.due} late={late} />
        {lastNote && (
          <span className="truncate text-xs" style={{ color: "var(--c-mute)" }}>
            💬 {lastNote.actor}: {lastNote.body}
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
    opacity: task.status === "Yapıldı" ? 0.55 : 1,
  };

  if (secimModu) {
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
        <StatusBadge status={task.status} />
      </label>
    );
  }

  return (
    <button
      type="button"
      onClick={() => onOpen(task)}
      className="mb-1.5 flex w-full items-center gap-3 rounded-lg border px-3.5 py-2.5 text-left"
      style={kutu}
    >
      {govde}
      <StatusBadge status={task.status} />
    </button>
  );
}
