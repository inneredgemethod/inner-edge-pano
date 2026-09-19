"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { currentPhase, formatDue } from "@/lib/data";
import { useStore } from "@/lib/store";
import { toplantiAyristir } from "@/lib/toplanti";
import { aktifFazlar, sorumluOlabilir } from "@/lib/types";

const ORNEK = `Sarah kurumsal paket taslağını okusun @Sarah #C !25.09
- Yunus içerik envanterini çıkarsın @Yunus #2
Mali müşavire ödeme sorusunu sor @Kürşad !26.09`;

export function ToplantiNotu() {
  const { phases, kadro, me, today, topluGorevEkle } = useStore();
  const [metin, setMetin] = useState("");
  const [kaydediliyor, setKaydediliyor] = useState(false);
  const [sonuc, setSonuc] = useState<number | null>(null);

  // TAM kadro (Sibel/Emine/Ortak dahil) gidiyor: eskiden yalnızca giriş yapan
  // 3 kişi geçiliyordu ve "@Sibel" hiçbir zaman eşleşmiyordu.
  const isimler = useMemo(() => sorumluOlabilir(kadro).map((k) => k.display_name), [kadro]);
  const fazlar = useMemo(() => aktifFazlar(phases), [phases]);

  // Varsayılan sorumlu, toplantının çalışma birimi: Kürşad "Yunus" seçip 5
  // satır yapıştırıyor, sonra "Sarah" seçip 5 satır daha. Eski sabit
  // varsayılan "Ortak"tı — ve Ortak arşivlendiği için görevler arşivli bir
  // kişiye gidiyordu.
  const [varsayilanSorumlu, setVarsayilanSorumlu] = useState(me);
  const [varsayilanTarih, setVarsayilanTarih] = useState("");

  const satirlar = useMemo(
    () => toplantiAyristir(metin, { phases: fazlar, kadro: isimler, bugun: today }),
    [metin, fazlar, isimler, today],
  );

  const varsayilanFaz = currentPhase(fazlar, today)?.id ?? fazlar[0]?.id ?? "A";
  // Satır içi işaret HER ZAMAN kazanır; varsayılan yalnızca işaret yoksa girer.
  const sorumlusu = (s: (typeof satirlar)[number]) => s.owner ?? varsayilanSorumlu;
  const tarihi = (s: (typeof satirlar)[number]) => s.due ?? varsayilanTarih;

  const eklenebilir = satirlar.filter((s) => s.title.length > 0);
  const uyariSayisi = satirlar.reduce((n, s) => n + s.uyarilar.length, 0);

  // "Kürşad 5 · Sarah 5 · Yunus 5" — toplantıda görmek istenen tek özet.
  const dagilim = useMemo(() => {
    const sayac = new Map<string, number>();
    for (const s of eklenebilir) {
      const k = s.owner ?? varsayilanSorumlu;
      sayac.set(k, (sayac.get(k) ?? 0) + 1);
    }
    return [...sayac.entries()];
  }, [eklenebilir, varsayilanSorumlu]);

  const kutu = { background: "var(--c-bg2)", borderColor: "var(--c-line)", color: "var(--c-ink)" };

  async function ekle() {
    if (eklenebilir.length === 0 || kaydediliyor) return;
    setKaydediliyor(true);
    const sayi = eklenebilir.length;
    const hata = await topluGorevEkle(
      eklenebilir.map((s) => ({
        title: s.title,
        owner: sorumlusu(s),
        phase: s.phase ?? varsayilanFaz,
        due: tarihi(s),
      })),
    );
    setKaydediliyor(false);
    if (!hata) {
      // Sayfada KALIYORUZ. Eskiden /gorevler'e yönlendiriyordu; toplantıda
      // ikinci kişinin satırlarını girmek için her seferinde geri gelmek
      // gerekiyordu.
      setMetin("");
      setSonuc(sayi);
    }
  }

  return (
    <>
      <h1 className="mb-1 text-base font-semibold">Toplantı notu → görevler</h1>
      <p className="mb-3 text-[13px]" style={{ color: "var(--c-mute)" }}>
        Her satır bir görev. Aşağıdan varsayılan sorumluyu seç, satırları yapıştır, ekle —
        sonra bir sonraki kişiyi seçip devam et. İstersen satıra işaret koy:{" "}
        <b style={{ color: "var(--c-ink)" }}>@Sarah</b> sorumlu ·{" "}
        <b style={{ color: "var(--c-ink)" }}>#2</b> veya <b style={{ color: "var(--c-ink)" }}>#C</b>{" "}
        faz · <b style={{ color: "var(--c-ink)" }}>!25.09</b> tarih. İşaret varsa varsayılanı ezer.
      </p>

      <div className="mb-3 grid gap-3 sm:grid-cols-2">
        <label className="grid gap-1 text-xs" style={{ color: "var(--c-mute)" }}>
          Varsayılan sorumlu
          <select
            value={varsayilanSorumlu}
            onChange={(e) => setVarsayilanSorumlu(e.target.value)}
            aria-label="Varsayılan sorumlu"
            className="rounded-lg border px-3 py-2 text-sm"
            style={kutu}
          >
            {isimler.map((k) => (
              <option key={k} value={k}>
                {k}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-1 text-xs" style={{ color: "var(--c-mute)" }}>
          Varsayılan tarih (isteğe bağlı)
          <input
            type="date"
            value={varsayilanTarih}
            onChange={(e) => setVarsayilanTarih(e.target.value)}
            aria-label="Varsayılan tarih"
            className="rounded-lg border px-3 py-2 text-sm"
            style={kutu}
          />
        </label>
      </div>

      <textarea
        value={metin}
        onChange={(e) => {
          setMetin(e.target.value);
          if (sonuc !== null) setSonuc(null);
        }}
        placeholder={ORNEK}
        rows={7}
        aria-label="Toplantı notu"
        className="w-full rounded-lg border px-3 py-2 text-sm"
        style={kutu}
      />

      {sonuc !== null && metin.trim() === "" && (
        <p
          className="mt-2 flex flex-wrap items-center gap-2 rounded-lg border px-3 py-2 text-sm"
          style={{ borderColor: "var(--c-green)", color: "var(--c-green)" }}
        >
          ✓ {sonuc} görev eklendi. Sıradaki kişiyi seçip devam edebilirsin.
          <Link href="/gorevler" className="underline" style={{ color: "var(--c-teal)" }}>
            Görevlere git
          </Link>
        </p>
      )}

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
          <h2 className="mt-4 mb-1 text-sm font-semibold">
            Önizleme — {eklenebilir.length} görev
            {uyariSayisi > 0 && (
              <span style={{ color: "var(--c-amber)" }}> · {uyariSayisi} uyarı</span>
            )}
          </h2>
          {dagilim.length > 0 && (
            <p className="mb-2 text-xs" style={{ color: "var(--c-mute)" }}>
              {dagilim.map(([k, n]) => `${k} ${n}`).join(" · ")}
            </p>
          )}

          {/* Mobilde kart, masaüstünde tablo. Tablo telefonda yatay kayıyor ve
              "Tarih" sütunu görünmüyordu; kaydırılabildiği de belli olmuyordu. */}
          <ul className="md:hidden">
            {satirlar.map((s) => {
              const faz = fazlar.find((p) => p.id === (s.phase ?? varsayilanFaz));
              const bos = s.title.length === 0;
              const due = tarihi(s);
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
                    <span>👤 {sorumlusu(s)}</span>
                    <span>📁 {faz?.n ?? "—"}</span>
                    <span>📅 {due ? formatDue(due) : "—"}</span>
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
                  const faz = fazlar.find((p) => p.id === (s.phase ?? varsayilanFaz));
                  const bos = s.title.length === 0;
                  const due = tarihi(s);
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
                        <span style={{ color: s.owner ? "var(--c-ink)" : "var(--c-mute)" }}>
                          {sorumlusu(s)}
                        </span>
                      </td>
                      <td className="py-1.5 pr-2">
                        <span style={{ color: s.phase ? "var(--c-ink)" : "var(--c-mute)" }}>
                          {faz?.n ?? "—"}
                        </span>
                      </td>
                      <td className="py-1.5">
                        <span style={{ color: s.due ? "var(--c-ink)" : "var(--c-mute)" }}>
                          {due ? formatDue(due) : "—"}
                        </span>
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
            className="mt-4 rounded-lg px-4 py-2 text-sm font-semibold disabled:opacity-50"
            style={{ background: "var(--c-teal)", color: "var(--c-teal-ink)" }}
          >
            {kaydediliyor ? "Ekleniyor…" : `${eklenebilir.length} görevi ekle`}
          </button>
        </>
      )}
    </>
  );
}
