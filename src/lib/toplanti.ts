import type { Phase } from "./types";

/**
 * Toplantı notunu görevlere çevirir (A4).
 *
 * Her satır bir görev. İşaretler satırın herhangi bir yerinde olabilir:
 *   @Sarah   sorumlu
 *   #C / #2  faz (id veya faz adının başındaki numara)
 *   !25.09   hedef tarih (gg.aa, gg.aa.yyyy veya yyyy-aa-gg)
 *
 * Tanınmayan işaret sessizce yutulmaz — `uyarilar` ile geri döner ki
 * kullanıcı önizlemede görsün. "@Sarh" yazıp sorumlusuz görev eklemek
 * en can sıkıcı hata olurdu.
 */
export type AyrisanGorev = {
  satir: number;
  title: string;
  owner: string | null;
  phase: string | null;
  due: string | null;
  uyarilar: string[];
};

const GG_AA = /^(\d{1,2})[.\/-](\d{1,2})(?:[.\/-](\d{2,4}))?$/;
const ISO = /^(\d{4})-(\d{2})-(\d{2})$/;

function tarihCoz(ham: string, bugun: string): string | null {
  const iso = ISO.exec(ham);
  if (iso) return ham;

  const m = GG_AA.exec(ham);
  if (!m) return null;

  const gun = Number(m[1]);
  const ay = Number(m[2]);
  if (gun < 1 || gun > 31 || ay < 1 || ay > 12) return null;

  let yil: number;
  if (m[3]) {
    yil = Number(m[3]);
    if (yil < 100) yil += 2000;
  } else {
    // Yıl yazılmamışsa bu yıl. Ama çıkan tarih 6 aydan fazla geride kalıyorsa
    // kastedilen gelecek yıldır: pano Eylül'de başlayıp Ocak'a uzanıyor,
    // "!15.01" yazan kişi geçen Ocak'ı kastetmiyor.
    yil = Number(bugun.slice(0, 4));
    const aday = `${yil}-${String(ay).padStart(2, "0")}-${String(gun).padStart(2, "0")}`;
    const altiAyOnce = new Date(bugun);
    altiAyOnce.setMonth(altiAyOnce.getMonth() - 6);
    if (aday < altiAyOnce.toISOString().slice(0, 10)) yil += 1;
  }

  const sonuc = `${yil}-${String(ay).padStart(2, "0")}-${String(gun).padStart(2, "0")}`;
  // 31.02 gibi olmayan tarihleri ele
  const d = new Date(sonuc);
  if (Number.isNaN(d.getTime()) || d.getUTCDate() !== gun) return null;
  return sonuc;
}

function fazCoz(ham: string, phases: Phase[]): string | null {
  const t = ham.toLocaleLowerCase("tr");
  // id: #C
  const idyle = phases.find((p) => p.id.toLocaleLowerCase("tr") === t);
  if (idyle) return idyle.id;
  // faz adının başındaki numara: "#2" -> "2 · Sosyal medya ivmesi"
  const numarayla = phases.find((p) => p.n.trim().startsWith(`${ham} `) || p.n.trim().startsWith(`${ham}·`));
  if (numarayla) return numarayla.id;
  // ada göre kısmi eşleşme: #sosyal
  const adla = phases.filter((p) => p.n.toLocaleLowerCase("tr").includes(t));
  return adla.length === 1 ? adla[0].id : null;
}

export function toplantiAyristir(
  metin: string,
  { phases, kadro, bugun }: { phases: Phase[]; kadro: string[]; bugun: string },
): AyrisanGorev[] {
  return metin
    .split("\n")
    .map((ham, i) => ({ ham: ham.trim(), satir: i + 1 }))
    // Boş satırlar ve "- " madde imleri sorun olmasın.
    .filter(({ ham }) => ham.length > 0)
    .map(({ ham, satir }) => {
      const uyarilar: string[] = [];
      let owner: string | null = null;
      let phase: string | null = null;
      let due: string | null = null;

      const kalan = ham
        .replace(/^[-*•]\s*/, "")
        .replace(/[@#!]\S+/g, (isaret) => {
          const tip = isaret[0];
          const deger = isaret.slice(1);

          if (tip === "@") {
            const bulunan = kadro.find(
              (k) => k.toLocaleLowerCase("tr") === deger.toLocaleLowerCase("tr"),
            );
            if (bulunan) owner = bulunan;
            else uyarilar.push(`"@${deger}" kimse ile eşleşmedi`);
          } else if (tip === "#") {
            const bulunan = fazCoz(deger, phases);
            if (bulunan) phase = bulunan;
            else uyarilar.push(`"#${deger}" faz ile eşleşmedi`);
          } else {
            const bulunan = tarihCoz(deger, bugun);
            if (bulunan) due = bulunan;
            else uyarilar.push(`"!${deger}" tarih olarak okunamadı`);
          }
          return " ";
        })
        .replace(/\s+/g, " ")
        .trim();

      if (!kalan) uyarilar.push("başlık boş");

      return { satir, title: kalan, owner, phase, due, uyarilar };
    });
}
