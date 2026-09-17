/** Görev durumları — 05_veritabani_sema.sql'deki `task_status` enum'u ile birebir aynı. */
export const STATUSES = ["Bekliyor", "Yapılıyor", "Yapıldı", "Yapılamadı"] as const;
export type Status = (typeof STATUSES)[number];

/** Giriş yapabilen üç kişi (allowed_users tablosu). */
export const MEMBERS = ["Kürşad", "Sarah", "Yunus"] as const;

/** Görev sorumlusu olabilen ama panoya giriş yapmayan isimler. */
export const GUESTS = ["Sibel", "Emine", "Ortak"] as const;

export const OWNERS = [...MEMBERS, ...GUESTS] as const;

/** Kişi renkleri — 03_ornek_pano.html'deki .o-* sınıflarından alındı. */
export const OWNER_COLOR: Record<string, string> = {
  "Kürşad": "#3ee0cc",
  "Sarah": "#c9a6ff",
  "Yunus": "#7cc4ff",
  "Sibel": "#ffb37c",
  "Emine": "#f7e18b",
  "Ortak": "#d9dee5",
};

export function ownerColor(owner: string): string {
  return OWNER_COLOR[owner] ?? "#d9dee5";
}

export type Note = {
  actor: string;
  /** ISO 8601 */
  at: string;
  body: string;
};

export type Task = {
  id: string;
  phase: string;
  week: string;
  owner: string;
  /** YYYY-MM-DD */
  due: string;
  title: string;
  /** ne yapılacak */
  what: string;
  /** neden önemli */
  why: string;
  /** bitti sayılır */
  done: string;
  status: Status;
  notes: Note[];
  /**
   * Görevi ekleyenin adı. Tohum görevlerde yok (undefined) — K6 gereği onları
   * yalnızca Kürşad silebilir. 05_veritabani_sema.sql'deki `created_by`'nin karşılığı.
   */
  createdBy?: string;
};

export type Phase = {
  id: string;
  /** ad */
  n: string;
  /** dönem etiketi, ör. "14 – 27 Eylül" */
  d: string;
  from: string;
  to: string;
  /** sonraki faza geçiş şartı */
  gate: string;
};
