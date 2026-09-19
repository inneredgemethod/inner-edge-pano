"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { currentPhase } from "@/lib/data";
import { useStore } from "@/lib/store";
import { aktifFazlar, sorumluOlabilir } from "@/lib/types";

export function TekGorev() {
  const { addTask, phases, kadro, me, today } = useStore();
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [owner, setOwner] = useState<string>(me);
  // aktifFazlar ZORUNLU: <select> yalnizca aktifleri listeliyor. Icinde
  // bulundugumuz faz arsivliyse tarayici ilk secenegi gosterir ama state
  // arsivli id'yi tutar ve gorev sessizce arsivli faza yazilir.
  const aktif = aktifFazlar(phases);
  const [phase, setPhase] = useState(currentPhase(aktif, today)?.id ?? aktif[0]?.id ?? "A");
  const [due, setDue] = useState("");
  const [what, setWhat] = useState("");
  const [why, setWhy] = useState("");
  const [done, setDone] = useState("");
  const [kaydediliyor, setKaydediliyor] = useState(false);

  const field = {
    background: "var(--c-bg2)",
    borderColor: "var(--c-line)",
    color: "var(--c-ink)",
  };

  return (
    <>
      <h1 className="mb-1 text-base font-semibold">Yeni görev</h1>
      <p className="mb-3 text-[13px]" style={{ color: "var(--c-mute)" }}>
        Kısa ve net yaz. Alttaki üç açıklamayı şimdi doldurabilir ya da boş bırakıp
        sonradan görev detayından ekleyebilirsin.
      </p>

      <form
        onSubmit={async (e) => {
          e.preventDefault();
          if (!title.trim() || kaydediliyor) return;
          setKaydediliyor(true);
          await addTask({
            title: title.trim(),
            owner,
            phase,
            due,
            what: what.trim(),
            why: why.trim(),
            done: done.trim(),
          });
          setKaydediliyor(false);
          router.push("/gorevler");
        }}
        className="grid gap-3 rounded-lg border p-4"
        style={{ background: "var(--c-bg2)", borderColor: "var(--c-line)" }}
      >
        <label className="grid gap-1 text-xs" style={{ color: "var(--c-mute)" }}>
          Başlık
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            placeholder="ör. Sarah'a kurumsal paket taslağını gönder"
            className="rounded-lg border px-3 py-2 text-sm"
            style={field}
          />
        </label>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="grid gap-1 text-xs" style={{ color: "var(--c-mute)" }}>
            Sorumlu
            <select
              value={owner}
              onChange={(e) => setOwner(e.target.value)}
              className="rounded-lg border px-3 py-2 text-sm"
              style={field}
            >
              {sorumluOlabilir(kadro).map((k) => (
                <option key={k.display_name} value={k.display_name}>
                  {k.display_name}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-1 text-xs" style={{ color: "var(--c-mute)" }}>
            Faz
            <select
              value={phase}
              onChange={(e) => setPhase(e.target.value)}
              className="rounded-lg border px-3 py-2 text-sm"
              style={field}
            >
              {aktifFazlar(phases).map((p) => (
                <option key={p.id} value={p.id}>
                  {p.n}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-1 text-xs" style={{ color: "var(--c-mute)" }}>
            Hedef tarih
            <input
              type="date"
              value={due}
              onChange={(e) => setDue(e.target.value)}
              className="rounded-lg border px-3 py-2 text-sm"
              style={field}
            />
          </label>

        </div>

        {(
          [
            ["Ne yapılacak", what, setWhat, "Somut adımlar. Karşı taraf ne yapacağını okuyunca anlasın."],
            ["Neden önemli", why, setWhy, "Bu iş neden listede? Atlanırsa ne olur?"],
            ["Bitti sayılır", done, setDone, "Hangi şart sağlanınca 'Yapıldı' işaretlenecek?"],
          ] as const
        ).map(([etiket, deger, ayarla, ipucu]) => (
          <label key={etiket} className="grid gap-1 text-xs" style={{ color: "var(--c-mute)" }}>
            {etiket} <span className="opacity-70">(isteğe bağlı)</span>
            <textarea
              value={deger}
              onChange={(e) => ayarla(e.target.value)}
              placeholder={ipucu}
              rows={2}
              className="rounded-lg border px-3 py-2 text-sm"
              style={field}
            />
          </label>
        ))}

        <button
          type="submit"
          disabled={kaydediliyor}
          className="justify-self-start rounded-lg px-4 py-2 text-sm font-semibold disabled:opacity-50"
          style={{ background: "var(--c-teal)", color: "var(--c-teal-ink)" }}
        >
          {kaydediliyor ? "Ekleniyor…" : "Ekle"}
        </button>
      </form>
    </>
  );
}
