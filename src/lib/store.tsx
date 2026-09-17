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
import { SEED_TASKS } from "./data";
import type { Note, Status, Task } from "./types";

export type Theme = "dark" | "light" | "system";

type Store = {
  tasks: Task[];
  /** "Ben kimim" — Faz 2'de yerini magic link oturumu alacak. */
  me: string;
  setMe: (name: string) => void;
  theme: Theme;
  setTheme: (t: Theme) => void;
  /** Sunucudan gelen bugün; hydration uyuşmazlığı olmasın diye prop olarak iniyor. */
  today: string;
  setStatus: (id: string, status: Status) => void;
  addNote: (id: string, body: string) => void;
  updateTask: (id: string, patch: Partial<Pick<Task, "owner" | "due">>) => void;
  addTask: (input: Omit<Task, "id" | "status" | "notes" | "what" | "why" | "done" | "createdBy">) => void;
  removeTask: (id: string) => void;
  /** K6: bir görevi yalnızca ekleyen kişi veya Kürşad silebilir. */
  canDelete: (t: Task) => boolean;
};

const Ctx = createContext<Store | null>(null);

const ME_KEY = "inner-edge:me";
const THEME_KEY = "inner-edge:theme";

export function StoreProvider({ today, children }: { today: string; children: ReactNode }) {
  const [tasks, setTasks] = useState<Task[]>(SEED_TASKS);
  const [me, setMeState] = useState<string>("Kürşad");
  const [theme, setThemeState] = useState<Theme>("dark");

  // localStorage yalnızca tarayıcıda var; ilk render sunucuda olduğu için
  // tercihleri mount'tan sonra okuyoruz.
  useEffect(() => {
    try {
      const savedMe = localStorage.getItem(ME_KEY);
      if (savedMe) setMeState(savedMe);
      const savedTheme = localStorage.getItem(THEME_KEY) as Theme | null;
      if (savedTheme === "dark" || savedTheme === "light" || savedTheme === "system") {
        setThemeState(savedTheme);
      }
    } catch {
      // Gizli sekmede veya site verisi kapalıyken localStorage patlar; varsayılanlarla devam.
    }
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  const setMe = useCallback((name: string) => {
    setMeState(name);
    try {
      localStorage.setItem(ME_KEY, name);
    } catch {}
  }, []);

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t);
    try {
      localStorage.setItem(THEME_KEY, t);
    } catch {}
  }, []);

  const setStatus = useCallback((id: string, status: Status) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, status } : t)));
  }, []);

  const addNote = useCallback(
    (id: string, body: string) => {
      const text = body.trim();
      if (!text) return;
      const note: Note = { actor: me, at: new Date().toISOString(), body: text };
      setTasks((prev) =>
        prev.map((t) => (t.id === id ? { ...t, notes: [...t.notes, note] } : t)),
      );
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
        createdBy: me,
      };
      setTasks((prev) => [...prev, task]);
    },
    [me],
  );

  const canDelete = useCallback(
    (t: Task) => me === "Kürşad" || (!!t.createdBy && t.createdBy === me),
    [me],
  );

  const removeTask = useCallback((id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const value = useMemo<Store>(
    () => ({
      tasks,
      me,
      setMe,
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
    [tasks, me, setMe, theme, setTheme, today, setStatus, addNote, updateTask, addTask, removeTask, canDelete],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore(): Store {
  const v = useContext(Ctx);
  if (!v) throw new Error("useStore <StoreProvider> içinde çağrılmalı");
  return v;
}
