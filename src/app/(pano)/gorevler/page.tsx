"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { PhaseStrip } from "@/components/PhaseStrip";
import { TaskDetail } from "@/components/TaskDetail";
import { TaskList } from "@/components/TaskList";
import { currentPhase, isDone, isLate, isStuck } from "@/lib/data";
import { useStore } from "@/lib/store";
import { MEMBERS } from "@/lib/types";

function Gorevler() {
  const { tasks, phases, today } = useStore();
  const params = useSearchParams();

  const [phase, setPhase] = useState<string | null>(params.get("faz"));
  const [owner, setOwner] = useState<string | null>(null);
  const [hideDone, setHideDone] = useState(false);
  const [onlyOpen, setOnlyOpen] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);

  const now = currentPhase(phases, today);

  const visible = tasks.filter((t) => {
    if (phase && t.phase !== phase) return false;
    if (owner === "diger") {
      if ((MEMBERS as readonly string[]).includes(t.owner)) return false;
    } else if (owner && t.owner !== owner) return false;
    if (hideDone && isDone(t)) return false;
    if (onlyOpen && !isStuck(t) && !isLate(t, today)) return false;
    return true;
  });

  const chips: { key: string | null; label: string }[] = [
    { key: null, label: "Herkes" },
    ...MEMBERS.map((m) => ({ key: m as string, label: m as string })),
    { key: "diger", label: "Diğerleri" },
  ];

  return (
    <>
      <h1 className="mb-2 text-base font-semibold">Görevler</h1>

      <PhaseStrip active={phase} onSelect={setPhase} currentId={now?.id} />

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {chips.map((c) => {
          const on = owner === c.key;
          return (
            <button
              key={c.label}
              type="button"
              onClick={() => setOwner(c.key)}
              aria-pressed={on}
              className="rounded-full border px-3 py-1 text-[13px]"
              style={{
                borderColor: on ? "var(--c-teal)" : "var(--c-line)",
                color: on ? "var(--c-teal)" : "var(--c-mute)",
              }}
            >
              {c.label}
            </button>
          );
        })}
      </div>

      <div className="mt-2.5 flex flex-wrap gap-x-4 gap-y-2">
        <label className="flex items-center gap-1.5 text-[13px]" style={{ color: "var(--c-mute)" }}>
          <input type="checkbox" checked={hideDone} onChange={(e) => setHideDone(e.target.checked)} />
          Yapılanları gizle
        </label>
        <label className="flex items-center gap-1.5 text-[13px]" style={{ color: "var(--c-mute)" }}>
          <input type="checkbox" checked={onlyOpen} onChange={(e) => setOnlyOpen(e.target.checked)} />
          Sadece takılan / geciken
        </label>
        <span className="ml-auto text-[13px]" style={{ color: "var(--c-mute)" }}>
          {visible.length} görev
        </span>
      </div>

      <TaskList tasks={visible} onOpen={(t) => setOpenId(t.id)} />
      <TaskDetail taskId={openId} onClose={() => setOpenId(null)} />
    </>
  );
}

export default function Page() {
  return (
    <Suspense fallback={null}>
      <Gorevler />
    </Suspense>
  );
}
