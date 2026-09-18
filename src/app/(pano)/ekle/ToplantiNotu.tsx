"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { currentPhase, formatDue } from "@/lib/data";
import { useStore } from "@/lib/store";
import { toplantiAyristir } from "@/lib/toplanti";

const ORNEK = `Sarah kurumsal paket taslağını okusun @Sarah #C !25.09
- Yunus içerik envanterini çıkarsın @Yunus #2
Mali müşavire ödeme sorusunu sor @Kürşad !26.09`;

export function ToplantiNotu() {
  const { phases, kadro, today, topluGorevEkle } = useStore();
  const router = useRouter();
  const [metin, setMetin] = useState("");
  const [kaydediliyor, setKaydediliyor] = useState(false);

  const isimler = useMemo(() => kadro.map((k) => k.display_name), [kadro]);
  const satirlar = useMemo(
    () => toplantiAyristir(metin, { phases, kadro: isimler, bugun: today }),
    [metin, phases, isimler, today],
  );

  const varsayilanFaz = currentPhase(phases, today)?.id ?? phases[0]?.id ?? "A";
  const eklenebilir = satirlar.filter((s) => s.title.length > 0);
  const uyariSayisi = satirlar.reduce((n, s) => n + s.uyarilar.length, 0);

  const kutu = { background: "var(--c-bg2)", borderColor: "var(--c-line)", color: "var(--c-ink)" };

  async function ekle() {
    if (eklenebilir.length === 0 || kaydediliyor) return;
    setKaydediliyor(true);
    const hata = await topluGorevEkle(
      eklenebilir.map((s) => ({
        title: s.title,
        // İşaret yazılmamışsa makul varsayılan: sorumlu boş kalmasın diye
        // "Ortak", faz da içinde bulunduğumuz faz.
        owner: s.owner ?? "Ortak",
        phase: s.phase ?? varsayilanFaz,
        due: s.due ?? "",
        week: "",
      })),
    );
    setKaydediliyor(false);
    if (!hata) {
      setMetin("");
      router.push("/gorevler");
    }
  }

  return (
    <>
      <h1 className="mb-1 text-base font-semibold">Toplantı notu → görevler</h1>
      <p className="mb-3 text-[13px]" style={{ color: "var(--c-mute)" }}>
        Her satır bir görev. İstersen işaret koy:{" "}
        <b style={{ color: "var(--c-ink)" }}>@Sarah</b> sorumlu ·{" "}
        <b style={{ color: "var(--c-ink)" }}>#2</b> veya <b style={{ color: "var(--c-ink)" }}>#C</b>{" "}
        faz · <b style={{ color: "var(--c-ink)" }}>!25.09</b> tarih. İşaret koymazsan sorumlu
        &quot;Ortak&quot;, faz içinde bulunduğumuz faz olur.
      </p>

      <textarea
        value={metin}
        onChange={(e) => setMetin(e.target.value)}
        placeholder={ORNEK}
        rows={7}
        aria-label="Toplantı notu"
        className="w-full rounded-lg border px-3 py-2 text-sm"
        style={kutu}
      />

      {metin.trim() === "" ? (
        <button
          type="button"
          onClick={() => setMetin(ORNEK)}
          className="mt-2 rounded-lg border px-3 py-1.5 text-xs"
          style={{ borderColor: "var(--c-line)", color: "var(--c-mute)" }}
        >
          Örnek doldur
        </button>
      ) : (
        <>
          <h2 className="mt-4 mb-2 text-sm font-semibold">
            Önizleme — {eklenebilir.length} görev
            {uyariSayisi > 0 && (
              <span style={{ color: "var(--c-amber)" }}> · {uyariSayisi} uyarı</span>
            )}
          </h2>

          {/* Mobilde kart, masaüstünde tablo. Tablo telefonda yatay kayıyor ve
              "Tarih" sütunu görünmüyordu; kaydırılabildiği de belli olmuyordu. */}
          <ul className="md:hidden">
            {satirlar.map((s) => {
              const faz = phases.find((p) => p.id === (s.phase ?? varsayilanFaz));
              const bos = s.title.length === 0;
              return (
                <li
                  key={s.satir}
                  className="mb-1.5 rounded-lg border px-3 py-2"
                  style={{
                    background: "var(--c-bg2)",
                    borderColor: s.uyarilar.length ? "var(--c-amber)" : "var(--c-line)",
                    opacity: bos ? 0.5 : 1,
                  }}
                >
                  <div className="text-sm font-medium">
                    {bos ? <i style={{ color: "var(--c-mute)" }}>(başlık yok)</i> : s.title}
                  </div>
                  <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs" style={{ color: "var(--c-mute)" }}>
                    <span>👤 {s.owner ?? "Ortak"}</span>
                    <span>📁 {faz?.n ?? "—"}</span>
                    <span>📅 {s.due ? formatDue(s.due) : "—"}</span>
                  </div>
                  {s.uyarilar.map((u, i) => (
                    <div key={i} className="mt-1 text-xs" style={{ color: "var(--c-amber)" }}>
                      ⚠ {u}
                    </div>
                  ))}
                </li>
              );
            })}
          </ul>

          <div className="hidden md:block">
            <table className="w-full text-left text-[13px]">
              <thead>
                <tr style={{ color: "var(--c-mute)" }}>
                  <th className="pb-1 font-medium">Başlık</th>
                  <th className="pb-1 font-medium">Sorumlu</th>
                  <th className="pb-1 font-medium">Faz</th>
                  <th className="pb-1 font-medium">Tarih</th>
                </tr>
              </thead>
              <tbody>
                {satirlar.map((s) => {
                  const faz = phases.find((p) => p.id === (s.phase ?? varsayilanFaz));
                  const bos = s.title.length === 0;
                  return (
                    <tr
                      key={s.satir}
                      className="border-t align-top"
                      style={{ borderColor: "var(--c-line)", opacity: bos ? 0.5 : 1 }}
                    >
                      <td className="py-1.5 pr-2">
                        {bos ? <i style={{ color: "var(--c-mute)" }}>(başlık yok)</i> : s.title}
                        {s.uyarilar.map((u, i) => (
                          <span key={i} className="block text-xs" style={{ color: "var(--c-amber)" }}>
                            ⚠ {u}
                          </span>
                        ))}
                      </td>
                      <td className="py-1.5 pr-2">
                        {s.owner ?? <span style={{ color: "var(--c-mute)" }}>Ortak</span>}
                      </td>
                      <td className="py-1.5 pr-2">
                        <span style={{ color: s.phase ? "var(--c-ink)" : "var(--c-mute)" }}>
                          {faz?.n ?? "—"}
                        </span>
                      </td>
                      <td className="py-1.5">
                        {s.due ? formatDue(s.due) : <span style={{ color: "var(--c-mute)" }}>—</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <button
            type="button"
            onClick={ekle}
            disabled={eklenebilir.length === 0 || kaydediliyor}
            className="mt-4 rounded-lg px-4 py-2 text-sm font-semibold disabled:opacity-60"
            style={{ background: "var(--c-teal)", color: "var(--c-teal-ink)" }}
          >
            {kaydediliyor ? "Ekleniyor…" : `${eklenebilir.length} görevi ekle`}
          </button>
        </>
      )}
    </>
  );
}
