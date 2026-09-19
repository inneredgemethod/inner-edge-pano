"use client";

import { tamamlananGruplari } from "@/lib/data";
import type { Task } from "@/lib/types";
import { TaskRow } from "./TaskRow";

/**
 * "Neyi ne zaman bitirdik" görünümü (0011).
 *
 * Bitiş gününe göre gruplu, en yeni gün üstte. Liste görünümündeki gruplama
 * hedef tarihe bakar — burada hedef değil, GERÇEKLEŞEN tarih önemli.
 */
export function GecmisGorunumu({
  tasks,
  onOpen,
  filtreVar = false,
}: {
  tasks: Task[];
  onOpen: (t: Task) => void;
  /** Arama/kişi/faz filtresi açıksa boş liste "hiç bitmedi" demek DEĞİLDİR. */
  filtreVar?: boolean;
}) {
  const gruplar = tamamlananGruplari(tasks);
  const toplam = gruplar.reduce((n, g) => n + g.tasks.length, 0);

  if (toplam === 0) {
    return (
      <p className="mt-6 text-[13px]" style={{ color: "var(--c-mute)" }}>
        {filtreVar
          ? "Bu filtreye uyan tamamlanmış görev yok. Aramayı veya kişi/faz filtresini temizleyip tekrar bak."
          : "Henüz tamamlanmış görev yok. Bir görevi soldaki ✓ ile bitirdiğinde burada tarihiyle birlikte görünecek."}
      </p>
    );
  }

  return (
    <div className="mt-3">
      <p className="mb-3 text-[13px]" style={{ color: "var(--c-mute)" }}>
        {toplam} tamamlanmış görev, bitiş gününe göre.
      </p>
      {gruplar.map((g) => (
        <section key={g.gun || "bilinmiyor"} className="mb-4">
          <h2 className="mb-1.5 text-[13px] font-semibold" style={{ color: "var(--c-green)" }}>
            {g.etiket} · {g.tasks.length}
          </h2>
          {g.tasks.map((t) => (
            <TaskRow key={t.id} task={t} onOpen={onOpen} />
          ))}
        </section>
      ))}
    </div>
  );
}
