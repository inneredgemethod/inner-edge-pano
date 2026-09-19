"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Aktarim } from "@/components/Aktarim";
import { FazYonetimi } from "@/components/FazYonetimi";
import { KisiYonetimi } from "@/components/KisiYonetimi";
import { useStore } from "@/lib/store";
import { panoyuSifirla, yedekIndir } from "@/lib/supabase/yaz";

const ONAY_KELIMESI = "SİL";

export default function Ayarlar() {
  const { tasks, phases, kadro } = useStore();
  const router = useRouter();
  const [durum, setDurum] = useState<string | null>(null);
  const [onayMetni, setOnayMetni] = useState("");
  const [acik, setAcik] = useState(false);
  const [calisiyor, setCalisiyor] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = dialogRef.current;
    if (!d) return;
    if (acik && !d.open) d.showModal();
    if (!acik && d.open) d.close();
  }, [acik]);

  const kutu = { background: "var(--c-bg2)", borderColor: "var(--c-line)" };

  async function sifirla() {
    setCalisiyor(true);
    // Silmeden ÖNCE yedek indir. Tek düğmeyle veri kaybı olmasın.
    const yedekHatasi = await yedekIndir();
    if (yedekHatasi) {
      setDurum(`Yedek alınamadı, sıfırlama iptal edildi: ${yedekHatasi}`);
      setCalisiyor(false);
      return;
    }
    const hata = await panoyuSifirla();
    setCalisiyor(false);
    setAcik(false);
    setOnayMetni("");
    if (hata) setDurum(hata);
    else {
      setDurum("Pano sıfırlandı. Yedek dosyası indirildi.");
      router.refresh();
    }
  }

  return (
    <>
      <h1 className="mb-4 text-base font-semibold">Ayarlar</h1>

      <section className="mb-3 rounded-lg border p-4" style={kutu}>
        <h2 className="text-sm font-semibold">Panoda ne var</h2>
        <p className="mt-1 text-[13px]" style={{ color: "var(--c-mute)" }}>
          {tasks.length} görev · {phases.length} faz · {kadro.length} kişi
        </p>
      </section>

      <FazYonetimi />
      <KisiYonetimi />

      <section className="mb-3 rounded-lg border p-4" style={kutu}>
        <h2 className="text-sm font-semibold">Yedek al</h2>
        <p className="mt-1 mb-3 text-[13px]" style={{ color: "var(--c-mute)" }}>
          Görevler, notlar, değişiklik kayıtları, fazlar ve kişiler tek bir JSON
          dosyası olarak cihazına iner.
        </p>
        <button
          type="button"
          onClick={async () => {
            const h = await yedekIndir();
            setDurum(h ?? "Yedek indirildi.");
          }}
          className="rounded-lg border px-3 py-2 text-sm"
          style={{ borderColor: "var(--c-teal)", color: "var(--c-teal)" }}
        >
          Yedeği indir
        </button>
      </section>

      <Aktarim />

      <section className="rounded-lg border p-4" style={{ ...kutu, borderColor: "var(--c-red)" }}>
        <h2 className="text-sm font-semibold" style={{ color: "var(--c-red)" }}>
          Panoyu sıfırla
        </h2>
        <p className="mt-1 mb-3 text-[13px]" style={{ color: "var(--c-mute)" }}>
          <b>{tasks.length} görevin tamamını</b> ve tüm notları/değişiklik kayıtlarını siler.
          Fazlar ve kişiler kalır. Silmeden önce yedek otomatik indirilir.
          Toplantıdan sonra gerçek görevleri girmek için kullan.
        </p>
        <button
          type="button"
          onClick={() => setAcik(true)}
          className="rounded-lg border px-3 py-2 text-sm"
          style={{ borderColor: "var(--c-red)", color: "var(--c-red)" }}
        >
          Panoyu sıfırla…
        </button>
      </section>

      {durum && (
        <p
          className="mt-3 rounded-lg border p-3 text-sm"
          style={{ borderColor: "var(--c-line)", color: "var(--c-mute)" }}
        >
          {durum}
        </p>
      )}

      <dialog
        ref={dialogRef}
        onClose={() => setAcik(false)}
        className="m-auto w-[92vw] max-w-sm rounded-xl border p-0 backdrop:bg-black/60"
        style={{ background: "var(--c-bg2)", borderColor: "var(--c-line)", color: "var(--c-ink)" }}
      >
        <div className="px-5 py-4">
          <h2 className="text-base font-semibold">{tasks.length} görev silinecek</h2>
          <p className="mt-1.5 text-sm" style={{ color: "var(--c-mute)" }}>
            Bu geri alınamaz. Onaylamak için aşağıya <b>{ONAY_KELIMESI}</b> yaz.
          </p>
          <input
            value={onayMetni}
            onChange={(e) => setOnayMetni(e.target.value)}
            aria-label={`Onay için ${ONAY_KELIMESI} yaz`}
            className="mt-3 w-full rounded-lg border px-3 py-2 text-base"
            style={{ background: "var(--c-bg3)", borderColor: "var(--c-line)", color: "var(--c-ink)" }}
          />
        </div>
        <div
          className="flex justify-end gap-2 border-t px-5 py-3"
          style={{ borderColor: "var(--c-line)" }}
        >
          <button
            type="button"
            onClick={() => {
              setAcik(false);
              setOnayMetni("");
            }}
            className="rounded-lg border px-3 py-1.5 text-sm"
            style={{ borderColor: "var(--c-line)" }}
          >
            Vazgeç
          </button>
          <button
            type="button"
            disabled={onayMetni.trim() !== ONAY_KELIMESI || calisiyor}
            onClick={sifirla}
            className="rounded-lg px-3 py-1.5 text-sm font-semibold disabled:opacity-40"
            style={{ background: "var(--c-red)", color: "#fff" }}
          >
            {calisiyor ? "Siliniyor…" : "Yedekle ve sıfırla"}
          </button>
        </div>
      </dialog>
    </>
  );
}
