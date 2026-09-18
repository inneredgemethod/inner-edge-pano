"use client";

import { useState } from "react";
import { TaskDetail } from "@/components/TaskDetail";
import { TaskList } from "@/components/TaskList";
import { isDone, isLate, isStuck } from "@/lib/data";
import { useStore } from "@/lib/store";

export default function Benim() {
  const { tasks, me, today } = useStore();
  const [showDone, setShowDone] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);

  const mine = tasks.filter((t) => t.owner === me);
  const visible = showDone ? mine : mine.filter((t) => !isDone(t));
  const late = mine.filter((t) => isLate(t, today)).length;
  const stuck = mine.filter(isStuck).length;

  return (
    <>
      <h1 className="mb-1 text-base font-semibold">{me} — benim görevlerim</h1>
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
  );
}
