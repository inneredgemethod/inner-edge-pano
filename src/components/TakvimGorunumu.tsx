"use client";

import { useState } from "react";
import {
  ayAdi,
  ayBasi,
  ayEkle,
  formatDue,
  gunAdi,
  HAFTA_BASLIKLARI,
  isDone,
  takvimIzgarasi,
} from "@/lib/data";
import { useStore } from "@/lib/store";
import { kisiRengi, type Task } from "@/lib/types";

/**
 * Ay takvimi (B3). Güne tıkla → o günün görevleri altta listelenir, oradan
 * detaya gidilir. Sürükle-bırak yok: tarih değiştirmek detay penceresinin işi,
 * dokunmatik + fare için iki ayrı kod yolu tutmaya değmiyor.
 */
export function TakvimGorunumu({
  tasks,
  demir,
  onDemir,
  onOpen,
}: {
  tasks: Task[];
  demir: string;
  onDemir: (tarih: string) => void;
  onOpen: (t: Task) => void;
}) {
  const { today, kadro } = useStore();
  const anchor = demir || today;
  const ay = ayBasi(anchor);
  const gunler = takvimIzgarasi(anchor);
  const buAy = ayBasi(today) === ay;
  const [secili, setSecili] = useState<string | null>(null);

  const gunun = (g: string) => tasks.filter((t) => t.due === g);
  const seciliGorevler = secili ? gunun(secili) : [];
  const tarihsiz = tasks.filter((t) => !t.due).length;

  return (
    <>
      <div className="mt-3 flex items-center gap-2">
        <button
          type="button"
          onClick={() => {
            onDemir(ayEkle(anchor, -1));
            setSecili(null);
          }}
          aria-label="Önceki ay"
          className="rounded-lg border px-3 py-1.5 text-sm"
          style={{ borderColor: "var(--c-line)", color: "var(--c-ink)" }}
        >
          ‹
        </button>
        <span className="flex-1 text-center text-sm font-medium">{ayAdi(ay)}</span>
        <button
          type="button"
          onClick={() => {
            onDemir(ayEkle(anchor, 1));
            setSecili(null);
          }}
          aria-label="Sonraki ay"
          className="rounded-lg border px-3 py-1.5 text-sm"
          style={{ borderColor: "var(--c-line)", color: "var(--c-ink)" }}
        >
          ›
        </button>
        {!buAy && (
          <button
            type="button"
            onClick={() => {
              onDemir("");
              setSecili(null);
            }}
            className="rounded-lg border px-2.5 py-1.5 text-xs"
            style={{ borderColor: "var(--c-teal)", color: "var(--c-teal)" }}
          >
            Bugüne dön
          </button>
        )}
      </div>

      <div className="mt-3 grid grid-cols-7 gap-1 text-center text-[11px]" style={{ color: "var(--c-mute)" }}>
        {HAFTA_BASLIKLARI.map((g) => (
          <div key={g}>{g}</div>
        ))}
      </div>

      <div className="mt-1 grid grid-cols-7 gap-1">
        {gunler.map((g) => {
          const gorevler = gunun(g);
          const ayDisi = g.slice(0, 7) !== ay.slice(0, 7);
          const bugunMu = g === today;
          const seciliMi = g === secili;
          return (
            <button
              key={g}
              type="button"
              onClick={() => setSecili(seciliMi ? null : g)}
              aria-label={`${formatDue(g)} ${gunAdi(g)}, ${gorevler.length} görev`}
              aria-pressed={seciliMi}
              className="flex min-h-[3.5rem] flex-col items-center gap-1 rounded border p-1"
              style={{
                background: seciliMi ? "var(--c-bg3)" : "var(--c-bg2)",
                borderColor: seciliMi
                  ? "var(--c-teal)"
                  : bugunMu
                    ? "var(--c-teal)"
                    : "var(--c-line)",
                opacity: ayDisi ? 0.4 : 1,
              }}
            >
              <span
                className="text-xs"
                style={{
                  color: bugunMu ? "var(--c-teal)" : "var(--c-ink)",
                  fontWeight: bugunMu ? 700 : 400,
                }}
              >
                {Number(g.slice(8))}
              </span>
              <span className="flex flex-wrap justify-center gap-0.5">
                {gorevler.slice(0, 4).map((t) => (
                  <span
                    key={t.id}
                    aria-hidden
                    className="size-1.5 rounded-full"
                    style={{
                      background: kisiRengi(kadro, t.owner),
                      opacity: isDone(t) ? 0.35 : 1,
                    }}
                  />
                ))}
                {gorevler.length > 4 && (
                  <span className="text-[9px] leading-none" style={{ color: "var(--c-mute)" }}>
                    +{gorevler.length - 4}
                  </span>
                )}
              </span>
            </button>
          );
        })}
      </div>

      {secili && (
        <section className="mt-4">
          <h3 className="mb-1.5 text-xs font-medium" style={{ color: "var(--c-mute)" }}>
            {formatDue(secili)} {gunAdi(secili)} · {seciliGorevler.length} görev
          </h3>
          {seciliGorevler.length === 0 ? (
            <p className="text-sm" style={{ color: "var(--c-mute)" }}>
              Bu gün boş.
            </p>
          ) : (
            seciliGorevler.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => onOpen(t)}
                className="mb-1.5 flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm"
                style={{
                  background: "var(--c-bg2)",
                  borderColor: "var(--c-line)",
                  opacity: isDone(t) ? 0.55 : 1,
                }}
              >
                <span
                  aria-hidden
                  className="size-2.5 shrink-0 rounded-full"
                  style={{ background: kisiRengi(kadro, t.owner) }}
                />
                <span className="min-w-0 flex-1">{t.title}</span>
                <span className="text-xs" style={{ color: "var(--c-mute)" }}>
                  {t.owner}
                </span>
              </button>
            ))
          )}
        </section>
      )}

      {tarihsiz > 0 && (
        <p className="mt-4 text-xs" style={{ color: "var(--c-mute)" }}>
          {tarihsiz} görevin hedef tarihi yok, takvimde görünmüyor.
        </p>
      )}
    </>
  );
}
