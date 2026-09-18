/** Görev durumları — veritabanındaki `task_status` enum'u ile birebir aynı. */
export const STATUSES = ["Bekliyor", "Yapılıyor", "Yapıldı", "Yapılamadı"] as const;
export type Status = (typeof STATUSES)[number];

/**
 * Ekip kadrosu. Kaynak `kisiler` tablosu — burada sabit liste YOK.
 *
 * Eskiden isimler ve renkler bu dosyada sabitti; dört ayrı bileşen onu
 * kopyalıyordu. Görünmeyen sonucu: toplantı notu ayrıştırıcısı kadroyu
 * veritabanından okuduğu ve tabloda yalnızca 3 kişi bulunduğu için "@Sibel"
 * hiçbir zaman eşleşmiyordu.
 */
export type Kisi = {
  display_name: string;
  color: string;
  /** true ise göreve sorumlu atanabilir ama panoya girmez ("Ben" menüsünde çıkmaz). */
  sadece_sorumlu: boolean;
  sort: number;
  arsiv: boolean;
};

/** Göreve sorumlu atanabilecek kişiler. */
export function sorumluOlabilir(kadro: Kisi[]): Kisi[] {
  return kadro.filter((k) => !k.arsiv);
}

/** Panoya giren, yani "Ben" olarak seçilebilecek kişiler. */
export function panoyaGirenler(kadro: Kisi[]): Kisi[] {
  return kadro.filter((k) => !k.arsiv && !k.sadece_sorumlu);
}

/** Kadroda bulunamayan ad için nötr gri — silinmiş bir kişinin eski görevi olabilir. */
export const NOTR_RENK = "#d9dee5";

export function kisiRengi(kadro: Kisi[], ad: string): string {
  return kadro.find((k) => k.display_name === ad)?.color ?? NOTR_RENK;
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
  /** Görevi ekleyenin beyan ettiği adı. Tohum görevlerde yok. */
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
  arsiv: boolean;
};

/** Arşivlenmemiş fazlar — filtreler, menüler ve ayrıştırıcı bunları kullanır. */
export function aktifFazlar(phases: Phase[]): Phase[] {
  return phases.filter((p) => !p.arsiv);
}
