"use client";

import { useEffect, useRef, useState } from "react";
import { formatDue, phaseOf } from "@/lib/data";
import { useStore } from "@/lib/store";
import { sorumluSecenekleri, STATUSES, type Status } from "@/lib/types";
import { StatusBadge } from "./Badges";

/** Durum düğmesi seçiliyken alacağı renkler — örnek panodaki .stbtns kalıbı. */
const ON_STYLE: Record<Status, { bg: string; fg: string }> = {
  "Bekliyor": { bg: "transparent", fg: "var(--c-mute)" },
  "Yapılıyor": { bg: "color-mix(in srgb, var(--c-amber) 18%, transparent)", fg: "var(--c-amber)" },
  "Yapıldı": { bg: "color-mix(in srgb, var(--c-green) 18%, transparent)", fg: "var(--c-green)" },
  "Yapılamadı": { bg: "color-mix(in srgb, var(--c-red) 18%, transparent)", fg: "var(--c-red)" },
};

/**
 * Görevin kendisini değil kimliğini alır: durum/not değişince store güncelleniyor,
 * pencere de canlı kaydı okuyup tazeleniyor. Nesne kopyası tutulursa pencere
 * eski veride donup kalıyor.
 */
export function TaskDetail({ taskId, onClose }: { taskId: string | null; onClose: () => void }) {
  const { tasks, phases, kadro, setStatus, addNote, updateTask, removeTask } = useStore();
  const task = tasks.find((t) => t.id === taskId) ?? null;
  const [draft, setDraft] = useState("");
  const [duzenle, setDuzenle] = useState(false);
  const [taslak, setTaslak] = useState({ what: "", why: "", done: "" });
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = dialogRef.current;
    if (!d) return;
    if (task && !d.open) d.showModal();
    if (!task && d.open) d.close();
  }, [task]);

  useEffect(() => {
    setDraft("");
    setDuzenle(false);
  }, [taskId]);

  if (!task) return <dialog ref={dialogRef} className="hidden" />;

  const phase = phaseOf(phases, task.phase);
  const aciklamalar = [
    ["Ne yapılacak", "what", task.what],
    ["Neden önemli", "why", task.why],
    ["Bitti sayılır", "done", task.done],
  ] as const;

  const alanStili = {
    background: "var(--c-bg3)",
    borderColor: "var(--c-line)",
    color: "var(--c-ink)",
  };

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === dialogRef.current) onClose();
      }}
      className="m-auto w-[94vw] max-w-2xl rounded-xl border p-0 backdrop:bg-black/60"
      style={{ background: "var(--c-bg2)", borderColor: "var(--c-line)", color: "var(--c-ink)" }}
    >
      <div className="border-b px-5 py-4" style={{ borderColor: "var(--c-line)" }}>
        <h2 className="text-lg leading-snug font-semibold">{task.title}</h2>
        <p className="mt-1 text-xs" style={{ color: "var(--c-mute)" }}>
          {phase?.n}
          {task.due ? ` · hedef ${formatDue(task.due)}` : " · tarihsiz"}
        </p>
      </div>

      <div className="px-5 py-4">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-xs font-medium" style={{ color: "var(--c-mute)" }}>
            Açıklamalar
          </h3>
          {duzenle ? (
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={() => setDuzenle(false)}
                className="rounded-lg border px-2.5 py-1 text-xs"
                style={{ borderColor: "var(--c-line)", color: "var(--c-mute)" }}
              >
                Vazgeç
              </button>
              <button
                type="button"
                onClick={() => {
                  updateTask(task.id, taslak);
                  setDuzenle(false);
                }}
                className="rounded-lg px-2.5 py-1 text-xs font-semibold"
                style={{ background: "var(--c-teal)", color: "var(--c-teal-ink)" }}
              >
                Kaydet
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => {
                setTaslak({ what: task.what, why: task.why, done: task.done });
                setDuzenle(true);
              }}
              className="rounded-lg border px-2.5 py-1 text-xs"
              style={{ borderColor: "var(--c-line)", color: "var(--c-mute)" }}
            >
              Düzenle
            </button>
          )}
        </div>

        {duzenle
          ? aciklamalar.map(([etiket, anahtar]) => (
              <label key={anahtar} className="mb-2.5 grid gap-1 text-xs" style={{ color: "var(--c-mute)" }}>
                {etiket}
                <textarea
                  value={taslak[anahtar]}
                  onChange={(e) => setTaslak((t) => ({ ...t, [anahtar]: e.target.value }))}
                  rows={2}
                  className="rounded-lg border px-2.5 py-2 text-sm"
                  style={alanStili}
                />
              </label>
            ))
          : aciklamalar.map(([etiket, anahtar, deger]) =>
              deger ? (
                <section key={anahtar} className="mb-3.5">
                  <h4 className="mb-1 text-xs font-medium" style={{ color: "var(--c-mute)" }}>
                    {etiket}
                  </h4>
                  <p className="text-sm">{deger}</p>
                </section>
              ) : null,
            )}

        {!duzenle && !task.what && !task.why && !task.done && (
          <p className="mb-3.5 text-sm" style={{ color: "var(--c-mute)" }}>
            Henüz açıklama yok. &quot;Düzenle&quot; ile ekleyebilirsin.
          </p>
        )}

        <section className="mb-3.5">
          <h3 className="mb-1.5 text-xs font-medium" style={{ color: "var(--c-mute)" }}>
            Durum
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {STATUSES.map((s) => {
              const on = task.status === s;
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStatus(task.id, s)}
                  aria-pressed={on}
                  className="rounded-lg border px-3 py-1.5 text-[13px]"
                  style={{
                    background: on ? ON_STYLE[s].bg : "var(--c-bg3)",
                    borderColor: on ? ON_STYLE[s].fg : "var(--c-line)",
                    color: on ? ON_STYLE[s].fg : "var(--c-ink)",
                    fontWeight: on ? 600 : 400,
                  }}
                >
                  {s}
                </button>
              );
            })}
          </div>
        </section>

        <section className="mb-3.5 flex flex-wrap gap-2">
          <label className="flex items-center gap-1.5 text-xs" style={{ color: "var(--c-mute)" }}>
            Sorumlu
            <select
              value={task.owner}
              onChange={(e) => updateTask(task.id, { owner: e.target.value })}
              className="rounded-lg border px-2 py-1 text-sm"
              style={{
                background: "var(--c-bg3)",
                borderColor: "var(--c-line)",
                color: "var(--c-ink)",
              }}
            >
              {sorumluSecenekleri(kadro, task.owner).map((s) => (
                <option key={s.deger} value={s.deger}>
                  {s.etiket}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-1.5 text-xs" style={{ color: "var(--c-mute)" }}>
            Hedef tarih
            <input
              type="date"
              value={task.due}
              onChange={(e) => updateTask(task.id, { due: e.target.value })}
              className="rounded-lg border px-2 py-1 text-sm"
              style={{
                background: "var(--c-bg3)",
                borderColor: "var(--c-line)",
                color: "var(--c-ink)",
              }}
            />
          </label>
        </section>

        <section>
          <h3 className="mb-1.5 text-xs font-medium" style={{ color: "var(--c-mute)" }}>
            Notlar
          </h3>
          {task.notes.length === 0 && (
            <p className="text-sm" style={{ color: "var(--c-mute)" }}>
              Henüz not yok.
            </p>
          )}
          {task.notes.map((n, i) => (
            <div
              key={i}
              className="my-1.5 rounded-r-md border-l-2 px-2.5 py-2 text-[13px]"
              style={{ background: "var(--c-bg3)", borderColor: "var(--c-line)" }}
            >
              <div style={{ color: "var(--c-mute)" }} className="text-[11px]">
                {n.actor} · {new Date(n.at).toLocaleString("tr-TR")}
              </div>
              {n.body}
            </div>
          ))}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              addNote(task.id, draft);
              setDraft("");
            }}
            className="mt-2 flex gap-1.5"
          >
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Not ekle — ne oldu, ne bekliyorsun?"
              className="min-w-0 flex-1 rounded-lg border px-2.5 py-1.5 text-sm"
              style={{
                background: "var(--c-bg3)",
                borderColor: "var(--c-line)",
                color: "var(--c-ink)",
              }}
            />
            <button
              type="submit"
              className="rounded-lg px-3 py-1.5 text-sm font-semibold"
              style={{ background: "var(--c-teal)", color: "var(--c-teal-ink)" }}
            >
              Ekle
            </button>
          </form>
        </section>
      </div>

      <div
        className="flex items-center justify-between gap-2 border-t px-5 py-3"
        style={{ borderColor: "var(--c-line)" }}
      >
        <button
          type="button"
          onClick={() => {
            removeTask(task.id);
            onClose();
          }}
          className="rounded-lg border px-3 py-1.5 text-sm"
          style={{ borderColor: "var(--c-red)", color: "var(--c-red)" }}
        >
          Sil
        </button>
        <div className="flex items-center gap-2">
          <StatusBadge status={task.status} />
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border px-3 py-1.5 text-sm"
            style={{ borderColor: "var(--c-line)", color: "var(--c-ink)" }}
          >
            Kapat
          </button>
        </div>
      </div>
    </dialog>
  );
}
