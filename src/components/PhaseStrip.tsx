"use client";

import { PHASES, phaseStat } from "@/lib/data";
import { useStore } from "@/lib/store";

/**
 * K2: tek satır, yatay kaydırılan faz kartları + doluluk çubuğu.
 * `active` null ise "Tümü" seçilidir.
 */
export function PhaseStrip({
  active,
  onSelect,
  currentId,
}: {
  active: string | null;
  onSelect: (id: string | null) => void;
  currentId: string;
}) {
  const { tasks } = useStore();

  return (
    <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
      <button
        type="button"
        onClick={() => onSelect(null)}
        aria-pressed={active === null}
        className="shrink-0 rounded-lg border px-3 py-2 text-sm"
        style={{
          borderColor: active === null ? "var(--c-teal)" : "var(--c-line)",
          background: "var(--c-bg2)",
          color: active === null ? "var(--c-teal)" : "var(--c-ink)",
        }}
      >
        Tümü
      </button>

      {PHASES.map((p) => {
        const s = phaseStat(tasks, p.id);
        const on = active === p.id;
        return (
          <button
            key={p.id}
            type="button"
            onClick={() => onSelect(p.id)}
            aria-pressed={on}
            className="w-[170px] shrink-0 rounded-lg border px-3 py-2 text-left"
            style={{
              borderColor: on ? "var(--c-teal)" : "var(--c-line)",
              background: "var(--c-bg2)",
              boxShadow: p.id === currentId ? "inset 0 0 0 1px var(--c-teal)" : undefined,
            }}
          >
            <div className="truncate text-[13px] font-semibold">{p.n}</div>
            <div className="truncate text-xs" style={{ color: "var(--c-mute)" }}>
              {p.d}
            </div>
            <div
              className="mt-1.5 h-1 overflow-hidden rounded"
              style={{ background: "var(--c-line)" }}
            >
              <i
                className="block h-full"
                style={{ width: `${Math.round(s.ratio * 100)}%`, background: "var(--c-teal)" }}
              />
            </div>
            <div className="mt-1 text-[11px]" style={{ color: "var(--c-mute)" }}>
              {s.done}/{s.total}
            </div>
          </button>
        );
      })}
    </div>
  );
}
