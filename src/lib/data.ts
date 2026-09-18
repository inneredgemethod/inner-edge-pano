import type { Phase, Task } from "./types";

/**
 * Ekibin ortak takvimi Türkiye/Yunanistan saati. Sunucu UTC'de çalıştığı için
 * bugünü sabit bir saat diliminde hesaplıyoruz, yoksa gece yarısı civarında
 * sunucu ve tarayıcı farklı gün bulup hydration uyuşmazlığı çıkarıyor.
 */
export function todayInIstanbul(): string {
  return new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Istanbul" }).format(new Date());
}

const AYLAR = ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"];

/** "2026-09-17" -> "17 Eyl" */
export function formatDue(iso: string): string {
  if (!iso) return "";
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  return `${d} ${AYLAR[m - 1]}`;
}

export function isDone(t: Task): boolean {
  return t.status === "Yapıldı";
}

/** Takılan = "Yapılamadı" işaretlenmiş. */
export function isStuck(t: Task): boolean {
  return t.status === "Yapılamadı";
}

/** Geciken = hedef tarihi geçmiş ve hâlâ bitmemiş. */
export function isLate(t: Task, today: string): boolean {
  return !!t.due && t.due < today && !isDone(t);
}

/** Bugün hangi fazdayız — tarih aralığına giren ilk faz, yoksa ilki. */
export function currentPhase(phases: Phase[], today: string): Phase | undefined {
  return phases.find((p) => p.from <= today && today <= p.to) ?? phases[0];
}

export function phaseOf(phases: Phase[], id: string): Phase | undefined {
  return phases.find((p) => p.id === id);
}

export type PhaseStat = { done: number; total: number; ratio: number };

export function phaseStat(tasks: Task[], phaseId: string): PhaseStat {
  const inPhase = tasks.filter((t) => t.phase === phaseId);
  const done = inPhase.filter(isDone).length;
  return { done, total: inPhase.length, ratio: inPhase.length ? done / inPhase.length : 0 };
}

/**
 * Hafta etiketlerine göre gruplar. Sıralama alfabetik değil, tohum dosyasındaki
 * görülme sırası — "Bu hafta" ile "Gelecek hafta" doğru sırada kalsın diye.
 */
export function groupByWeek(tasks: Task[]): { week: string; tasks: Task[] }[] {
  const order: string[] = [];
  const map = new Map<string, Task[]>();
  for (const t of tasks) {
    const w = t.week || "Tarihsiz";
    if (!map.has(w)) {
      map.set(w, []);
      order.push(w);
    }
    map.get(w)!.push(t);
  }
  return order.map((week) => ({ week, tasks: map.get(week)! }));
}

export type Overview = { done: number; total: number; mine: number; late: number; stuck: number };

export function overview(tasks: Task[], me: string, today: string): Overview {
  return {
    done: tasks.filter(isDone).length,
    total: tasks.length,
    mine: tasks.filter((t) => t.owner === me && !isDone(t)).length,
    late: tasks.filter((t) => isLate(t, today)).length,
    stuck: tasks.filter(isStuck).length,
  };
}
