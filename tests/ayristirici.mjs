/**
 * Toplantı notu ayrıştırıcısının birim testi (A4).
 * Tarayıcı gerektirmez, saf fonksiyon: Node'un .ts okuma yeteneğiyle koşar.
 */
const { toplantiAyristir } = await import("../src/lib/toplanti.ts");
const phases = [
  { id: "A", n: "1 · Toparlanma", d: "", from: "", to: "", gate: "" },
  { id: "B", n: "2 · Sosyal medya ivmesi", d: "", from: "", to: "", gate: "" },
  { id: "C", n: "3 · Bootcamp duyuru & kayıt", d: "", from: "", to: "", gate: "" },
  { id: "D", n: "4 · Bootcamp (6 hafta)", d: "", from: "", to: "", gate: "" },
  { id: "K", n: "Kurumsal hat", d: "", from: "", to: "", gate: "" },
];
const kadro = ["Kürşad", "Sarah", "Yunus"];
const bugun = "2026-09-18";
const ok = (n, c) => console.log(`${c ? "✓" : "✗ BASARISIZ"}  ${n}`);

const r = toplantiAyristir(`
Sarah kurumsal paket taslağını okusun @Sarah #C !25.09
- Yunus envanteri çıkarsın @Yunus #2
Mali müşavire sor !15.01
@Sarh yanlış isim testi
#zzz olmayan faz !99.99 bozuk tarih
`, { phases, kadro, bugun });

ok(`5 satir ayristi (${r.length})`, r.length === 5);
ok(`1: baslik temiz ("${r[0].title}")`, r[0].title === "Sarah kurumsal paket taslağını okusun");
ok(`1: sorumlu/faz/tarih (${r[0].owner}/${r[0].phase}/${r[0].due})`,
   r[0].owner === "Sarah" && r[0].phase === "C" && r[0].due === "2026-09-25");
ok(`2: madde imi temizlendi ("${r[1].title}")`, r[1].title === "Yunus envanteri çıkarsın");
ok(`2: #2 -> faz B (${r[1].phase})`, r[1].phase === "B");
ok(`3: !15.01 gelecek yila gitti (${r[2].due})`, r[2].due === "2027-01-15");
ok(`4: yanlis isim uyari verdi (${r[3].uyarilar[0]})`, r[3].uyarilar.length === 1 && r[3].owner === null);
ok(`5: iki uyari birden (${r[4].uyarilar.length})`, r[4].uyarilar.length === 2);
ok(`5: gecerli olan yine de alindi ("${r[4].title}")`, r[4].title === "olmayan faz bozuk tarih");

const r2 = toplantiAyristir("Test !2026-10-05 @kürşad", { phases, kadro, bugun });
ok(`ISO tarih ve kucuk harf isim (${r2[0].due}/${r2[0].owner})`,
   r2[0].due === "2026-10-05" && r2[0].owner === "Kürşad");
const r3 = toplantiAyristir("Test !31.02", { phases, kadro, bugun });
ok(`olmayan tarih (31.02) reddedildi`, r3[0].due === null && r3[0].uyarilar.length === 1);

process.exit(0);
