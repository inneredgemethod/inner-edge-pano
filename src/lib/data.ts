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
const AY_UZUN = [
  "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
  "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık",
];

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

// ---------------------------------------------------------------------------
// Tarih yardımcıları
// ---------------------------------------------------------------------------
// Hepsi "YYYY-MM-DD" metniyle çalışır ve UTC'de hesaplar. Date nesnesini yerel
// saat diliminde kullanmak, sunucu (UTC) ile tarayıcı (UTC+3) arasında bir gün
// kayması yaratır; bugünün kendisi zaten sunucudan prop olarak iniyor.

/** Gün ekler/çıkarır. gunEkle("2026-09-18", 7) -> "2026-09-25" */
export function gunEkle(iso: string, gun: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + gun);
  return d.toISOString().slice(0, 10);
}

/** İçinde bulunduğu haftanın Pazartesi'si. Hafta Pazartesi başlar (karar). */
export function haftaBasi(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`);
  // getUTCDay: Pazar 0, Pazartesi 1 ... Pazartesi'ye kaç gün geri gidilecek?
  const gun = (d.getUTCDay() + 6) % 7;
  return gunEkle(iso, -gun);
}

const GUN_ADLARI = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];
export const HAFTA_BASLIKLARI = GUN_ADLARI;

const AY_ADLARI = [
  "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
  "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık",
];

/** "2026-09-18" -> "Eylül 2026" */
export function ayAdi(iso: string): string {
  const [y, m] = iso.split("-").map(Number);
  return `${AY_ADLARI[m - 1]} ${y}`;
}

/** Ayın ilk günü. "2026-09-18" -> "2026-09-01" */
export function ayBasi(iso: string): string {
  return `${iso.slice(0, 7)}-01`;
}

/** Ay ekler. ayEkle("2026-09-18", 1) -> "2026-10-01" */
export function ayEkle(iso: string, ay: number): string {
  const [y, m] = iso.split("-").map(Number);
  const toplam = (y * 12 + (m - 1)) + ay;
  const yy = Math.floor(toplam / 12);
  const mm = (toplam % 12) + 1;
  return `${yy}-${String(mm).padStart(2, "0")}-01`;
}

/**
 * Takvim ızgarası: ayı kapsayan, Pazartesi'den başlayan 6 haftalık gün dizisi.
 * Sabit 42 gün — ay değişince ızgara yüksekliği zıplamasın.
 */
export function takvimIzgarasi(iso: string): string[] {
  const bas = haftaBasi(ayBasi(iso));
  return Array.from({ length: 42 }, (_, i) => gunEkle(bas, i));
}

/** "2026-09-18" -> "Per" */
export function gunAdi(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`);
  return GUN_ADLARI[(d.getUTCDay() + 6) % 7];
}

/** Bir haftanın 7 günü, Pazartesi'den başlayarak. */
export function haftaninGunleri(herhangiBirGun: string): string[] {
  const bas = haftaBasi(herhangiBirGun);
  return Array.from({ length: 7 }, (_, i) => gunEkle(bas, i));
}

// ---------------------------------------------------------------------------
// Gruplama
// ---------------------------------------------------------------------------

export const GRUPLAR = ["Gecikmiş", "Bu hafta", "Gelecek hafta", "Sonrası", "Tarihsiz"] as const;
export type Grup = (typeof GRUPLAR)[number];

/**
 * Görevin hangi zaman grubuna düştüğü. Yapılmış görevler "Gecikmiş" sayılmaz.
 *
 * Eskiden gruplar `week_label` adlı serbest metin sütunundan geliyordu; elle
 * yazıldığı için yeni görevlerde boş kalıyor ve tarih değişince güncellenmiyordu.
 * Artık tek kaynak hedef tarih.
 */
export function gorevGrubu(t: Task, today: string): Grup {
  if (!t.due) return "Tarihsiz";
  if (t.due < today && !isDone(t)) return "Gecikmiş";

  const buHaftaBasi = haftaBasi(today);
  const gelecekHaftaBasi = gunEkle(buHaftaBasi, 7);
  const sonrakiBasi = gunEkle(buHaftaBasi, 14);

  if (t.due < gelecekHaftaBasi) return "Bu hafta";
  if (t.due < sonrakiBasi) return "Gelecek hafta";
  return "Sonrası";
}

/** Görevleri zaman gruplarına ayırır. Boş gruplar dönmez, sıra GRUPLAR'daki gibi. */
export function gorevGruplari(tasks: Task[], today: string): { grup: Grup; tasks: Task[] }[] {
  const kova = new Map<Grup, Task[]>();
  for (const t of tasks) {
    const g = gorevGrubu(t, today);
    if (!kova.has(g)) kova.set(g, []);
    kova.get(g)!.push(t);
  }
  return GRUPLAR.filter((g) => kova.has(g)).map((grup) => ({ grup, tasks: kova.get(grup)! }));
}

/**
 * "Geçmiş" görünümü: tamamlanmış görevler bitiş gününe göre, en yeni gün
 * üstte. `bitisAni` yoksa (0011 öncesi bitmiş, geri doldurulamamış görev)
 * hedef tarihe düşüyor; o da yoksa "Tarihi bilinmiyor" kovasına.
 */
export function tamamlananGruplari(
  tasks: Task[],
): { gun: string; etiket: string; tasks: Task[] }[] {
  const kova = new Map<string, Task[]>();
  for (const t of tasks) {
    if (!isDone(t)) continue;
    const gun = t.bitisAni ? t.bitisAni.slice(0, 10) : t.due || "";
    if (!kova.has(gun)) kova.set(gun, []);
    kova.get(gun)!.push(t);
  }
  return [...kova.entries()]
    // Boş anahtar ("tarihi bilinmiyor") her zaman en sonda.
    .sort(([a], [b]) => (a === "" ? 1 : b === "" ? -1 : b.localeCompare(a)))
    .map(([gun, tasks]) => ({ gun, etiket: gun ? gunBasligi(gun) : "Tarihi bilinmiyor", tasks }));
}

/** "2026-09-18" -> "18 Eylül 2026" */
export function gunBasligi(iso: string): string {
  const [y, a, g] = iso.split("-").map(Number);
  return `${g} ${AY_UZUN[a - 1]} ${y}`;
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
