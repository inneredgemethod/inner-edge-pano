"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { currentPhase } from "@/lib/data";
import { useStore } from "@/lib/store";
import { OWNERS } from "@/lib/types";

export default function Ekle() {
  const { addTask, phases, me, today } = useStore();
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [owner, setOwner] = useState<string>(me);
  const [phase, setPhase] = useState(currentPhase(phases, today)?.id ?? phases[0]?.id ?? "A");
  const [due, setDue] = useState("");
  const [week, setWeek] = useState("");

  const field = {
    background: "var(--c-bg2)",
    borderColor: "var(--c-line)",
    color: "var(--c-ink)",
  };

  return (
    <>
      <h1 className="mb-1 text-base font-semibold">Yeni görev</h1>
      <p className="mb-3 text-[13px]" style={{ color: "var(--c-mute)" }}>
        Kısa ve net yaz. Açıklamaları (ne yapılacak / neden önemli / bitti sayılır) sonradan
        görev detayından doldurabilirsin.
      </p>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!title.trim()) return;
          addTask({
            title: title.trim(),
            owner,
            phase,
            due,
            week: week.trim() || "Tarihsiz",
          });
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
              {OWNERS.map((o) => (
                <option key={o} value={o}>
                  {o}
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
              {phases.map((p) => (
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

          <label className="grid gap-1 text-xs" style={{ color: "var(--c-mute)" }}>
            Hafta etiketi (isteğe bağlı)
            <input
              value={week}
              onChange={(e) => setWeek(e.target.value)}
              placeholder="ör. Bu hafta (14-20 Eyl)"
              className="rounded-lg border px-3 py-2 text-sm"
              style={field}
            />
          </label>
        </div>

        <button
          type="submit"
          className="justify-self-start rounded-lg px-4 py-2 text-sm font-semibold"
          style={{ background: "var(--c-teal)", color: "var(--c-teal-ink)" }}
        >
          Ekle
        </button>
      </form>
    </>
  );
}
