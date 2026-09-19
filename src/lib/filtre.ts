import { isDone, isLate, isStuck } from "./data";
import type { Task } from "./types";

/**
 * Görev listesinin durumu. Tamamı URL'de tutulur: filtrelenmiş bir görünümü
 * ekibe link olarak gönderebilmek için (B5). Bileşen state'inde tutulsaydı
 * link paylaşılamaz, geri tuşu da filtreleri hatırlamazdı.
 */
export type Gorunum = "liste" | "hafta" | "takvim" | "gecmis";

export type Filtre = {
  faz: string | null;
  /** Kişi adı, ya da panoya girmeyen sorumlular için "diger". */
  kisi: string | null;
  bitenleriGizle: boolean;
  sadeceAcik: boolean;
  /** Serbest arama: başlık, açıklamalar ve notlar. */
  q: string;
  gorunum: Gorunum;
  /** Hafta/takvim görünümünün demirlediği gün (YYYY-MM-DD). Boşsa bugün. */
  tarih: string;
};

export const BOS_FILTRE: Filtre = {
  faz: null,
  kisi: null,
  bitenleriGizle: false,
  sadeceAcik: false,
  q: "",
  gorunum: "liste",
  tarih: "",
};

const GORUNUMLER: Gorunum[] = ["liste", "hafta", "takvim", "gecmis"];

export function filtreyiOku(params: URLSearchParams): Filtre {
  const gorunum = params.get("gorunum") as Gorunum | null;
  return {
    faz: params.get("faz"),
    kisi: params.get("kisi"),
    bitenleriGizle: params.get("bitenler") === "gizli",
    sadeceAcik: params.get("takilan") === "1",
    q: params.get("q") ?? "",
    gorunum: gorunum && GORUNUMLER.includes(gorunum) ? gorunum : "liste",
    tarih: params.get("tarih") ?? "",
  };
}

/** Varsayılan değerler URL'ye yazılmaz — adres gereksiz uzamasın. */
export function filtreyiYaz(f: Filtre): string {
  const p = new URLSearchParams();
  if (f.faz) p.set("faz", f.faz);
  if (f.kisi) p.set("kisi", f.kisi);
  if (f.bitenleriGizle) p.set("bitenler", "gizli");
  if (f.sadeceAcik) p.set("takilan", "1");
  if (f.q.trim()) p.set("q", f.q.trim());
  if (f.gorunum !== "liste") p.set("gorunum", f.gorunum);
  if (f.tarih) p.set("tarih", f.tarih);
  const s = p.toString();
  return s ? `?${s}` : "";
}

/** Türkçe'ye duyarlı, büyük/küçük harf ve aksan gözetmeyen arama. */
function normalize(s: string): string {
  return s
    .toLocaleLowerCase("tr")
    .replaceAll("ı", "i")
    .replaceAll("İ", "i")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

export function aramaEslesir(t: Task, q: string): boolean {
  const aranan = normalize(q.trim());
  if (!aranan) return true;
  const havuz = normalize(
    [t.title, t.what, t.why, t.done, t.owner, ...t.notes.map((n) => n.body)].join(" "),
  );
  // Birden fazla kelime: hepsi geçmeli ("sarah video" -> ikisi de).
  return aranan.split(/\s+/).every((k) => havuz.includes(k));
}

export function filtreyiUygula(
  tasks: Task[],
  f: Filtre,
  { today, girenIsimler }: { today: string; girenIsimler: string[] },
): Task[] {
  return tasks.filter((t) => {
    if (f.faz && t.phase !== f.faz) return false;
    if (f.kisi === "diger") {
      if (girenIsimler.includes(t.owner)) return false;
    } else if (f.kisi && t.owner !== f.kisi) return false;
    if (f.bitenleriGizle && isDone(t)) return false;
    if (f.sadeceAcik && !isStuck(t) && !isLate(t, today)) return false;
    if (!aramaEslesir(t, f.q)) return false;
    return true;
  });
}
