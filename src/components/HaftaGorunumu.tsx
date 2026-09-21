"use client";

import { formatDue, gunAdi, gunEkle, haftaBasi, haftaninGunleri, isDone } from "@/lib/data";
import { useStore } from "@/lib/store";
import { kisiRengi, type Task } from "@/lib/types";

/** Hafta görünümü (B2): Pazartesi'den Pazar'a 7 gün, altlarında o günün görevleri. */
export function HaftaGorunumu({
  tasks,
  demir,
  onDemir,
  onOpen,
}: {
  tasks: Task[];
  /** Hangi haftaya bakıyoruz — boşsa bu hafta. */
  demir: string;
  onDemir: (tarih: string) => void;
  onOpen: (t: Task) => void;
}) {
  const { today, kadro } = useStore();
  const bas = haftaBasi(demir || today);
  const gunler = haftaninGunleri(bas);
  const buHafta = bas === haftaBasi(today);

  const gunun = (g: string) => tasks.filter((t) => t.due === g);
  const tarihsiz = tasks.filter((t) => !t.due);

  const haftaBos = gunler.every((g) => gunun(g).length === 0);

  return (
    <>
      <div className="mt-3 flex items-center gap-2">
        <button
          type="button"
          onClick={() => onDemir(gunEkle(bas, -7))}
          aria-label="Önceki hafta"
          className="rounded-lg border px-3 py-1.5 text-sm"
          style={{ borderColor: "var(--c-line)", color: "var(--c-ink)" }}
        >
          ‹
        </button>
        <span className="flex-1 text-center text-sm font-medium">
          {buHafta ? "Bu hafta" : `${formatDue(bas)} – ${formatDue(gunEkle(bas, 6))}`}
        </span>
        <button
          type="button"
          onClick={() => onDemir(gunEkle(bas, 7))}
          aria-label="Sonraki hafta"
          className="rounded-lg border px-3 py-1.5 text-sm"
          style={{ borderColor: "var(--c-line)", color: "var(--c-ink)" }}
        >
          ›
        </button>
        {!buHafta && (
          <button
            type="button"
            onClick={() => onDemir("")}
            className="rounded-lg border px-2.5 py-1.5 text-xs"
            style={{ borderColor: "var(--c-teal)", color: "var(--c-teal)" }}
          >
            Bugüne dön
          </button>
        )}
      </div>

      {haftaBos && (
        <p className="mt-3 text-[13px]" style={{ color: "var(--c-mute)" }}>
          Bu haftaya tarihlenmiş görev yok. Oklarla başka bir haftaya geçebilir ya da
          Liste görünümünde tarihsiz görevlere bakabilirsin.
        </p>
      )}

      <div className="mt-3 grid gap-2 md:grid-cols-7">
        {gunler.map((g) => {
          const gorevler = gunun(g);
          const bugunMu = g === today;

          // Boş gün TEK SATIR. Eskiden dolu gün kadar yer alıp içine tire
          // koyuyordu; tipik bir haftada yedi günün beşi boş olduğu için
          // ekranın çoğu hiçbir şey söylemeyen kartlarla doluyordu.
          if (gorevler.length === 0) {
            return (
              // `<section>` + `<h3>` KALIYOR: yapı dolu günle aynı olsun ki
              // hem anlamsal olarak her gün bir bölüm kalsın hem testler
              // günleri tek seçiciyle sayabilsin. Değişen sadece yükseklik.
              <section
                key={g}
                className="flex items-center gap-2 rounded-lg border px-3 py-2 md:flex-col md:items-start md:gap-0.5"
                style={{
                  borderColor: bugunMu ? "var(--c-teal)" : "transparent",
                  background: "transparent",
                }}
              >
                <h3
                  className="flex-1 text-xs font-medium"
                  style={{ color: bugunMu ? "var(--c-teal)" : "var(--c-mute)" }}
                >
                  {gunAdi(g)} {formatDue(g)}
                </h3>
                <span className="text-xs" style={{ color: "var(--c-mute)", opacity: 0.65 }}>
                  boş
                </span>
              </section>
            );
          }

          return (
            <section
              key={g}
              className="rounded-lg border p-2"
              style={{
                background: "var(--c-bg2)",
                borderColor: bugunMu ? "var(--c-teal)" : "var(--c-line)",
              }}
            >
              <h3
                className="mb-1.5 text-xs font-medium"
                style={{ color: bugunMu ? "var(--c-teal)" : "var(--c-mute)" }}
              >
                {gunAdi(g)} {formatDue(g)}
                {gorevler.length > 0 && ` · ${gorevler.length}`}
              </h3>

              {gorevler.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => onOpen(t)}
                    className="mb-1 flex w-full items-start gap-1.5 rounded border px-2 py-1.5 text-left text-xs"
                    style={{
                      background: "var(--c-bg3)",
                      borderColor: "var(--c-line)",
                      opacity: isDone(t) ? 0.5 : 1,
                    }}
                  >
                    <span
                      aria-hidden
                      className="mt-1 size-2 shrink-0 rounded-full"
                      style={{ background: kisiRengi(kadro, t.owner) }}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block leading-snug">{t.title}</span>
                      <span style={{ color: "var(--c-mute)" }}>{t.owner}</span>
                    </span>
                  </button>
              ))}
            </section>
          );
        })}
      </div>

      {tarihsiz.length > 0 && (
        <section className="mt-4">
          <h3 className="mb-1.5 text-xs font-medium" style={{ color: "var(--c-mute)" }}>
            Tarihsiz · {tarihsiz.length}
          </h3>
          <p className="text-xs" style={{ color: "var(--c-mute)" }}>
            Bu görevlerin hedef tarihi yok, haftaya yerleşemiyorlar. Liste görünümünden tarih
            verebilirsin.
          </p>
        </section>
      )}
    </>
  );
}
