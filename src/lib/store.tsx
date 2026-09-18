"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Kimlik } from "./supabase/queries";
import type { Note, Phase, Status, Task } from "./types";

export type Theme = "dark" | "light" | "system";

type Store = {
  tasks: Task[];
  phases: Phase[];
  /** Giriş yapan kişi. Artık menüden seçilmiyor, oturumdan geliyor. */
  kimlik: Kimlik;
  me: string;
  theme: Theme;
  setTheme: (t: Theme) => void;
  /** Sunucudan gelen bugün; hydration uyuşmazlığı olmasın diye prop olarak iniyor. */
  today: string;
  setStatus: (id: string, status: Status) => void;
  addNote: (id: string, body: string) => void;
  updateTask: (id: string, patch: Partial<Pick<Task, "owner" | "due">>) => void;
  addTask: (
    input: Omit<Task, "id" | "status" | "notes" | "what" | "why" | "done" | "createdBy">,
  ) => void;
  removeTask: (id: string) => void;
  /** K6: bir görevi yalnızca ekleyen kişi veya admin (Kürşad) silebilir. */
  canDelete: (t: Task) => boolean;
};

const Ctx = createContext<Store | null>(null);
const THEME_KEY = "inner-edge:theme";

export function StoreProvider({
  today,
  kimlik,
  tasks: ilkTasks,
  phases,
  children,
}: {
  today: string;
  kimlik: Kimlik;
  tasks: Task[];
  phases: Phase[];
  children: ReactNode;
}) {
  // NOT (Faz 2): değişiklikler şimdilik sadece bu sekmede duruyor, veritabanına
  // yazılmıyor. Yazma + Realtime Faz 3'te bağlanacak.
  const [tasks, setTasks] = useState<Task[]>(ilkTasks);
  const [theme, setThemeState] = useState<Theme>("dark");

  // Sunucudan yeni veri gelirse (sayfa yenileme, router.refresh) üstüne yaz.
  useEffect(() => {
    setTasks(ilkTasks);
  }, [ilkTasks]);

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

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t);
    try {
      localStorage.setItem(THEME_KEY, t);
    } catch {}
  }, []);

  const me = kimlik.display_name;

  const setStatus = useCallback((id: string, status: Status) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, status } : t)));
  }, []);

  const addNote = useCallback(
    (id: string, body: string) => {
      const text = body.trim();
      if (!text) return;
      const note: Note = { actor: me, at: new Date().toISOString(), body: text };
      setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, notes: [...t.notes, note] } : t)));
    },
    [me],
  );

  const updateTask = useCallback((id: string, patch: Partial<Pick<Task, "owner" | "due">>) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  }, []);

  const addTask = useCallback<Store["addTask"]>(
    (input) => {
      const task: Task = {
        ...input,
        id: `yeni-${Date.now().toString(36)}`,
        status: "Bekliyor",
        notes: [],
        what: "",
        why: "",
        done: "",
        createdBy: kimlik.email,
      };
      setTasks((prev) => [...prev, task]);
    },
    [kimlik.email],
  );

  const removeTask = useCallback((id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const canDelete = useCallback(
    (t: Task) => kimlik.is_admin || (!!t.createdBy && t.createdBy === kimlik.email),
    [kimlik],
  );

  const value = useMemo<Store>(
    () => ({
      tasks,
      phases,
      kimlik,
      me,
      theme,
      setTheme,
      today,
      setStatus,
      addNote,
      updateTask,
      addTask,
      removeTask,
      canDelete,
    }),
    [tasks, phases, kimlik, me, theme, setTheme, today, setStatus, addNote, updateTask, addTask, removeTask, canDelete],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore(): Store {
  const v = useContext(Ctx);
  if (!v) throw new Error("useStore <StoreProvider> içinde çağrılmalı");
  return v;
}
