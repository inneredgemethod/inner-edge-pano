"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { gorevleriDisaAktar, gorevleriIceAktar, type AktarimDosyasi } from "@/lib/supabase/yaz";
import { aktifFazlar, sorumluOlabilir } from "@/lib/types";

type Onizleme = {
  dosya: AktarimDosyasi;
  bilinmeyenFaz: string[];
  bilinmeyenSorumlu: string[];
};

/** Görev dışa/içe aktarma (2.4). İçe aktarma yalnızca ekler, değiştirmez. */
export function Aktarim() {
  const { phases, kadro, me } = useStore();
  const router = useRouter();
  const dosyaRef = useRef<HTMLInputElement>(null);
  const [onizleme, setOnizleme] = useState<Onizleme | null>(null);
  const [durum, setDurum] = useState<string | null>(null);
  const [calisiyor, setCalisiyor] = useState(false);

  const kutu = { background: "var(--c-bg2)", borderColor: "var(--c-line)" };

  async function dosyaSecildi(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setDurum(null);
    try {
      const icerik = JSON.parse(await f.text()) as AktarimDosyasi;
      if (!Array.isArray(icerik.tasks)) {
        setDurum("Bu dosyada `tasks` listesi yok. Panodan indirilmiş bir dosya seç.");
        setOnizleme(null);
        return;
      }
      const fazIdler = aktifFazlar(phases).map((p) => p.id);
      const isimler = sorumluOlabilir(kadro).map((k) => k.display_name);
      setOnizleme({
        dosya: icerik,
        bilinmeyenFaz: [...new Set(icerik.tasks.map((t) => t.phase).filter((p) => !fazIdler.includes(p)))],
        bilinmeyenSorumlu: [...new Set(icerik.tasks.map((t) => t.owner).filter((o) => !isimler.includes(o)))],
      });
    } catch {
      setDurum("Dosya okunamadı — geçerli bir JSON değil.");
      setOnizleme(null);
    }
  }

  return (
    <section className="mb-3 rounded-lg border p-4" style={kutu}>
      <h2 className="text-sm font-semibold">Görevleri dışa / içe aktar</h2>
      <p className="mt-1 mb-3 text-[13px]" style={{ color: "var(--c-mute)" }}>
        Dışa aktarılan dosya <code>04_gorevler_seed.json</code> biçiminde.
        İçe aktarma <b>yalnızca ekler</b>, mevcut görevlere dokunmaz — temiz sayfa istiyorsan
        önce &quot;Panoyu sıfırla&quot;.
      </p>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={async () => setDurum((await gorevleriDisaAktar()) ?? "Görevler indirildi.")}
          className="rounded-lg border px-3 py-2 text-sm"
          style={{ borderColor: "var(--c-teal)", color: "var(--c-teal)" }}
        >
          Görevleri indir
        </button>
        <button
          type="button"
          onClick={() => dosyaRef.current?.click()}
          className="rounded-lg border px-3 py-2 text-sm"
          style={{ borderColor: "var(--c-line)", color: "var(--c-ink)" }}
        >
          Dosyadan içe aktar…
        </button>
        <input
          ref={dosyaRef}
          type="file"
          accept="application/json,.json"
          onChange={dosyaSecildi}
          className="hidden"
          aria-label="İçe aktarılacak JSON dosyası"
        />
      </div>

      {onizleme && (
        <div className="mt-3 rounded-lg border p-3" style={{ borderColor: "var(--c-line)" }}>
          <p className="text-sm">
            <b>{onizleme.dosya.tasks.length} görev</b> eklenecek.
          </p>
          {onizleme.bilinmeyenFaz.length > 0 && (
            <p className="mt-1.5 text-xs" style={{ color: "var(--c-red)" }}>
              ⚠ Tanınmayan faz: {onizleme.bilinmeyenFaz.join(", ")} — bu görevler eklenemez,
              önce fazı oluştur.
            </p>
          )}
          {onizleme.bilinmeyenSorumlu.length > 0 && (
            <p className="mt-1.5 text-xs" style={{ color: "var(--c-amber)" }}>
              ⚠ Kadroda olmayan sorumlu: {onizleme.bilinmeyenSorumlu.join(", ")} — görevler yine
              eklenir, sorumlu adı olduğu gibi kalır.
            </p>
          )}

          <div className="mt-3 flex gap-2">
            <button
              type="button"
              disabled={calisiyor || onizleme.bilinmeyenFaz.length > 0}
              onClick={async () => {
                setCalisiyor(true);
                const h = await gorevleriIceAktar(onizleme.dosya, me);
                setCalisiyor(false);
                setOnizleme(null);
                if (dosyaRef.current) dosyaRef.current.value = "";
                if (h) setDurum(h);
                else {
                  setDurum(`${onizleme.dosya.tasks.length} görev eklendi.`);
                  router.refresh();
                }
              }}
              aria-label="İçe aktarmayı onayla"
              className="rounded-lg px-3 py-1.5 text-sm font-semibold disabled:opacity-50"
              style={{ background: "var(--c-teal)", color: "var(--c-teal-ink)" }}
            >
              {calisiyor ? "Ekleniyor…" : "Ekle"}
            </button>
            <button
              type="button"
              onClick={() => {
                setOnizleme(null);
                if (dosyaRef.current) dosyaRef.current.value = "";
              }}
              className="rounded-lg border px-3 py-1.5 text-sm"
              style={{ borderColor: "var(--c-line)", color: "var(--c-mute)" }}
            >
              Vazgeç
            </button>
          </div>
        </div>
      )}

      {durum && (
        <p className="mt-2 text-[13px]" style={{ color: "var(--c-mute)" }}>
          {durum}
        </p>
      )}
    </section>
  );
}
