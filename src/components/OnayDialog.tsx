"use client";

import { useEffect, useRef } from "react";

/**
 * Yıkıcı eylem onayı. Kodda üç kez elle kopyalanmış `<dialog>` deseni burada
 * tek yerde.
 *
 * Renk kuralı: TETİKLEYİCİ kırmızı çerçeveli, buradaki son düğme DOLU kırmızı.
 * İkisini de doldurmak "geri dönüşü yok" sinyalini siler.
 */
export function OnayDialog({
  acik,
  baslik,
  aciklama,
  onayEtiketi,
  calisiyor = false,
  onOnay,
  onVazgec,
}: {
  acik: boolean;
  baslik: string;
  aciklama: string;
  onayEtiketi: string;
  calisiyor?: boolean;
  onOnay: () => void;
  onVazgec: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = dialogRef.current;
    if (!d) return;
    if (acik && !d.open) d.showModal();
    if (!acik && d.open) d.close();
  }, [acik]);

  return (
    <dialog
      ref={dialogRef}
      onClose={onVazgec}
      onClick={(e) => {
        if (e.target === dialogRef.current) onVazgec();
      }}
      className="m-auto w-[92vw] max-w-sm rounded-xl border p-0 backdrop:bg-black/60"
      style={{ background: "var(--c-bg2)", borderColor: "var(--c-line)", color: "var(--c-ink)" }}
    >
      <div className="px-5 py-4">
        <h2 className="text-base font-semibold">{baslik}</h2>
        <p className="mt-1.5 text-sm" style={{ color: "var(--c-mute)" }}>
          {aciklama}
        </p>
      </div>
      <div className="flex justify-end gap-2 border-t px-5 py-3" style={{ borderColor: "var(--c-line)" }}>
        <button
          type="button"
          onClick={onVazgec}
          className="min-h-[2.5rem] rounded-lg border px-4 py-1.5 text-sm"
          style={{ borderColor: "var(--c-line)" }}
        >
          Vazgeç
        </button>
        <button
          type="button"
          disabled={calisiyor}
          onClick={onOnay}
          className="min-h-[2.5rem] rounded-lg px-4 py-1.5 text-sm font-semibold disabled:opacity-50"
          style={{ background: "var(--c-red)", color: "#fff" }}
        >
          {calisiyor ? "Siliniyor…" : onayEtiketi}
        </button>
      </div>
    </dialog>
  );
}
