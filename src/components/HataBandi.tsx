"use client";

import { useStore } from "@/lib/store";

/**
 * Yazma hatasını gösterir. Sessizce yutmak en kötüsü: kullanıcı kaydedildi
 * sanır, ertesi gün değişikliği bulamaz.
 */
export function HataBandi() {
  const { hata, hatayiKapat } = useStore();
  if (!hata) return null;

  return (
    <div
      role="alert"
      className="fixed inset-x-3 bottom-20 z-40 flex items-center gap-3 rounded-lg border px-3.5 py-2.5 text-sm md:inset-x-auto md:right-4 md:bottom-4 md:max-w-sm"
      style={{ background: "var(--c-bg2)", borderColor: "var(--c-red)", color: "var(--c-red)" }}
    >
      <span className="flex-1">{hata}</span>
      <button
        type="button"
        onClick={hatayiKapat}
        className="rounded-lg border px-2 py-1 text-xs"
        style={{ borderColor: "var(--c-line)", color: "var(--c-mute)" }}
      >
        Kapat
      </button>
    </div>
  );
}
