"use client";

import { useRouter } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { browserClient } from "./supabase/client";
import { kisiYaz } from "./kisi";
import type { Kadro } from "./supabase/queries";
import { alanYaz, durumYaz, gorevEkle, gorevSil, notYaz, topluGuncelle, topluSil } from "./supabase/yaz";
import type { Note, Phase, Status, Task } from "./types";

export type Theme = "dark" | "light" | "system";

type Store = {
  tasks: Task[];
  phases: Phase[];
  /** Ekip kadrosu — "Ben" menüsündeki isimler. */
  kadro: Kadro[];
  /**
   * Seçili kişi. Tek şifreli girişte bu kullanıcının BEYANI, doğrulanmış
   * kimlik değil. Sahiplik ve K6 silme kuralı buna dayanıyor.
   */
  me: string;
  setMe: (ad: string) => void;
  theme: Theme;
  setTheme: (t: Theme) => void;
  /** Sunucudan gelen bugün; hydration uyuşmazlığı olmasın diye prop olarak iniyor. */
  today: string;
  /** Son yazma hatası. null ise sorun yok. */
  hata: string | null;
  hatayiKapat: () => void;
  setStatus: (id: string, status: Status) => void;
  addNote: (id: string, body: string) => void;
  updateTask: (id: string, patch: Partial<Pick<Task, "owner" | "due">>) => void;
  addTask: (
    input: Omit<Task, "id" | "status" | "notes" | "what" | "why" | "done" | "createdBy">,
  ) => Promise<void>;
  removeTask: (id: string) => void;
  /** Toplu işlemler (A1). */
  topluDegistir: (ids: string[], patch: { owner?: string; phase?: string; due?: string }) => void;
  topluKaldir: (ids: string[]) => void;
};

const Ctx = createContext<Store | null>(null);
const THEME_KEY = "inner-edge:theme";

