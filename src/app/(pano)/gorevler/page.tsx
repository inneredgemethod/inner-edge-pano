"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { GecmisGorunumu } from "@/components/GecmisGorunumu";
import { HaftaGorunumu } from "@/components/HaftaGorunumu";
import { PhaseStrip } from "@/components/PhaseStrip";
import { TakvimGorunumu } from "@/components/TakvimGorunumu";
import { TaskDetail } from "@/components/TaskDetail";
import { TaskList } from "@/components/TaskList";
import { TopluCubuk } from "@/components/TopluCubuk";
import { currentPhase } from "@/lib/data";
import { filtreyiOku, filtreyiUygula, filtreyiYaz, type Filtre, type Gorunum } from "@/lib/filtre";
import { useStore } from "@/lib/store";
import { panoyaGirenler } from "@/lib/types";

const GORUNUM_ETIKETI: Record<Gorunum, string> = {
  liste: "Liste",
  hafta: "Hafta",
  takvim: "Takvim",
  gecmis: "Geçmiş",
};

function Gorevler() {
  const { tasks, phases, kadro, today } = useStore();
  const pathname = usePathname();
  const params = useSearchParams();

  // Filtreler state'te tutulur, URL'e AYNA olarak yazılır.
  //
  // Neden router.replace değil: bu grup `force-dynamic`, yani her replace
  // sunucuya gidiyor. Arama kutusunda her tuş vuruşu bir istek demekti ve
  // filtre gözle görülür gecikmeyle uygulanıyordu. history.replaceState
  // adresi günceller, sunucuya gitmez — link paylaşılabilirliği korunur.
  const [filtre, setFiltre] = useState<Filtre>(() =>
    filtreyiOku(new URLSearchParams(params.toString())),
  );

  // Adrese en son BİZİM yazdığımız sorgu dizesi. Aşağıdaki iki effect'in
  // birbirini tetiklememesi buna dayanıyor.
  const yazdigimiz = useRef<string | null>(null);

  useEffect(() => {
    const qs = filtreyiYaz(filtre);
    yazdigimiz.current = qs;
    const yeni = `${pathname}${qs}`;
    if (yeni !== window.location.pathname + window.location.search) {
      window.history.replaceState(null, "", yeni);
    }
  }, [filtre, pathname]);

  // URL -> state. Bu olmadan filtre adresten YALNIZCA BİR KEZ okunuyordu:
  // /gorevler?faz=B ekranındayken alt menüden "Görevler"e dokunmak aynı route
  // olduğu için bileşeni yeniden kurmuyor, `filtre` eski kalıyor ve yukarıdaki
  // effect adresi geri ?faz=B yapıyordu — sekme hiçbir şey yapmamış gibi
  // görünüyordu. Aynı şey ana sayfadaki "Tümünü gör" bağlantısı için de geçerli.
  useEffect(() => {
    const gelen = params.toString();
    const gelenQs = gelen ? `?${gelen}` : "";
    // null: henüz hiç yazmadık (ilk render) — state zaten URL'den okundu.
    if (yazdigimiz.current !== null && gelenQs !== yazdigimiz.current) {
      yazdigimiz.current = gelenQs;
      setFiltre(filtreyiOku(new URLSearchParams(gelen)));
    }
  }, [params]);

  const guncelle = (yama: Partial<Filtre>) => setFiltre((f) => ({ ...f, ...yama }));

  const [openId, setOpenId] = useState<string | null>(null);
  const [secimModu, setSecimModu] = useState(false);
  const [secililer, setSecililer] = useState<Set<string>>(new Set());

  const girenler = panoyaGirenler(kadro);
  const girenIsimler = girenler.map((k) => k.display_name);
  const now = currentPhase(phases, today);

  // Geçmiş görünümü zaten yalnızca bitmiş görevleri listeliyor; "Yapılanları
  // gizle" açık kalmışsa sekme boş görünürdü. O iki filtre burada devre dışı.
  const etkinFiltre =
    filtre.gorunum === "gecmis"
      ? { ...filtre, bitenleriGizle: false, sadeceAcik: false }
      : filtre;
  const visible = filtreyiUygula(tasks, etkinFiltre, { today, girenIsimler });
  // Boş listelerin doğru mesajı verebilmesi için: görünüm ve demir tarih
  // dışında herhangi bir filtre açık mı?
  const filtreliMi =
    !!filtre.faz || !!filtre.kisi || !!filtre.q.trim() || filtre.bitenleriGizle || filtre.sadeceAcik;

  const gorunurIdler = visible.map((t) => t.id);
  const hepsiSecili = gorunurIdler.length > 0 && gorunurIdler.every((id) => secililer.has(id));

  const secToggle = (id: string) =>
    setSecililer((prev) => {
      const y = new Set(prev);
      if (y.has(id)) y.delete(id);
      else y.add(id);
      return y;
    });

  const secimiKapat = () => {
    setSecimModu(false);
    setSecililer(new Set());
  };

  const chips: { key: string | null; label: string }[] = [
    { key: null, label: "Herkes" },
    ...girenler.map((k) => ({ key: k.display_name, label: k.display_name })),
    { key: "diger", label: "Diğerleri" },
  ];

  const acGorev = (t: { id: string }) => setOpenId(t.id);

  return (
    <>
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <h1 className="text-base font-semibold">Görevler</h1>
        <div className="ml-auto flex gap-1">
          {(Object.keys(GORUNUM_ETIKETI) as Gorunum[]).map((g) => {
            const on = filtre.gorunum === g;
            return (
              <button
                key={g}
                type="button"
                onClick={() => guncelle({ gorunum: g })}
                aria-pressed={on}
                className="min-h-[2.5rem] rounded-lg border px-2.5 py-1 text-[13px]"
                style={{
                  borderColor: on ? "var(--c-teal)" : "var(--c-line)",
                  color: on ? "var(--c-teal)" : "var(--c-mute)",
                  background: on ? "var(--c-bg2)" : "transparent",
                }}
              >
                {GORUNUM_ETIKETI[g]}
              </button>
            );
          })}
        </div>
      </div>

      <PhaseStrip active={filtre.faz} onSelect={(id) => guncelle({ faz: id })} currentId={now?.id} />

      <input
        type="search"
        value={filtre.q}
        onChange={(e) => guncelle({ q: e.target.value })}
        placeholder="Ara — başlık, açıklama, not"
        aria-label="Görevlerde ara"
        className="mt-3 w-full rounded-lg border px-3 py-2 text-sm"
        style={{ background: "var(--c-bg2)", borderColor: "var(--c-line)", color: "var(--c-ink)" }}
      />

      <div className="mt-2.5 flex flex-wrap items-center gap-2">
        {chips.map((c) => {
          const on = filtre.kisi === c.key;
          return (
            <button
              key={c.label}
              type="button"
              onClick={() => guncelle({ kisi: c.key })}
              aria-pressed={on}
              className="rounded-full border px-3 py-1 text-[13px]"
              style={{
                borderColor: on ? "var(--c-teal)" : "var(--c-line)",
                color: on ? "var(--c-teal)" : "var(--c-mute)",
              }}
            >
              {c.label}
            </button>
          );
        })}
      </div>

      <div className="mt-2.5 flex flex-wrap gap-x-4 gap-y-2">
        <label className="flex items-center gap-1.5 text-[13px]" style={{ color: "var(--c-mute)" }}>
          <input
            type="checkbox"
            checked={filtre.bitenleriGizle}
            onChange={(e) => guncelle({ bitenleriGizle: e.target.checked })}
          />
          Yapılanları gizle
        </label>
        <label className="flex items-center gap-1.5 text-[13px]" style={{ color: "var(--c-mute)" }}>
          <input
            type="checkbox"
            checked={filtre.sadeceAcik}
            onChange={(e) => guncelle({ sadeceAcik: e.target.checked })}
          />
          Sadece takılan / geciken
        </label>
        <span className="ml-auto text-[13px]" style={{ color: "var(--c-mute)" }}>
          {visible.length} görev
        </span>
        {filtre.gorunum === "liste" && (
          <button
            type="button"
            onClick={() => (secimModu ? secimiKapat() : setSecimModu(true))}
            aria-pressed={secimModu}
            className="min-h-[2.5rem] rounded-lg border px-2.5 py-1 text-[13px]"
            style={{
              borderColor: secimModu ? "var(--c-teal)" : "var(--c-line)",
              color: secimModu ? "var(--c-teal)" : "var(--c-mute)",
            }}
          >
            {secimModu ? "Seçimi kapat" : "Seç"}
          </button>
        )}
      </div>

      {filtre.gorunum === "liste" && (
        <>
          {secimModu && (
            <label
              className="mt-3 flex items-center gap-2 rounded-lg border px-3 py-2 text-[13px]"
              style={{ borderColor: "var(--c-line)", color: "var(--c-mute)" }}
            >
              <input
                type="checkbox"
                checked={hepsiSecili}
                onChange={() => setSecililer(hepsiSecili ? new Set() : new Set(gorunurIdler))}
                className="size-4"
              />
              Görünen {visible.length} görevin tümünü seç
            </label>
          )}

          <TaskList
            tasks={visible}
            onOpen={acGorev}
            secimModu={secimModu}
            secililer={secililer}
            onSec={secToggle}
            empty={
              filtreliMi
                ? "Bu filtrede görev yok. Aramayı veya kişi/faz seçimini temizle."
                : "Panoda hiç görev yok. Alttaki ＋ Ekle sekmesinden ilk görevi ekleyebilirsin."
            }
          />

          {/* Alt çubuk içeriği örtmesin. */}
          {secimModu && <div className="h-24" aria-hidden />}
        </>
      )}

      {filtre.gorunum === "hafta" && (
        <HaftaGorunumu
          tasks={visible}
          demir={filtre.tarih}
          onDemir={(tarih) => guncelle({ tarih })}
          onOpen={acGorev}
        />
      )}

      {filtre.gorunum === "gecmis" && (
        <GecmisGorunumu tasks={visible} onOpen={acGorev} filtreVar={filtreliMi} />
      )}

      {filtre.gorunum === "takvim" && (
        <TakvimGorunumu
          tasks={visible}
          demir={filtre.tarih}
          onDemir={(tarih) => guncelle({ tarih })}
          onOpen={acGorev}
        />
      )}

      <TaskDetail taskId={openId} onClose={() => setOpenId(null)} />

      {secimModu && filtre.gorunum === "liste" && (
        <TopluCubuk
          secililer={[...secililer]}
          onTemizle={() => setSecililer(new Set())}
          onCik={secimiKapat}
        />
      )}
    </>
  );
}

export default function Page() {
  return (
    <Suspense fallback={null}>
      <Gorevler />
    </Suspense>
  );
}
