"use client";

import { useState } from "react";
import { Sablon } from "./Sablon";
import { TekGorev } from "./TekGorev";
import { ToplantiNotu } from "./ToplantiNotu";

export default function Ekle() {
  const [mod, setMod] = useState<"tek" | "toplanti" | "sablon">("tek");

  return (
    <>
      <div className="mb-4 flex gap-2">
        {(
          [
            ["tek", "Tek görev"],
            ["toplanti", "Toplantı notu"],
            ["sablon", "Şablon"],
          ] as const
        ).map(([deger, etiket]) => {
          const on = mod === deger;
          return (
            <button
              key={deger}
              type="button"
              onClick={() => setMod(deger)}
              aria-pressed={on}
              className="rounded-lg border px-3 py-1.5 text-sm"
              style={{
                borderColor: on ? "var(--c-teal)" : "var(--c-line)",
                color: on ? "var(--c-teal)" : "var(--c-mute)",
                background: on ? "var(--c-bg2)" : "transparent",
              }}
            >
              {etiket}
            </button>
          );
        })}
      </div>

      {mod === "tek" && <TekGorev />}
      {mod === "toplanti" && <ToplantiNotu />}
      {mod === "sablon" && <Sablon />}
    </>
  );
}
