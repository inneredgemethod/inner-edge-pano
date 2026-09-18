"use client";

import { useSearchParams } from "next/navigation";

const MESAJLAR: Record<string, { renk: string; metin: string }> = {
  izinsiz: {
    renk: "var(--c-amber)",
    metin:
      "Bu pano ekibe özel. Bu adres izin listesinde değil. Ekipte olman gerekiyorsa Kürşad'a söyle, seni eklesin.",
  },
  linksuresi: {
    renk: "var(--c-amber)",
    metin:
      "Bu linkin süresi dolmuş ya da daha önce kullanılmış. Her link bir kez çalışır ve 1 saat geçerlidir. Aşağıdan yenisini iste.",
  },
  linkgecersiz: {
    renk: "var(--c-amber)",
    metin:
      "Link çalışmadı. Süresi dolmuş, daha önce kullanılmış ya da linki istediğin tarayıcıdan farklı bir yerde açmış olabilirsin. Aşağıdan yenisini iste.",
  },
};

/** Giriş denemesinin sonucunu URL'den okuyup gösterir. */
export function UrlMesaji() {
  const durum = useSearchParams().get("durum");
  const m = durum ? MESAJLAR[durum] : undefined;
  if (!m) return null;

  return (
    <p
      className="mb-4 rounded-lg border p-3 text-sm"
      style={{ borderColor: m.renk, color: "var(--c-gate-ink)" }}
    >
      {m.metin}
    </p>
  );
}