export function StoreProvider({
  today,
  kadro,
  me: sunucudanMe,
  tasks: sunucudan,
  phases,
  children,
}: {
  today: string;
  kadro: Kadro[];
  me: string;
  tasks: Task[];
  phases: Phase[];
  children: ReactNode;
}) {
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>(sunucudan);
  const [theme, setThemeState] = useState<Theme>("dark");
  const [hata, setHata] = useState<string | null>(null);
  // Seçim çerezde: sunucu da okuyabildiği için ilk HTML doğru isimle çıkıyor,
  // girişten sonra isim göz kırpması olmuyor.
  const [me, setMeState] = useState<string>(sunucudanMe);

  useEffect(() => {
    setMeState(sunucudanMe);
  }, [sunucudanMe]);

  const setMe = useCallback((ad: string) => {
    setMeState(ad);
    kisiYaz(ad);
  }, []);

  // Sunucudan taze veri geldiğinde (router.refresh) üstüne yaz.
  useEffect(() => {
    setTasks(sunucudan);
  }, [sunucudan]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(THEME_KEY) as Theme | null;
      if (saved === "dark" || saved === "light" || saved === "system") setThemeState(saved);
    } catch {
      // Gizli sekmede veya site verisi kapalıyken localStorage patlar.
    }
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  // --- Realtime: biri değiştirince herkesin ekranı yenilemeden güncellensin ---
  const zamanlayici = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    const supabase = browserClient();
    let kanal: ReturnType<typeof supabase.channel> | null = null;
    let iptal = false;

    // Arka arkaya gelen olaylarda (ör. bir güncelleme + iki log satırı) tek
    // seferde tazele; yoksa aynı anda üç istek gidiyor.
    const tazele = () => {
      if (zamanlayici.current) clearTimeout(zamanlayici.current);
      zamanlayici.current = setTimeout(() => router.refresh(), 250);
    };

    (async () => {
      // ÖNEMLİ: oturum çerezden asenkron okunuyor. Beklemeden abone olursak
      // kanal `anon` olarak bağlanıyor, RLS bütün olayları eliyor ve hiçbir
      // hata görünmeden Realtime sessizce çalışmıyor.
      const { data } = await supabase.auth.getSession();
      if (iptal) return;
      if (data.session) await supabase.realtime.setAuth(data.session.access_token);
      if (iptal) return;

      kanal = supabase
        .channel("pano")
        .on("postgres_changes", { event: "*", schema: "public", table: "tasks" }, tazele)
        .on("postgres_changes", { event: "*", schema: "public", table: "task_events" }, tazele)
        .subscribe((durum, err) => {
          if (durum === "CHANNEL_ERROR" || durum === "TIMED_OUT") {
            console.error("[realtime] abonelik sorunu:", durum, err?.message ?? "");
          }
        });
    })();

    return () => {
      iptal = true;
      if (zamanlayici.current) clearTimeout(zamanlayici.current);
      if (kanal) supabase.removeChannel(kanal);
    };
  }, [router]);

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t);
    try {
      localStorage.setItem(THEME_KEY, t);
    } catch {}
  }, []);

  /**
   * Önce ekranda değiştir (anında tepki), sonra veritabanına yaz.
   * Yazma başarısızsa eski haline döndür ve sebebini göster — sessizce
   * "kaydedildi" görüntüsü vermek en kötüsü.
   */
  const iyimser = useCallback(
    async (uygula: (prev: Task[]) => Task[], yaz: () => Promise<string | null>) => {
      let oncesi: Task[] = [];
      setTasks((prev) => {
        oncesi = prev;
        return uygula(prev);
      });
      const h = await yaz();
      if (h) {
        setTasks(oncesi);
        setHata(h);
      }
    },
    [],
  );

  const setStatus = useCallback(
    (id: string, status: Status) => {
      void iyimser(
        (prev) => prev.map((t) => (t.id === id ? { ...t, status } : t)),
        () => durumYaz(id, status, me),
      );
    },
    [iyimser, me],
  );

  const addNote = useCallback(
    (id: string, body: string) => {
      const text = body.trim();
      if (!text) return;
      const note: Note = { actor: me, at: new Date().toISOString(), body: text };
      void iyimser(
        (prev) => prev.map((t) => (t.id === id ? { ...t, notes: [...t.notes, note] } : t)),
        () => notYaz(id, text, me),
      );
    },
    [iyimser, me],
  );

  const updateTask = useCallback(
    (id: string, patch: Partial<Pick<Task, "owner" | "due">>) => {
      void iyimser(
        (prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)),
        () => alanYaz(id, patch, me),
      );
    },
    [iyimser, me],
  );

  // Ekleme iyimser değil: gerçek id'yi veritabanı üretiyor, onu beklemek gerek.
  const addTask = useCallback<Store["addTask"]>(
    async (input) => {
      const h = await gorevEkle(input, me);
      if (h) setHata(h);
      else router.refresh();
    },
    [router, me],
  );

  const removeTask = useCallback(
    (id: string) => {
      void iyimser(
        (prev) => prev.filter((t) => t.id !== id),
        () => gorevSil(id),
      );
    },
    [iyimser],
  );

  const hatayiKapat = useCallback(() => setHata(null), []);

  const topluDegistir = useCallback<Store["topluDegistir"]>(
    (ids, patch) => {
      const kume = new Set(ids);
      void iyimser(
        (prev) =>
          prev.map((t) =>
            kume.has(t.id)
              ? {
                  ...t,
                  ...(patch.owner !== undefined ? { owner: patch.owner } : {}),
                  ...(patch.phase !== undefined ? { phase: patch.phase } : {}),
                  ...(patch.due !== undefined ? { due: patch.due } : {}),
                }
              : t,
          ),
        () => topluGuncelle(ids, patch, me),
      );
    },
    [iyimser, me],
  );

  const topluKaldir = useCallback<Store["topluKaldir"]>(
    (ids) => {
      const kume = new Set(ids);
      void iyimser(
        (prev) => prev.filter((t) => !kume.has(t.id)),
        () => topluSil(ids),
      );
    },
    [iyimser],
  );

  const value = useMemo<Store>(
    () => ({
      tasks, phases, kadro, me, setMe, theme, setTheme, today, hata, hatayiKapat,
      setStatus, addNote, updateTask, addTask, removeTask, topluDegistir, topluKaldir,
    }),
    [tasks, phases, kadro, me, setMe, theme, setTheme, today, hata, hatayiKapat,
     setStatus, addNote, updateTask, addTask, removeTask, topluDegistir, topluKaldir],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore(): Store {
  const v = useContext(Ctx);
  if (!v) throw new Error("useStore <StoreProvider> içinde çağrılmalı");
  return v;
}
