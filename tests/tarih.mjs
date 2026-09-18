/**
 * Tarih yardımcıları ve zaman gruplaması (B1). Saf fonksiyonlar, tarayıcı yok.
 */
const { gunEkle, haftaBasi, gunAdi, haftaninGunleri, gorevGrubu, gorevGruplari } = await import(
  "../src/lib/data.ts"
);

const ok = (n, c) => console.log(`${c ? "✓" : "✗ BASARISIZ"}  ${n}`);
const g = (due, status = "Bekliyor") => ({ due, status, id: due || "x" });

// --- gunEkle ---
ok("gunEkle ileri", gunEkle("2026-09-18", 7) === "2026-09-25");
ok("gunEkle geri", gunEkle("2026-09-18", -1) === "2026-09-17");
ok("gunEkle ay siniri", gunEkle("2026-09-30", 1) === "2026-10-01");
ok("gunEkle yil siniri", gunEkle("2026-12-31", 1) === "2027-01-01");

// --- haftaBasi: hafta Pazartesi baslar ---
// 2026-09-14 Pazartesi, 2026-09-20 Pazar
ok(`haftaBasi(Pzt) kendisi (${haftaBasi("2026-09-14")})`, haftaBasi("2026-09-14") === "2026-09-14");
ok(`haftaBasi(Cum) (${haftaBasi("2026-09-18")})`, haftaBasi("2026-09-18") === "2026-09-14");
ok(`haftaBasi(Paz) ayni haftada kalir (${haftaBasi("2026-09-20")})`, haftaBasi("2026-09-20") === "2026-09-14");
ok(`haftaBasi(sonraki Pzt) (${haftaBasi("2026-09-21")})`, haftaBasi("2026-09-21") === "2026-09-21");

// --- gun adlari ---
ok(`gunAdi 14 Eyl = Pzt (${gunAdi("2026-09-14")})`, gunAdi("2026-09-14") === "Pzt");
ok(`gunAdi 20 Eyl = Paz (${gunAdi("2026-09-20")})`, gunAdi("2026-09-20") === "Paz");

const hafta = haftaninGunleri("2026-09-18");
ok(`haftaninGunleri 7 gun, Pzt->Paz (${hafta[0]}..${hafta[6]})`,
   hafta.length === 7 && hafta[0] === "2026-09-14" && hafta[6] === "2026-09-20");

// --- gruplama (bugun Cuma 18 Eylul) ---
const bugun = "2026-09-18";
ok("dun -> Gecikmis", gorevGrubu(g("2026-09-17"), bugun) === "Gecikmiş");
ok("bugun -> Bu hafta", gorevGrubu(g(bugun), bugun) === "Bu hafta");
ok("bu Pazar -> Bu hafta", gorevGrubu(g("2026-09-20"), bugun) === "Bu hafta");
ok("gelecek Pzt -> Gelecek hafta", gorevGrubu(g("2026-09-21"), bugun) === "Gelecek hafta");
ok("gelecek Paz -> Gelecek hafta", gorevGrubu(g("2026-09-27"), bugun) === "Gelecek hafta");
ok("iki hafta sonra -> Sonrasi", gorevGrubu(g("2026-09-28"), bugun) === "Sonrası");
ok("tarihsiz -> Tarihsiz", gorevGrubu(g(""), bugun) === "Tarihsiz");
ok("yapilmis gecmis gorev Gecikmis DEGIL",
   gorevGrubu(g("2026-09-17", "Yapıldı"), bugun) === "Bu hafta");

// --- gruplama sirasi ve bos gruplarin atlanmasi ---
const gruplar = gorevGruplari(
  [g("2026-10-10"), g(""), g("2026-09-17"), g("2026-09-19"), g("2026-09-22")],
  bugun,
);
ok(`grup sirasi dogru (${gruplar.map((x) => x.grup).join(" > ")})`,
   gruplar.map((x) => x.grup).join(",") === "Gecikmiş,Bu hafta,Gelecek hafta,Sonrası,Tarihsiz");
const bosGrup = gorevGruplari([g("2026-09-19")], bugun);
ok(`bos gruplar donmez (${bosGrup.length})`, bosGrup.length === 1 && bosGrup[0].grup === "Bu hafta");

process.exit(0);
