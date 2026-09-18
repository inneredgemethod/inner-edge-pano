"use client";

import Link from "next/link";
import { formatDue, gorevGrubu, isDone, isLate } from "@/lib/data";
import { useStore } from "@/lib/store";
import { kisiRengi, panoyaGirenler } from "@/lib/types";

/**
 * "Bu hafta" özet kartı (B4): kişi başı açık/geciken + en yakın 3 görev.
 * Pazartesi toplantısında tek ekrandan "kim ne durumda" okunabilsin diye.
 */
export function BuHaftaKarti() {
  const { tasks, kadro, today } = useStore();

  const buHafta = tasks.filter((t) => {
    const g = gorevGrubu(t, today);
    return g === "Bu hafta" || g === "Gecikmiş";
  });

  const kisiler = panoyaGirenler(kadro).map((k) => {
    const kendi = buHafta.filter((t) => t.owner === k.display_name && !isDone(t));
    return {
      ad: k.display_name,
      renk: k.color,
      acik: kendi.length,
      geciken: kendi.filter((t) => isLate(t, today)).length,
    };
  });

  // Tarihi olan, bitmemiş, en yakın üç görev.
  const yaklasan = buHafta
    .filter((t) => !isDone(t) && t.due)
    .sort((a, b) => a.due.localeCompare(b.due))
    .slice(0, 3);

  return (
    <section
      className="mb-4 rounded-lg border p-4"
      style={{ background: "var(--c-bg2)", borderColor: "var(--c-line)" }}
    >
      <div className="mb-2.5 flex items-center gap-2">
        <h2 className="text-sm font-semibold">Bu hafta</h2>
        <Link
          href="/gorevler?gorunum=hafta"
          className="ml-auto text-xs"
          style={{ color: "var(--c-teal)" }}
        >
          Hafta görünümü →
        </Link>
      </div>

      {buHafta.length === 0 ? (
        <p className="text-sm" style={{ color: "var(--c-mute)" }}>
          Bu hafta için tarihi gelmiş görev yok.
        </p>
      ) : (
        <>
          <div className="flex flex-wrap gap-2">
            {kisiler.map((k) => (
              <span
                key={k.ad}
                className="flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[13px]"
                style={{ borderColor: "var(--c-line)" }}
              >
                <span aria-hidden className="size-2.5 rounded-full" style={{ background: k.renk }} />
                <b>{k.ad}</b>
                <span style={{ color: "var(--c-mute)" }}>{k.acik} açık</span>
                {k.geciken > 0 && <span style={{ color: "var(--c-red)" }}>{k.geciken} geciken</span>}
              </span>
            ))}
          </div>

          {yaklasan.length > 0 && (
            <ul className="mt-3 grid gap-1.5">
              {yaklasan.map((t) => (
                // min-w-0 şart: grid öğelerinin varsayılan min-width'i `auto`,
                // yani içerikten dar olamıyorlar ve alttaki truncate devreye
                // girmiyordu. Sonuç 31px yatay taşma — mobil tarayıcı sayfayı
                // uzaklaştırıp alt sekme çubuğunu ekran dışına itiyordu.
                <li key={t.id} className="flex min-w-0 items-center gap-2 text-[13px]">
                  <span
                    aria-hidden
                    className="size-2 shrink-0 rounded-full"
                    style={{ background: kisiRengi(kadro, t.owner) }}
                  />
                  <span className="min-w-0 flex-1 truncate">{t.title}</span>
                  <span
                    className="shrink-0"
                    style={{ color: isLate(t, today) ? "var(--c-red)" : "var(--c-mute)" }}
                  >
                    {formatDue(t.due)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </section>
  );
}
