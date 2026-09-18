"use client";

import { groupByWeek } from "@/lib/data";
import type { Task } from "@/lib/types";
import { TaskRow } from "./TaskRow";

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
      {groupByWeek(tasks).map(({ week, tasks: group }) => (
        <section key={week}>
          <h3 className="mt-4 mb-1.5 text-xs" style={{ color: "var(--c-mute)" }}>
            {week}
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
