"use client";

import Link from "next/link";
import { useState } from "react";
import { isDone, isLate } from "@/lib/data";
import { useStore } from "@/lib/store";
import type { Task } from "@/lib/types";
import { TaskDetail } from "./TaskDetail";
import { TaskRow } from "./TaskRow";

const GOSTERILEN = 5;

/**
 * Genel Bakış'ta seçili kişinin açık işleri — "Benim" sayfasının kısa
 * önizlemesi, yerine geçeni değil.
 *
 * Geciken görevler ayrı bir alt başlığa BÖLÜNMÜYOR: TaskRow gecikeni zaten
 * kırmızı çerçeve ve kırmızı tarihle gösteriyor, beş satırlık bir listeyi
 * ikiye bölmek okumayı zorlaştırırdı. Geciken sayısı başlıkta duruyor.
 */
export function AcikGorevlerim() {
  const { tasks, me, today } = useStore();
  const [openId, setOpenId] = useState<string | null>(null);

  const acik = tasks.filter((t) => t.owner === me && !isDone(t));
  const geciken = acik.filter((t) => isLate(t, today)).length;

  const sirali = [...acik].sort((a, b) => {
    const ag = isLate(a, today) ? 0 : 1;
    const bg = isLate(b, today) ? 0 : 1;
    if (ag !== bg) return ag - bg;
    // Tarihsizler en sona: boş dize her ISO tarihten küçük olduğu için
    // düz karşılaştırma onları BAŞA alırdı.
    if (!a.due && !b.due) return 0;
    if (!a.due) return 1;
    if (!b.due) return -1;
    return a.due.localeCompare(b.due);
  });

  const gosterilecek = sirali.slice(0, GOSTERILEN);

  return (
    <section className="mb-4">
      <h2 className="mb-2 text-sm font-medium" style={{ color: "var(--c-mute)" }}>
        {me}, açık görevlerin
        {geciken > 0 && (
          <span style={{ color: "var(--c-red)" }}> · {geciken} geciken</span>
        )}
      </h2>

      {gosterilecek.length === 0 ? (
        <p
          className="rounded-lg border px-3.5 py-3 text-[13px]"
          style={{ background: "var(--c-bg2)", borderColor: "var(--c-line)", color: "var(--c-mute)" }}
        >
          Şu an üstünde açık görev yok 🎉{" "}
          <Link href="/gorevler" style={{ color: "var(--c-teal)" }}>
            Panodaki bütün görevlere bak
          </Link>
          .
        </p>
      ) : (
        <>
          {gosterilecek.map((t: Task) => (
            <TaskRow key={t.id} task={t} onOpen={(g) => setOpenId(g.id)} />
          ))}
          {acik.length > GOSTERILEN && (
            <Link
              // Filtre parametresi `kisi` (bkz. lib/filtre.ts › filtreyiUygula).
              // İsimlerde Türkçe harf var, encode şart.
              href={`/gorevler?kisi=${encodeURIComponent(me)}`}
              className="mt-1 inline-block text-[13px]"
              style={{ color: "var(--c-teal)" }}
            >
              Tümünü gör ({acik.length}) →
            </Link>
          )}
        </>
      )}

      <TaskDetail taskId={openId} onClose={() => setOpenId(null)} />
    </section>
  );
}
