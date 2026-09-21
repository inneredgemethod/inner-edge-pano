"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { fazIdTuret } from "@/lib/supabase/yaz";
import type { Phase } from "@/lib/types";
import { IkonArsiv, IkonAsagi, IkonKalem, IkonYukari } from "./Ikon";

/**
 * Faz yönetimi (2.1). Silme YOK, arşiv var: `tasks.phase_id` fazlara foreign
 * key ile bağlı, silme mevcut görevleri kırardı.
 */
export function FazYonetimi() {
  const { phases, tasks, fazGuncelle, fazOlustur } = useStore();
  const [duzenlenen, setDuzenlenen] = useState<string | null>(null);
  const [taslak, setTaslak] = useState({ name: "", period: "", gate: "" });
  const [yeniAd, setYeniAd] = useState("");
  const [calisiyor, setCalisiyor] = useState(false);

  const aktif = phases.filter((p) => !p.arsiv);
  const arsivli = phases.filter((p) => p.arsiv);

  const alan = {
    background: "var(--c-bg3)",
    borderColor: "var(--c-line)",
    color: "var(--c-ink)",
  };

  const gorevSayisi = (id: string) => tasks.filter((t) => t.phase === id).length;

  async function siraDegistir(p: Phase, yon: -1 | 1) {
    const i = aktif.findIndex((x) => x.id === p.id);
    const komsu = aktif[i + yon];
    if (!komsu || calisiyor) return;
    setCalisiyor(true);
    // sort değerlerini takas et
    const a = phases.indexOf(p);
    const b = phases.indexOf(komsu);
    await fazGuncelle(p.id, { sort: b + 1 });
    await fazGuncelle(komsu.id, { sort: a + 1 });
    setCalisiyor(false);
  }

  function duzenlemeyiAc(p: Phase) {
    setTaslak({ name: p.n, period: p.d, gate: p.gate });
    setDuzenlenen(p.id);
  }

  return (
    <section className="mb-3 rounded-lg border p-4" style={{ background: "var(--c-bg2)", borderColor: "var(--c-line)" }}>
      <h2 className="mb-1 text-sm font-semibold">Fazlar</h2>
      <p className="mb-3 text-[13px]" style={{ color: "var(--c-mute)" }}>
        Silme yok — arşivlenen faz menülerde görünmez ama görevleri bozulmaz.
      </p>

      {aktif.length === 0 && (
        <p className="mb-2 text-[13px]" style={{ color: "var(--c-mute)" }}>
          Aktif faz yok. Aşağıdan yeni bir faz ekle ya da arşivdekini geri al.
        </p>
      )}

      {aktif.map((p, i) => (
        <div key={p.id} className="mb-1.5 rounded-lg border p-2.5" style={{ borderColor: "var(--c-line)" }}>
          {duzenlenen === p.id ? (
            <div className="grid gap-2">
              <input
                value={taslak.name}
                onChange={(e) => setTaslak((t) => ({ ...t, name: e.target.value }))}
                aria-label="Faz adı"
                className="rounded-lg border px-2.5 py-1.5 text-sm"
                style={alan}
              />
              <input
                value={taslak.period}
                onChange={(e) => setTaslak((t) => ({ ...t, period: e.target.value }))}
                placeholder="Dönem etiketi, ör. 14 – 27 Eylül"
                aria-label="Dönem etiketi"
                className="rounded-lg border px-2.5 py-1.5 text-sm"
                style={alan}
              />
              <textarea
                value={taslak.gate}
                onChange={(e) => setTaslak((t) => ({ ...t, gate: e.target.value }))}
                placeholder="Sonraki faza geçiş şartı"
                aria-label="Geçiş şartı"
                rows={2}
                className="rounded-lg border px-2.5 py-1.5 text-sm"
                style={alan}
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={async () => {
                    await fazGuncelle(p.id, {
                      name: taslak.name.trim() || p.n,
                      period: taslak.period.trim(),
                      gate: taslak.gate.trim(),
                    });
                    setDuzenlenen(null);
                  }}
                  className="rounded-lg px-3 py-1.5 text-xs font-semibold"
                  style={{ background: "var(--c-teal)", color: "var(--c-teal-ink)" }}
                >
                  Kaydet
                </button>
                <button
                  type="button"
                  onClick={() => setDuzenlenen(null)}
                  className="rounded-lg border px-3 py-1.5 text-xs"
                  style={{ borderColor: "var(--c-line)", color: "var(--c-mute)" }}
                >
                  Vazgeç
                </button>
              </div>
            </div>
          ) : (
            /* Ad ve dönem TAM GENİŞLİK, eylemler alt satırda. Dördü sağda
               yan yanayken 390px'te ada 107px kalıyor ve uzun faz adları üç
               satıra bölünüyordu. */
            <div>
              <div className="min-w-0">
                <div className="text-[15px] font-semibold">{p.n}</div>
                <div className="mt-0.5 text-xs" style={{ color: "var(--c-mute)" }}>
                  {p.d || "dönem yok"} · {gorevSayisi(p.id)} görev
                </div>
              </div>
              <div className="mt-2.5 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => siraDegistir(p, -1)}
                  disabled={i === 0 || calisiyor}
                  aria-label={`${p.n} yukarı`}
                  className="grid size-11 place-items-center rounded-lg border disabled:opacity-50"
                  style={{ borderColor: "var(--c-line)", color: "var(--c-mute)" }}
                >
                  <IkonYukari boyut={17} />
                </button>
                <button
                  type="button"
                  onClick={() => siraDegistir(p, 1)}
                  disabled={i === aktif.length - 1 || calisiyor}
                  aria-label={`${p.n} aşağı`}
                  className="grid size-11 place-items-center rounded-lg border disabled:opacity-50"
                  style={{ borderColor: "var(--c-line)", color: "var(--c-mute)" }}
                >
                  <IkonAsagi boyut={17} />
                </button>
                <button
                  type="button"
                  onClick={() => duzenlemeyiAc(p)}
                  aria-label={`${p.n} düzenle`}
                  className="ml-auto flex min-h-[2.75rem] items-center gap-1.5 rounded-lg border px-3 text-[13px]"
                  style={{ borderColor: "var(--c-line)", color: "var(--c-ink)" }}
                >
                  <IkonKalem boyut={15} />
                  Düzenle
                </button>
                <button
                  type="button"
                  onClick={() => fazGuncelle(p.id, { arsiv: true })}
                  aria-label={`${p.n} arşivle`}
                  className="flex min-h-[2.75rem] items-center gap-1.5 rounded-lg border px-3 text-[13px]"
                  style={{ borderColor: "var(--c-line)", color: "var(--c-mute)" }}
                >
                  <IkonArsiv boyut={15} />
                  Arşivle
                </button>
              </div>
            </div>
          )}
        </div>
      ))}

      {arsivli.length > 0 && (
        <details className="mt-2">
          <summary className="cursor-pointer text-xs" style={{ color: "var(--c-mute)" }}>
            Arşivdeki {arsivli.length} faz
          </summary>
          {arsivli.map((p) => (
            <div key={p.id} className="mt-1.5 flex items-center gap-2 rounded-lg border p-2.5" style={{ borderColor: "var(--c-line)", opacity: 0.7 }}>
              <span className="min-w-0 flex-1 text-sm">{p.n}</span>
              <span className="text-xs" style={{ color: "var(--c-mute)" }}>
                {gorevSayisi(p.id)} görev
              </span>
              <button
                type="button"
                onClick={() => fazGuncelle(p.id, { arsiv: false })}
                aria-label={`${p.n} arşivden geri al`}
                className="min-h-[2.5rem] shrink-0 rounded-lg border px-3 text-xs"
                style={{ borderColor: "var(--c-teal)", color: "var(--c-teal)" }}
              >
                Geri al
              </button>
            </div>
          ))}
        </details>
      )}

      <form
        onSubmit={async (e) => {
          e.preventDefault();
          const ad = yeniAd.trim();
          if (!ad || calisiyor) return;
          setCalisiyor(true);
          await fazOlustur({
            // id kullanıcıdan istenmiyor: addan türetiliyor, çakışırsa sayılanıyor.
            id: fazIdTuret(ad, phases.map((p) => p.id)),
            name: ad,
            period: "",
            gate: "",
            sort: phases.length + 1,
          });
          setYeniAd("");
          setCalisiyor(false);
        }}
        className="mt-3 flex gap-2"
      >
        <input
          value={yeniAd}
          onChange={(e) => setYeniAd(e.target.value)}
          placeholder="Yeni faz adı"
          aria-label="Yeni faz adı"
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
      </form>
    </section>
  );
}
