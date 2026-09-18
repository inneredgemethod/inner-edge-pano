"use client";

import { gorevGruplari } from "@/lib/data";
import { useStore } from "@/lib/store";
import type { Task } from "@/lib/types";
import { TaskRow } from "./TaskRow";

/** Grup başlıklarının rengi — "Gecikmiş" göze çarpsın. */
const GRUP_RENGI: Record<string, string> = {
  "Gecikmiş": "var(--c-red)",
};

export function TaskList({
  tasks,
  onOpen,
  empty = "Bu filtrede görev yok.",
  secimModu = false,
  secililer,
  onSec,
}: {
  tasks: Task[];
  onOpen: (t: Task) => void;
  empty?: string;
  secimModu?: boolean;
  secililer?: Set<string>;
  onSec?: (id: string) => void;
}) {
  const { today } = useStore();

  if (tasks.length === 0) {
    return (
      <p
        className="rounded-lg border border-dashed px-4 py-8 text-center text-sm"
        style={{ borderColor: "var(--c-line)", color: "var(--c-mute)" }}
      >
        {empty}
      </p>
    );
  }

  return (
    <>
      {gorevGruplari(tasks, today).map(({ grup, tasks: group }) => (
        <section key={grup}>
          <h3
            className="mt-4 mb-1.5 text-xs font-medium"
            style={{ color: GRUP_RENGI[grup] ?? "var(--c-mute)" }}
          >
            {grup} · {group.length}
          </h3>
          {group.map((t) => (
            <TaskRow
              key={t.id}
              task={t}
              onOpen={onOpen}
              secimModu={secimModu}
              secili={secililer?.has(t.id) ?? false}
              onSec={onSec}
            />
          ))}
        </section>
      ))}
    </>
  );
}
