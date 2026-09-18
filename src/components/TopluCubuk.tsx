"use client";

import { useEffect, useRef, useState } from "react";
import { useStore } from "@/lib/store";
import { OWNERS } from "@/lib/types";

/**
 * Seçim modundaki alt işlem çubuğu (A1).
 * Mobilde alt sekme çubuğunun ÜSTÜNE oturur, onu örtmez.
 */
export function TopluCubuk({
  secililer,
  onTemizle,
  onCik,
}: {
  secililer: string[];
  onTemizle: () => void;
  onCik: () => void;
}) {
  const { phases, topluDegistir, topluKaldir } = useStore();
  const [silOnayi, setSilOnayi] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = dialogRef.current;
    if (!d) return;
    if (silOnayi && !d.open) d.showModal();
    if (!silOnayi && d.open) d.close();
  }, [silOnayi]);

  const n = secililer.length;
  const alan = {
    background: "var(--c-bg3)",
    borderColor: "var(--c-line)",
    color: "var(--c-ink)",
  };

  return (
    <>
      <div
        className="fixed inset-x-0 bottom-[4.25rem] z-30 border-t px-3 py-2.5 md:bottom-0"
        style={{
          background: "var(--c-bg2)",
          borderColor: "var(--c-line)",
          paddingBottom: "max(0.625rem, env(safe-area-inset-bottom))",
        }}
      >
        <div className="mx-auto max-w-5xl">
          {/* 1. satır: sayaç + çıkışlar. 2. satır: işlemler, yatay kaydırmalı.
              Tek satıra sığdırmaya çalışmak telefonda 4 satıra yayılıp listeyi
              örtüyordu. */}
          <div className="flex items-center gap-2">
            <strong className="text-sm" style={{ color: "var(--c-teal)" }}>
              {n} seçili
            </strong>
            <span className="flex-1" />
            <button
              type="button"
              onClick={onTemizle}
              disabled={n === 0}
              className="rounded-lg border px-2.5 py-1 text-xs disabled:opacity-50"
              style={{ borderColor: "var(--c-line)", color: "var(--c-mute)" }}
            >
              Seçimi bırak
            </button>
            <button
              type="button"
              onClick={onCik}
              className="rounded-lg border px-2.5 py-1 text-xs"
              style={{ borderColor: "var(--c-line)", color: "var(--c-mute)" }}
            >
              Kapat
            </button>
          </div>

          <div className="no-scrollbar mt-2 flex gap-2 overflow-x-auto">
            {/* Sil en solda: yatay kaydırmada ekran dışında kalmasın.
                "Kapat"ın yanına koymuyoruz — yanlış dokunma riski. */}
            <button
              type="button"
              disabled={n === 0}
              onClick={() => setSilOnayi(true)}
              className="shrink-0 rounded-lg border px-4 py-1.5 text-sm disabled:opacity-50"
              style={{ borderColor: "var(--c-red)", color: "var(--c-red)" }}
            >
              Sil
            </button>

            <select
              aria-label="Sorumlu ata"
              value=""
              disabled={n === 0}
              onChange={(e) => {
                if (e.target.value) topluDegistir(secililer, { owner: e.target.value });
                e.target.value = "";
              }}
              className="shrink-0 rounded-lg border px-2 py-1.5 text-sm disabled:opacity-50"
              style={alan}
            >
              <option value="">Sorumlu…</option>
              {OWNERS.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>

            <select
              aria-label="Faz ata"
              value=""
              disabled={n === 0}
              onChange={(e) => {
                if (e.target.value) topluDegistir(secililer, { phase: e.target.value });
                e.target.value = "";
              }}
              className="shrink-0 rounded-lg border px-2 py-1.5 text-sm disabled:opacity-50"
              style={alan}
            >
              <option value="">Faz…</option>
              {phases.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.n}
                </option>
              ))}
            </select>

            <input
              type="date"
              aria-label="Hedef tarih ata"
              disabled={n === 0}
              onChange={(e) => {
                if (e.target.value) topluDegistir(secililer, { due: e.target.value });
              }}
              className="w-[9.5rem] shrink-0 rounded-lg border px-2 py-1.5 text-sm disabled:opacity-50"
              style={alan}
            />

          </div>
        </div>
      </div>

      <dialog
        ref={dialogRef}
        onClose={() => setSilOnayi(false)}
        className="m-auto w-[92vw] max-w-sm rounded-xl border p-0 backdrop:bg-black/60"
        style={{ background: "var(--c-bg2)", borderColor: "var(--c-line)", color: "var(--c-ink)" }}
      >
        <div className="px-5 py-4">
          <h2 className="text-base font-semibold">{n} görev silinecek</h2>
          <p className="mt-1.5 text-sm" style={{ color: "var(--c-mute)" }}>
            Bu geri alınamaz. Görevlerin notları ve değişiklik kayıtları da silinir.
          </p>
        </div>
        <div
          className="flex justify-end gap-2 border-t px-5 py-3"
          style={{ borderColor: "var(--c-line)" }}
        >
          <button
            type="button"
            onClick={() => setSilOnayi(false)}
            className="rounded-lg border px-3 py-1.5 text-sm"
            style={{ borderColor: "var(--c-line)" }}
          >
            Vazgeç
          </button>
          <button
            type="button"
            onClick={() => {
              topluKaldir(secililer);
              setSilOnayi(false);
              onCik();
            }}
            className="rounded-lg px-3 py-1.5 text-sm font-semibold"
            style={{ background: "var(--c-red)", color: "#fff" }}
          >
            {n} görevi sil
          </button>
        </div>
      </dialog>
    </>
  );
}
