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

export type SorumluSecenegi = { deger: string; etiket: string; arsivde: boolean };

/**
 * Sorumlu menüsünün seçenekleri.
 *
 * `mevcutSahip` kadroda yoksa (kişi arşivlenmiş ya da kadrodan çıkarılmış)
 * yine de listeye eklenir. Yoksa `<select>` karşılığı olmayan bir değere bakar,
 * tarayıcı sessizce ilk seçeneği gösterir ve kullanıcı başka bir alanı
 * düzenlerken görevin sorumlusunu farkında olmadan değiştirir.
 */
export function sorumluSecenekleri(kadro: Kisi[], mevcutSahip?: string): SorumluSecenegi[] {
  const aktif = sorumluOlabilir(kadro).map((k) => ({
    deger: k.display_name,
    etiket: k.display_name,
    arsivde: false,
  }));
  if (!mevcutSahip || aktif.some((s) => s.deger === mevcutSahip)) return aktif;
  return [{ deger: mevcutSahip, etiket: `${mevcutSahip} (arşivde)`, arsivde: true }, ...aktif];
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

export const TEKRARLAR = [
  ["haftalik", "Her hafta"],
  ["iki_haftada", "İki haftada bir"],
  ["aylik", "Her ay"],
] as const;
export type Tekrar = (typeof TEKRARLAR)[number][0];

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
  /** Doluysa "Yapıldı" işaretlenince bir sonraki kopya üretilir (0009). */
  tekrar?: Tekrar;
  /** ISO 8601 — "Yapıldı"ya geçtiği an; Geçmiş görünümü buna göre gruplar (0011). */
  bitisAni?: string;
};

/**
 * Kişisel not (0010).
 *
 * ⚠ `kisi` bir FİLTRE, erişim sınırı DEĞİL: tek paylaşılan hesap modelinde
 * şifreyi bilen herkes tüm notları okuyabilir. Arayüz bunu yazıyor.
 */
export type KisiselNot = {
  id: string;
  kisi: string;
  icerik: string;
  created_at: string;
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
