import { serverClient } from "./server";
import type { Kisi, KisiselNot, Note, Phase, Status, Task, Tekrar } from "@/lib/types";

type TaskRow = {
  id: string;
  phase_id: string;
  title: string;
  owner: string;
  due_date: string | null;
  status: Status;
  what: string | null;
  why: string | null;
  done_when: string | null;
  created_by: string | null;
  tekrar: Tekrar | null;
  completed_at: string | null;
};

type PhaseRow = {
  id: string;
  name: string;
  period: string | null;
  date_from: string | null;
  date_to: string | null;
  gate: string | null;
  sort: number;
  arsiv: boolean;
};

type EventRow = {
  task_id: string;
  kind: string;
  body: string | null;
  actor: string;
  created_at: string;
};

export type Pano = {
  kadro: Kisi[];
  tasks: Task[];
  phases: Phase[];
  kisiselNotlar: KisiselNot[];
  oturumVar: boolean;
};

/**
 * Panonun tamamını tek seferde okur. Beş sorgu da RLS altında çalışır:
 * oturum yoksa hepsi boş döner, hata vermez.
 */
export async function panoyuOku(): Promise<Pano> {
  const supabase = await serverClient();

  const [kadroRes, taskRes, phaseRes, eventRes, notRes] = await Promise.all([
    supabase.from("kisiler").select("display_name,color,sadece_sorumlu,sort,arsiv").order("sort"),
    supabase
      .from("tasks")
      .select("id,phase_id,title,owner,due_date,status,what,why,done_when,created_by,tekrar,completed_at")
      // created_at DEĞİL: 37 tohum görev tek seferde eklendi, hepsinin zamanı
      // aynı ve sıra her sorguda değişiyordu (bkz. 0006_gorev_sirasi.sql).
      .order("sirano", { ascending: true, nullsFirst: false }),
    supabase
      .from("phases")
      .select("id,name,period,date_from,date_to,gate,sort,arsiv")
      .order("sort"),
    supabase
      .from("task_events")
      .select("task_id,kind,body,actor,created_at")
      .eq("kind", "note")
      .order("created_at", { ascending: true }),
    supabase
      .from("notlar")
      .select("id,kisi,icerik,created_at")
      .order("created_at", { ascending: false }),
  ]);

  const notlar = new Map<string, Note[]>();
  for (const e of (eventRes.data ?? []) as EventRow[]) {
    if (!notlar.has(e.task_id)) notlar.set(e.task_id, []);
    notlar.get(e.task_id)!.push({ actor: e.actor, at: e.created_at, body: e.body ?? "" });
  }

  const tasks: Task[] = ((taskRes.data ?? []) as TaskRow[]).map((r) => ({
    id: r.id,
    phase: r.phase_id,
    title: r.title,
    owner: r.owner,
    due: r.due_date ?? "",
    status: r.status,
    what: r.what ?? "",
    why: r.why ?? "",
    done: r.done_when ?? "",
    createdBy: r.created_by ?? undefined,
    tekrar: r.tekrar ?? undefined,
    bitisAni: r.completed_at ?? undefined,
    notes: notlar.get(r.id) ?? [],
  }));

  const phases: Phase[] = ((phaseRes.data ?? []) as PhaseRow[]).map((p) => ({
    id: p.id,
    n: p.name,
    d: p.period ?? "",
    from: p.date_from ?? "",
    to: p.date_to ?? "",
    gate: p.gate ?? "",
    arsiv: p.arsiv,
  }));

  const kadro = (kadroRes.data ?? []) as Kisi[];
  const kisiselNotlar = (notRes.data ?? []) as KisiselNot[];
  return { kadro, tasks, phases, kisiselNotlar, oturumVar: kadro.length > 0 };
}
