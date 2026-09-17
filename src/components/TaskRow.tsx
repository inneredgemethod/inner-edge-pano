"use client";

import { isLate } from "@/lib/data";
import { useStore } from "@/lib/store";
import type { Task } from "@/lib/types";
import { DueLabel, OwnerBadge, StatusBadge } from "./Badges";

export function TaskRow({ task, onOpen }: { task: Task; onOpen: (t: Task) => void }) {
  const { today } = useStore();
  const late = isLate(task, today);
  const lastNote = task.notes.at(-1);

  return (
    <button
      type="button"
      onClick={() => onOpen(task)}
      className="mb-1.5 flex w-full items-center gap-3 rounded-lg border px-3.5 py-2.5 text-left"
      style={{
        background: "var(--c-bg2)",
        borderColor: task.status === "Yapılamadı" ? "var(--c-red)" : "var(--c-line)",
        opacity: task.status === "Yapıldı" ? 0.55 : 1,
      }}
    >
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
      <StatusBadge status={task.status} />
    </button>
  );
}
