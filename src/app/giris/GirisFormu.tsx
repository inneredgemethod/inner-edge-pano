"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function GirisFormu({ kadro, seciliKisi }: { kadro: string[]; seciliKisi: string }) {
  const router = useRouter();
  const [sifre, setSifre] = useState("");
  const [kisi, setKisi] = useState(seciliKisi);
  const [gonderiliyor, setGonderiliyor] = useState(false);
  const [hata, setHata] = useState<string | null>(null);

  async function gonder(e: React.FormEvent) {
    e.preventDefault();
    if (gonderiliyor) return;
    setGonderiliyor(true);
    setHata(null);

    let cevap: { ok?: boolean; mesaj?: string } = {};
    try {
      const r = await fetch("/api/giris", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sifre, kisi }),
      });
      cevap = await r.json();
    } catch {
      cevap = { ok: false, mesaj: "Sunucuya ulaşılamadı. İnternetini kontrol et." };
    }

    if (!cevap.ok) {
      setHata(cevap.mesaj ?? "Giriş yapılamadı.");
      setGonderiliyor(false);
      return;
    }

    router.replace("/");
    router.refresh();
  }

  const kutu = {
    background: "var(--c-bg2)",
    borderColor: "var(--c-line)",
    color: "var(--c-ink)",
  };

  return (
    <form onSubmit={gonder} className="grid gap-3">
      <label className="grid gap-1 text-xs" style={{ color: "var(--c-mute)" }}>
        Ekip şifresi
        <input
          type="password"
          required
          autoComplete="current-password"
          value={sifre}
          onChange={(e) => {
            setSifre(e.target.value);
            if (hata) setHata(null);
          }}
          className="rounded-lg border px-3 py-2 text-base"
          style={kutu}
        />
      </label>

      <label className="grid gap-1 text-xs" style={{ color: "var(--c-mute)" }}>
        Ben kimim
        <select
          value={kisi}
          onChange={(e) => setKisi(e.target.value)}
          className="rounded-lg border px-3 py-2 text-base"
          style={kutu}
        >
          {kadro.map((k) => (
            <option key={k} value={k}>
              {k}
            </option>
          ))}
        </select>
      </label>

      <button
        type="submit"
        disabled={gonderiliyor}
        className="rounded-lg px-4 py-2.5 text-sm font-semibold disabled:opacity-50"
        style={{ background: "var(--c-teal)", color: "var(--c-teal-ink)" }}
      >
        {gonderiliyor ? "Giriliyor…" : "Panoya gir"}
      </button>

      {hata && (
        <p
          className="rounded-lg border p-3 text-sm"
          style={{ borderColor: "var(--c-red)", color: "var(--c-red)" }}
        >
          {hata}
        </p>
      )}
    </form>
  );
}
