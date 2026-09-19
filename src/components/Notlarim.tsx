"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { OnayDialog } from "./OnayDialog";

function tarihYaz(iso: string): string {
  return new Date(iso).toLocaleString("tr-TR", {
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Istanbul",
  });
}

/**
 * Kişisel not defteri (0010).
 *
 * "Kendi notların" arayüzsel bir filtredir, gizlilik garantisi DEĞİL — panoya
 * tek paylaşılan şifreyle girildiği için şifreyi bilen herkes hepsini
 * okuyabilir. Bu, kullanıcıya ekranda da yazılıyor; not yazarken bilmesi
 * gereken bir şey.
 */
export function Notlarim() {
  const { kisiselNotlar, me, notEkle, notKaldir } = useStore();
  const [taslak, setTaslak] = useState("");
  const [kaydediliyor, setKaydediliyor] = useState(false);
  const [silinecek, setSilinecek] = useState<string | null>(null);

  const benimkiler = kisiselNotlar.filter((n) => n.kisi === me);
  const alan = { background: "var(--c-bg3)", borderColor: "var(--c-line)", color: "var(--c-ink)" };

  return (
    <>
      <p className="mb-3 text-[13px]" style={{ color: "var(--c-mute)" }}>
        Kendi planların, hatırlatmaların, toplantı öncesi maddelerin.{" "}
        <b style={{ color: "var(--c-amber)" }}>Gizli değildir:</b> panoya tek ekip şifresiyle
        giriliyor, yani şifreyi bilen herkes buradakileri görebilir.
      </p>

      <form
        onSubmit={async (e) => {
          e.preventDefault();
          if (!taslak.trim() || kaydediliyor) return;
          setKaydediliyor(true);
          const hata = await notEkle(taslak);
          setKaydediliyor(false);
          if (!hata) setTaslak("");
        }}
        className="mb-4 grid gap-2"
      >
        <textarea
          value={taslak}
          onChange={(e) => setTaslak(e.target.value)}
          rows={4}
          placeholder="Bugün ne yapacaksın, neyi unutmamalısın?"
          aria-label="Yeni not"
          className="w-full rounded-lg border px-3 py-2 text-sm"
          style={alan}
        />
        <button
          type="submit"
          disabled={!taslak.trim() || kaydediliyor}
          className="min-h-[2.5rem] justify-self-start rounded-lg px-4 py-2 text-sm font-semibold disabled:opacity-50"
          style={{ background: "var(--c-teal)", color: "var(--c-teal-ink)" }}
        >
          {kaydediliyor ? "Ekleniyor…" : "Not ekle"}
        </button>
      </form>

      {benimkiler.length === 0 ? (
        <p className="text-[13px]" style={{ color: "var(--c-mute)" }}>
          {me} için henüz not yok.
        </p>
      ) : (
        <ul>
          {benimkiler.map((n) => (
            <li
              key={n.id}
              className="mb-1.5 flex items-start gap-2 rounded-lg border px-3 py-2.5"
              style={{ background: "var(--c-bg2)", borderColor: "var(--c-line)" }}
            >
              <div className="min-w-0 flex-1">
                <div className="text-sm whitespace-pre-wrap">{n.icerik}</div>
                <div className="mt-1 text-xs" style={{ color: "var(--c-mute)" }}>
                  {tarihYaz(n.created_at)}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSilinecek(n.id)}
                aria-label="Notu sil"
                title="Sil"
                className="grid size-10 shrink-0 place-items-center rounded-lg border text-sm leading-none"
                style={{ borderColor: "var(--c-line)", color: "var(--c-red)" }}
              >
                🗑
              </button>
            </li>
          ))}
        </ul>
      )}

      {silinecek && (
        <OnayDialog
          acik
          baslik="Not silinecek"
          aciklama="Bu not kalıcı olarak silinir. Geri alınamaz."
          onayEtiketi="Notu sil"
          onOnay={() => {
            notKaldir(silinecek);
            setSilinecek(null);
          }}
          onVazgec={() => setSilinecek(null)}
        />
      )}
    </>
  );
}
