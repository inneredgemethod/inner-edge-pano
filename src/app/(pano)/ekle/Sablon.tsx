"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { currentPhase, formatDue, gunEkle } from "@/lib/data";
import { SABLONLAR } from "@/lib/sablonlar";
import { useStore } from "@/lib/store";
import { aktifFazlar, sorumluOlabilir } from "@/lib/types";

/**
 * Şablondan görev üretme (2.3). Önizleme + toplu ekleme deseni
 * ToplantiNotu'ndan aynen geliyor — mobilde kart, masaüstünde tablo dahil.
 */
export function Sablon() {
  const { phases, kadro, today, topluGorevEkle } = useStore();
  const router = useRouter();
  const [sablonId, setSablonId] = useState(SABLONLAR[0].id);
  const [baslangic, setBaslangic] = useState(today);
  const [kaydediliyor, setKaydediliyor] = useState(false);

  const sablon = SABLONLAR.find((s) => s.id === sablonId) ?? SABLONLAR[0];
  const fazlar = useMemo(() => aktifFazlar(phases), [phases]);
  const aktifKadro = useMemo(
    () => sorumluOlabilir(kadro).map((k) => k.display_name),
    [kadro],
  );
  const varsayilanFaz = currentPhase(fazlar, today)?.id ?? fazlar[0]?.id ?? "A";

  const satirlar = sablon.gorevler.map((g) => {
    // Şablondaki sorumlu kadroda yoksa (arşivlenmiş olabilir) boş bırakılıyor,
    // sessizce yanlış kişiye atamaktansa görünür şekilde uyarıyoruz.
    const sorumluGecerli = !!g.owner && aktifKadro.includes(g.owner);
    return {
      ...g,
      due: gunEkle(baslangic, g.gunOfseti),
      owner: sorumluGecerli ? g.owner! : "",
      uyari: g.owner && !sorumluGecerli ? `"${g.owner}" kadroda yok` : null,
    };
  });

  const uyariSayisi = satirlar.filter((s) => s.uyari).length;
  const kutu = { background: "var(--c-bg2)", borderColor: "var(--c-line)", color: "var(--c-ink)" };

  async function uygula() {
    if (kaydediliyor) return;
    setKaydediliyor(true);
    const hata = await topluGorevEkle(
      satirlar.map((s) => ({
        title: s.title,
        owner: s.owner || aktifKadro[0] || "Kürşad",
        phase: varsayilanFaz,
        due: s.due,
        what: s.what ?? "",
        why: s.why ?? "",
        done: s.done ?? "",
      })),
    );
    setKaydediliyor(false);
    if (!hata) router.push("/gorevler");
  }

  return (
    <>
      <h1 className="mb-1 text-base font-semibold">Şablondan görev üret</h1>
      <p className="mb-3 text-[13px]" style={{ color: "var(--c-mute)" }}>
        Hazır bir görev setini başlangıç tarihine göre kaydırıp ekler. Hepsi
        içinde bulunduğumuz faza ({fazlar.find((f) => f.id === varsayilanFaz)?.n}) girer;
        sonradan toplu seçimle değiştirebilirsin.
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="grid gap-1 text-xs" style={{ color: "var(--c-mute)" }}>
          Şablon
          <select
            value={sablonId}
            onChange={(e) => setSablonId(e.target.value)}
            className="rounded-lg border px-3 py-2 text-sm"
            style={kutu}
          >
            {SABLONLAR.map((s) => (
              <option key={s.id} value={s.id}>
                {s.ad} ({s.gorevler.length} görev)
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-1 text-xs" style={{ color: "var(--c-mute)" }}>
          Başlangıç tarihi
          <input
            type="date"
            value={baslangic}
            onChange={(e) => setBaslangic(e.target.value)}
            className="rounded-lg border px-3 py-2 text-sm"
            style={kutu}
          />
        </label>
      </div>

      <p className="mt-2 text-[13px]" style={{ color: "var(--c-mute)" }}>
        {sablon.aciklama}
      </p>

      <h2 className="mt-4 mb-2 text-sm font-semibold">
        Önizleme — {satirlar.length} görev
        {uyariSayisi > 0 && <span style={{ color: "var(--c-amber)" }}> · {uyariSayisi} uyarı</span>}
      </h2>

      <ul className="md:hidden">
        {satirlar.map((s, i) => (
          <li
            key={i}
            className="mb-1.5 rounded-lg border px-3 py-2"
            style={{
              background: "var(--c-bg2)",
              borderColor: s.uyari ? "var(--c-amber)" : "var(--c-line)",
            }}
          >
            <div className="text-sm font-medium">{s.title}</div>
            <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs" style={{ color: "var(--c-mute)" }}>
              <span>👤 {s.owner || aktifKadro[0]}</span>
              <span>📅 {formatDue(s.due)}</span>
            </div>
            {s.uyari && (
              <div className="mt-1 text-xs" style={{ color: "var(--c-amber)" }}>
                ⚠ {s.uyari} — {aktifKadro[0]} atanacak
              </div>
            )}
          </li>
        ))}
      </ul>

      <div className="hidden md:block">
        <table className="w-full text-left text-[13px]">
          <thead>
            <tr style={{ color: "var(--c-mute)" }}>
              <th className="pb-1 font-medium">Başlık</th>
              <th className="pb-1 font-medium">Sorumlu</th>
              <th className="pb-1 font-medium">Tarih</th>
            </tr>
          </thead>
          <tbody>
            {satirlar.map((s, i) => (
              <tr key={i} className="border-t align-top" style={{ borderColor: "var(--c-line)" }}>
                <td className="py-1.5 pr-2">
                  {s.title}
                  {s.uyari && (
                    <span className="block text-xs" style={{ color: "var(--c-amber)" }}>
                      ⚠ {s.uyari} — {aktifKadro[0]} atanacak
                    </span>
                  )}
                </td>
                <td className="py-1.5 pr-2">{s.owner || aktifKadro[0]}</td>
                <td className="py-1.5">{formatDue(s.due)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <button
        type="button"
        onClick={uygula}
        disabled={kaydediliyor}
        className="mt-4 rounded-lg px-4 py-2 text-sm font-semibold disabled:opacity-60"
        style={{ background: "var(--c-teal)", color: "var(--c-teal-ink)" }}
      >
        {kaydediliyor ? "Ekleniyor…" : `${satirlar.length} görevi ekle`}
      </button>
    </>
  );
}
