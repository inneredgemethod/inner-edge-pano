"use client";

import { useRouter } from "next/navigation";
import { PhaseStrip } from "@/components/PhaseStrip";
import { currentPhase, overview } from "@/lib/data";
import { useStore } from "@/lib/store";

export default function GenelBakis() {
  const { tasks, phases, me, today } = useStore();
  const router = useRouter();
  const o = overview(tasks, me, today);
  const now = currentPhase(phases, today);

  const stats = [
    { label: "Yapılan / toplam", value: `${o.done}/${o.total}`, tone: "teal" },
    { label: `${me} — açık görev`, value: o.mine, tone: "ink" },
    { label: "Geciken", value: o.late, tone: o.late ? "red" : "ink" },
    { label: "Takılan", value: o.stuck, tone: o.stuck ? "red" : "ink" },
  ] as const;

  return (
    <>
      <h1 className="sr-only">Genel bakış</h1>

      <div className="mb-4 grid grid-cols-2 gap-2.5 md:grid-cols-4">
        {stats.map((s) => (
          <div
            key={s.label}
            className="rounded-lg border px-3.5 py-3"
            style={{ background: "var(--c-bg2)", borderColor: "var(--c-line)" }}
          >
            <b
              className="block text-2xl leading-tight font-semibold"
              style={{
                color:
                  s.tone === "teal"
                    ? "var(--c-teal)"
                    : s.tone === "red"
                      ? "var(--c-red)"
                      : "var(--c-ink)",
              }}
            >
              {s.value}
            </b>
            <small className="text-xs" style={{ color: "var(--c-mute)" }}>
              {s.label}
            </small>
          </div>
        ))}
      </div>

      {now && (
        <section
          className="mb-4 rounded-lg border-l-[3px] px-3.5 py-3 text-[13px]"
          style={{
            background: "var(--c-bg2)",
            borderColor: "var(--c-amber)",
            color: "var(--c-gate-ink)",
          }}
        >
          <strong>Şu an: {now.n}</strong> ({now.d})
          <div className="mt-1">Sonraki faza geçiş şartı: {now.gate}</div>
        </section>
      )}

      <h2 className="mb-2 text-sm font-medium" style={{ color: "var(--c-mute)" }}>
        Fazlar
      </h2>
      {/* Faza tıklayınca Görevler sekmesi o fazla açılır. */}
      <PhaseStrip
        active={null}
        onSelect={(id) => router.push(id ? `/gorevler?faz=${id}` : "/gorevler")}
        currentId={now?.id}
      />
    </>
  );
}
