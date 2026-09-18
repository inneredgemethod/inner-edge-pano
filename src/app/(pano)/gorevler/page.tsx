"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { PhaseStrip } from "@/components/PhaseStrip";
import { TaskDetail } from "@/components/TaskDetail";
import { TaskList } from "@/components/TaskList";
import { TopluCubuk } from "@/components/TopluCubuk";
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
  const [secimModu, setSecimModu] = useState(false);
  const [secililer, setSecililer] = useState<Set<string>>(new Set());

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

  const gorunurIdler = visible.map((t) => t.id);
  const hepsiSecili = gorunurIdler.length > 0 && gorunurIdler.every((id) => secililer.has(id));

  const secToggle = (id: string) =>
    setSecililer((prev) => {
      const y = new Set(prev);
      if (y.has(id)) y.delete(id);
      else y.add(id);
      return y;
    });

  const secimiKapat = () => {
    setSecimModu(false);
    setSecililer(new Set());
  };

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
        <button
          type="button"
          onClick={() => (secimModu ? secimiKapat() : setSecimModu(true))}
          aria-pressed={secimModu}
          className="rounded-lg border px-2.5 py-1 text-[13px]"
          style={{
            borderColor: secimModu ? "var(--c-teal)" : "var(--c-line)",
            color: secimModu ? "var(--c-teal)" : "var(--c-mute)",
          }}
        >
          {secimModu ? "Seçimi kapat" : "Seç"}
        </button>
      </div>

      {secimModu && (
        <label
          className="mt-3 flex items-center gap-2 rounded-lg border px-3 py-2 text-[13px]"
          style={{ borderColor: "var(--c-line)", color: "var(--c-mute)" }}
        >
          <input
            type="checkbox"
            checked={hepsiSecili}
            onChange={() => setSecililer(hepsiSecili ? new Set() : new Set(gorunurIdler))}
            className="size-4"
          />
          Görünen {visible.length} görevin tümünü seç
        </label>
      )}

      <TaskList
        tasks={visible}
        onOpen={(t) => setOpenId(t.id)}
        secimModu={secimModu}
        secililer={secililer}
        onSec={secToggle}
      />

      {/* Alt çubuk içeriği örtmesin. */}
      {secimModu && <div className="h-24" aria-hidden />}

      <TaskDetail taskId={openId} onClose={() => setOpenId(null)} />

      {secimModu && (
        <TopluCubuk
          secililer={[...secililer]}
          onTemizle={() => setSecililer(new Set())}
          onCik={secimiKapat}
        />
      )}
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
