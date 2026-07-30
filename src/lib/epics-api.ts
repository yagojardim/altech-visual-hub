import { supabase } from "./supabase";
import { isMissingRelation, logSupabaseError } from "./supabase-errors";

/**
 * Épicos (public.epics) — mesmo padrão dos demais *-api.ts:
 * leitura direta via @supabase/supabase-js, colunas reais (EN),
 * degrada para vazio quando a tabela ainda não foi migrada.
 */

export type EpicColorKey = "inprogress" | "warning" | "purple" | "healthy" | "blocked";

export const EPIC_COLOR_PRESET: { key: EpicColorKey; label: string; color: string }[] = [
  { key: "inprogress", label: "Azul", color: "var(--inprogress)" },
  { key: "warning", label: "Âmbar", color: "var(--warning)" },
  { key: "purple", label: "Roxo", color: "var(--purple)" },
  { key: "healthy", label: "Verde", color: "var(--healthy)" },
  { key: "blocked", label: "Vermelho", color: "var(--blocked)" },
];

export function epicColor(key?: string | null): string {
  return (
    EPIC_COLOR_PRESET.find((c) => c.key === key)?.color ?? EPIC_COLOR_PRESET[0].color
  );
}

export interface EpicRow {
  id: string;
  project_id: string;
  key: string;
  label: string;
  color: string;
  description: string | null;
  quarter: string | null;
  owner_id: string | null;
  created_at?: string;
}

export interface EpicInput {
  project_id: string;
  key: string;
  label: string;
  color?: EpicColorKey;
  description?: string | null;
  quarter?: string | null;
  owner_id?: string | null;
}

const SELECT =
  "id, project_id, key, label, color, description, quarter, owner_id, created_at";

export const EPICS_MISSING_HINT =
  "Tabela public.epics ainda não existe. Rode supabase/sql/epics.sql no SQL Editor do Supabase.";

export async function listEpics(projectId: string): Promise<EpicRow[]> {
  const { data, error } = await supabase
    .from("epics")
    .select(SELECT)
    .eq("project_id", projectId)
    .order("key", { ascending: true });
  if (error) {
    if (isMissingRelation(error)) {
      logSupabaseError("epics-api:listEpics", error);
      throw new Error(EPICS_MISSING_HINT);
    }
    throw new Error(error.message || "Erro ao listar épicos.");
  }
  return (data ?? []) as EpicRow[];
}

export async function createEpic(input: EpicInput): Promise<EpicRow> {
  const payload = {
    project_id: input.project_id,
    key: input.key.trim().toUpperCase(),
    label: input.label.trim(),
    color: input.color ?? "inprogress",
    description: input.description?.trim() || null,
    quarter: input.quarter?.trim() || null,
    owner_id: input.owner_id || null,
  };
  const { data, error } = await supabase
    .from("epics")
    .insert(payload)
    .select(SELECT)
    .single();
  if (error) {
    if (isMissingRelation(error)) throw new Error(EPICS_MISSING_HINT);
    throw new Error(error.message || "Erro ao criar épico.");
  }
  return data as EpicRow;
}

export async function updateEpic(
  id: string,
  patch: Partial<Omit<EpicInput, "project_id">>,
): Promise<EpicRow> {
  const { data, error } = await supabase
    .from("epics")
    .update(patch)
    .eq("id", id)
    .select(SELECT)
    .single();
  if (error) throw new Error(error.message || "Erro ao atualizar épico.");
  return data as EpicRow;
}

export async function deleteEpic(id: string): Promise<void> {
  const { error } = await supabase.from("epics").delete().eq("id", id);
  if (error) throw new Error(error.message || "Erro ao excluir épico.");
}

/* ------------------------------------------------------------------ */
/* Issues vinculadas                                                    */
/* ------------------------------------------------------------------ */

export interface EpicIssue {
  id: string;
  project_id: string;
  epic_id: string | null;
  title: string;
  type: string | null;
  status: string | null;
  priority: string | null;
  assignee_id: string | null;
  story_points: number | null;
}

const ISSUE_SELECT =
  "id, project_id, epic_id, title, type, status, priority, assignee_id, story_points";

/** Todas as issues do projeto (vinculadas ou não), para agregação e busca. */
export async function listProjectIssues(projectId: string): Promise<EpicIssue[]> {
  const { data, error } = await supabase
    .from("work_items")
    .select(ISSUE_SELECT)
    .eq("project_id", projectId)
    .order("created_at", { ascending: true });
  if (error) {
    if (isMissingRelation(error)) {
      logSupabaseError("epics-api:listProjectIssues", error);
      throw new Error(EPICS_MISSING_HINT);
    }
    throw new Error(error.message || "Erro ao listar issues do projeto.");
  }
  return (data ?? []) as EpicIssue[];
}

export async function linkIssueToEpic(
  issueId: string,
  epicId: string | null,
): Promise<void> {
  const { error } = await supabase
    .from("work_items")
    .update({ epic_id: epicId })
    .eq("id", issueId);
  if (error) throw new Error(error.message || "Erro ao vincular issue ao épico.");
}

export async function createIssueInEpic(params: {
  projectId: string;
  epicId: string;
  title: string;
  type?: string;
}): Promise<EpicIssue> {
  const { data, error } = await supabase
    .from("work_items")
    .insert({
      project_id: params.projectId,
      epic_id: params.epicId,
      title: params.title.trim(),
      type: params.type ?? "story",
      status: "Backlog",
      priority: "media",
    })
    .select(ISSUE_SELECT)
    .single();
  if (error) throw new Error(error.message || "Erro ao criar issue.");
  return data as EpicIssue;
}

/* ------------------------------------------------------------------ */
/* Agregação de progresso                                               */
/* ------------------------------------------------------------------ */

export const EPIC_STATUS_BUCKETS = [
  "backlog",
  "todo",
  "in-progress",
  "in-review",
  "done",
] as const;
export type EpicStatusBucket = (typeof EPIC_STATUS_BUCKETS)[number];

export const BUCKET_LABEL: Record<EpicStatusBucket, string> = {
  backlog: "Backlog",
  todo: "A fazer",
  "in-progress": "Em progresso",
  "in-review": "Em revisão",
  done: "Concluído",
};

/** Normaliza os status reais (PT-BR e EN) para os 5 buckets do épico. */
export function statusBucket(status?: string | null): EpicStatusBucket {
  const s = (status ?? "").toLowerCase().trim();
  if (/conclu|done|finaliz|entregue/.test(s)) return "done";
  if (/revis|review/.test(s)) return "in-review";
  if (/progress|andamento|doing|execu/.test(s)) return "in-progress";
  if (/fazer|todo|to do|pronto|ready|planej/.test(s)) return "todo";
  return "backlog";
}

export interface EpicStats {
  total: number;
  done: number;
  progress: number;
  points: number;
  byBucket: Record<EpicStatusBucket, number>;
  assigneeIds: string[];
}

export function computeEpicStats(issues: EpicIssue[]): EpicStats {
  const byBucket = {
    backlog: 0,
    todo: 0,
    "in-progress": 0,
    "in-review": 0,
    done: 0,
  } as Record<EpicStatusBucket, number>;
  let points = 0;
  const assignees = new Set<string>();
  for (const i of issues) {
    byBucket[statusBucket(i.status)] += 1;
    points += i.story_points ?? 0;
    if (i.assignee_id) assignees.add(i.assignee_id);
  }
  const total = issues.length;
  const done = byBucket.done;
  return {
    total,
    done,
    progress: total === 0 ? 0 : Math.round((done / total) * 100),
    points,
    byBucket,
    assigneeIds: Array.from(assignees),
  };
}
