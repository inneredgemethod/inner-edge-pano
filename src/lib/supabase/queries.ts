import { serverClient } from "./server";
import type { Note, Phase, Status, Task } from "@/lib/types";

/** Giriş yapmış kişinin allowed_users satırı. RLS sadece kendi satırını verir. */
export type Kimlik = { email: string; display_name: string; color: string; is_admin: boolean };

type TaskRow = {
  id: string;
  phase_id: string;
  week_label: string | null;
  title: string;
  owner: string;
  due_date: string | null;
  status: Status;
  what: string | null;
  why: string | null;
  done_when: string | null;
  created_by: string | null;
};

type PhaseRow = {
  id: string;
  name: string;
  period: string | null;
  date_from: string | null;
  date_to: string | null;
  gate: string | null;
  sort: number;
};

type EventRow = {
  task_id: string;
  kind: string;
  body: string | null;
  actor: string;
  created_at: string;
};

export type Pano = { kimlik: Kimlik | null; tasks: Task[]; phases: Phase[] };

/**
 * Panonun tamamını tek seferde okur. Üç sorgu da RLS altında çalışır:
 * izinsiz bir oturum boş dizi alır, hata almaz.
 */
export async function panoyuOku(): Promise<Pano> {
  const supabase = await serverClient();

  // Politika izinli kullanıcıya ekibin TAMAMINI gösteriyor (sorumlu renkleri
  // için lazım), o yüzden kendi satırımızı e-postayla süzmemiz gerekiyor.
  const { data: claims } = await supabase.auth.getClaims();
  const email = (claims?.claims?.email as string | undefined) ?? "";

  const [kimlikRes, taskRes, phaseRes, eventRes] = await Promise.all([
    supabase
      .from("allowed_users")
      .select("email,display_name,color,is_admin")
      .eq("email", email)
      .maybeSingle(),
    supabase
      .from("tasks")
      .select("id,phase_id,week_label,title,owner,due_date,status,what,why,done_when,created_by")
      .order("created_at", { ascending: true }),
    supabase.from("phases").select("id,name,period,date_from,date_to,gate,sort").order("sort"),
    supabase
      .from("task_events")
      .select("task_id,kind,body,actor,created_at")
      .eq("kind", "note")
      .order("created_at", { ascending: true }),
  ]);

  const notlar = new Map<string, Note[]>();
  for (const e of (eventRes.data ?? []) as EventRow[]) {
    if (!notlar.has(e.task_id)) notlar.set(e.task_id, []);
    notlar.get(e.task_id)!.push({ actor: e.actor, at: e.created_at, body: e.body ?? "" });
  }

  const tasks: Task[] = ((taskRes.data ?? []) as TaskRow[]).map((r) => ({
    id: r.id,
    phase: r.phase_id,
    week: r.week_label ?? "",
    title: r.title,
    owner: r.owner,
    due: r.due_date ?? "",
    status: r.status,
    what: r.what ?? "",
    why: r.why ?? "",
    done: r.done_when ?? "",
    createdBy: r.created_by ?? undefined,
    notes: notlar.get(r.id) ?? [],
  }));

  const phases: Phase[] = ((phaseRes.data ?? []) as PhaseRow[]).map((p) => ({
    id: p.id,
    n: p.name,
    d: p.period ?? "",
    from: p.date_from ?? "",
    to: p.date_to ?? "",
    gate: p.gate ?? "",
  }));

  return { kimlik: (kimlikRes.data as Kimlik | null) ?? null, tasks, phases };
}
