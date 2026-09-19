"use client";

import { useState } from "react";
import { Notlarim } from "@/components/Notlarim";
import { TaskDetail } from "@/components/TaskDetail";
import { TaskList } from "@/components/TaskList";
import { isDone, isLate, isStuck } from "@/lib/data";
import { useStore } from "@/lib/store";

const SEKMELER = [
  ["gorevler", "Görevlerim"],
  ["notlar", "Notlarım"],
] as const;

export default function Benim() {
  const { tasks, kisiselNotlar, me, today } = useStore();
  const [sekme, setSekme] = useState<"gorevler" | "notlar">("gorevler");
  const [showDone, setShowDone] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);

  const mine = tasks.filter((t) => t.owner === me);
  const visible = showDone ? mine : mine.filter((t) => !isDone(t));
  const late = mine.filter((t) => isLate(t, today)).length;
  const stuck = mine.filter(isStuck).length;
  const notSayisi = kisiselNotlar.filter((n) => n.kisi === me).length;

  return (
    <>
      <h1 className="mb-2 text-base font-semibold">{me}</h1>

      <div className="mb-3 flex gap-2">
        {SEKMELER.map(([deger, etiket]) => {
          const on = sekme === deger;
          return (
            <button
              key={deger}
              type="button"
              onClick={() => setSekme(deger)}
              aria-pressed={on}
              // Etiket not sayısıyla değişiyor ("Notlarım (3)"); erişilebilir
              // ad sabit kalsın ki hem okuyucu hem testler şaşmasın.
              aria-label={etiket}
              className="min-h-[2.5rem] rounded-lg border px-3 py-1.5 text-sm"
              style={{
                borderColor: on ? "var(--c-teal)" : "var(--c-line)",
                color: on ? "var(--c-teal)" : "var(--c-mute)",
                background: on ? "var(--c-bg2)" : "transparent",
              }}
            >
              {etiket}
              {deger === "notlar" && notSayisi > 0 && ` (${notSayisi})`}
            </button>
          );
        })}
      </div>

      {sekme === "gorevler" ? (
        <>
          <p className="mb-3 text-[13px]" style={{ color: "var(--c-mute)" }}>
            {mine.filter((t) => !isDone(t)).length} açık
            {late > 0 && <span style={{ color: "var(--c-red)" }}> · {late} geciken</span>}
            {stuck > 0 && <span style={{ color: "var(--c-red)" }}> · {stuck} takılan</span>}
          </p>

          <label className="flex items-center gap-1.5 text-[13px]" style={{ color: "var(--c-mute)" }}>
            <input type="checkbox" checked={showDone} onChange={(e) => setShowDone(e.target.checked)} />
            Bitenleri de göster
          </label>

          <TaskList
            tasks={visible}
            onOpen={(t) => setOpenId(t.id)}
            empty={`${me} için açık görev yok. Üstteki "Ben" menüsünden kişi değiştirebilirsin.`}
          />
          <TaskDetail taskId={openId} onClose={() => setOpenId(null)} />
        </>
      ) : (
        <Notlarim />
      )}
    </>
  );
}
