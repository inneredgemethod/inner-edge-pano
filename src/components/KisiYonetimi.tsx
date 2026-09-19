"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import type { Kisi } from "@/lib/types";

/** Yeni kişi için teklif edilen renkler — mevcut kadroyla çakışmasın diye. */
const RENKLER = ["#3ee0cc", "#c9a6ff", "#7cc4ff", "#ffb37c", "#f7e18b", "#a8e6a3", "#ffa8c5", "#d9dee5"];

/**
 * Kişi yönetimi (2.1).
 *
 * Ad DEĞİŞTİRİLEMEZ: `tasks.owner`, `tasks.created_by` ve `task_events.actor`
 * adı düz metin olarak tutuyor; yeniden adlandırma bu üçünü sessizce tutarsız
 * bırakırdı. Gerekirse arşivle + yeni kişi ekle.
 */
export function KisiYonetimi() {
  const { kadro, tasks, kisiGuncelle, kisiOlustur } = useStore();
  const [yeniAd, setYeniAd] = useState("");
  const [yeniRenk, setYeniRenk] = useState(RENKLER[3]);
  const [girebilir, setGirebilir] = useState(false);
  const [calisiyor, setCalisiyor] = useState(false);

  const aktif = kadro.filter((k) => !k.arsiv);
  const arsivli = kadro.filter((k) => k.arsiv);
  const gorevSayisi = (ad: string) => tasks.filter((t) => t.owner === ad).length;

  const alan = { background: "var(--c-bg3)", borderColor: "var(--c-line)", color: "var(--c-ink)" };

  const satir = (k: Kisi, arsivdeMi: boolean) => (
    <div
      key={k.display_name}
      className="mb-1.5 flex flex-wrap items-center gap-2 rounded-lg border p-2.5"
      style={{ borderColor: "var(--c-line)", opacity: arsivdeMi ? 0.7 : 1 }}
    >
      <span aria-hidden className="size-4 shrink-0 rounded-full" style={{ background: k.color }} />
      <span className="text-sm font-medium">{k.display_name}</span>
      <span className="text-xs" style={{ color: "var(--c-mute)" }}>
        {gorevSayisi(k.display_name)} görev
      </span>

      {!arsivdeMi && (
        <label className="flex items-center gap-1.5 text-xs" style={{ color: "var(--c-mute)" }}>
          <input
            type="checkbox"
            checked={!k.sadece_sorumlu}
            aria-label={`${k.display_name} panoya girebilir`}
            onChange={(e) => kisiGuncelle(k.display_name, { sadece_sorumlu: !e.target.checked })}
          />
          Panoya girebilir
        </label>
      )}

      <button
        type="button"
        onClick={() => kisiGuncelle(k.display_name, { arsiv: !arsivdeMi })}
        aria-label={`${k.display_name} ${arsivdeMi ? "arşivden geri al" : "arşivle"}`}
        className="ml-auto shrink-0 rounded border px-2 py-1 text-xs"
        style={{
          borderColor: arsivdeMi ? "var(--c-teal)" : "var(--c-line)",
          color: arsivdeMi ? "var(--c-teal)" : "var(--c-mute)",
        }}
      >
        {arsivdeMi ? "Geri al" : "Arşivle"}
      </button>
    </div>
  );

  return (
    <section
      className="mb-3 rounded-lg border p-4"
      style={{ background: "var(--c-bg2)", borderColor: "var(--c-line)" }}
    >
      <h2 className="mb-1 text-sm font-semibold">Kişiler</h2>
      <p className="mb-3 text-[13px]" style={{ color: "var(--c-mute)" }}>
        &quot;Panoya girebilir&quot; işaretli olanlar üstteki &quot;Ben&quot; menüsünde çıkar.
        İşaretsizler yalnızca göreve sorumlu atanabilir. Ad sonradan değiştirilemez — görevler
        ve kayıtlar adı metin olarak tutuyor.
      </p>

      {aktif.map((k) => satir(k, false))}

      {arsivli.length > 0 && (
        <details className="mt-2">
          <summary className="cursor-pointer text-xs" style={{ color: "var(--c-mute)" }}>
            Arşivdeki {arsivli.length} kişi
          </summary>
          <div className="mt-1.5">{arsivli.map((k) => satir(k, true))}</div>
        </details>
      )}

      <form
        onSubmit={async (e) => {
          e.preventDefault();
          const ad = yeniAd.trim();
          if (!ad || calisiyor) return;
          if (kadro.some((k) => k.display_name === ad)) return;
          setCalisiyor(true);
          await kisiOlustur({
            display_name: ad,
            color: yeniRenk,
            // Varsayılan "panoya giremez": yanlışlıkla erişim vermek,
            // yanlışlıkla vermemekten pahalı.
            sadece_sorumlu: !girebilir,
            sort: kadro.length + 1,
          });
          setYeniAd("");
          setGirebilir(false);
          setCalisiyor(false);
        }}
        className="mt-3 grid gap-2"
      >
        <div className="flex gap-2">
          <input
            value={yeniAd}
            onChange={(e) => setYeniAd(e.target.value)}
            placeholder="Yeni kişi adı"
            aria-label="Yeni kişi adı"
            className="min-w-0 flex-1 rounded-lg border px-2.5 py-1.5 text-sm"
            style={alan}
          />
          <button
            type="submit"
            disabled={!yeniAd.trim() || calisiyor}
            className="shrink-0 rounded-lg px-3 py-1.5 text-sm font-semibold disabled:opacity-50"
            style={{ background: "var(--c-teal)", color: "var(--c-teal-ink)" }}
          >
            Ekle
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs" style={{ color: "var(--c-mute)" }}>
            Renk:
          </span>
          {RENKLER.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setYeniRenk(r)}
              aria-label={`Renk ${r}`}
              aria-pressed={yeniRenk === r}
              className="size-6 rounded-full border-2"
              style={{ background: r, borderColor: yeniRenk === r ? "var(--c-ink)" : "transparent" }}
            />
          ))}
        </div>

        <label className="flex items-center gap-1.5 text-xs" style={{ color: "var(--c-mute)" }}>
          <input type="checkbox" checked={girebilir} onChange={(e) => setGirebilir(e.target.checked)} />
          Panoya da girebilsin (şifreyi bilirse &quot;Ben&quot; menüsünde çıkar)
        </label>
      </form>
    </section>
  );
}
