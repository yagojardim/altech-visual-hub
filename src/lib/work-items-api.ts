import { supabase } from "./supabase";
import { isMissingRelation, logSupabaseError } from "./supabase-errors";

/**
 * API de work_items alinhada ao schema real (00_full_schema.sql + 03_work_item_behavior.sql):
 *   id, board_id, column_id, project_id, title, description, type, priority,
 *   assignee_id, status, position, created_at
 * Não existem tenant_id, item_key nem colunas em português nesta tabela.
 */

// `status` é texto livre no schema — mantemos os rótulos em PT-BR usados na UI.
export const STATUS_COLUMNS = [
  "A Fazer",
  "Em Progresso",
  "Em Revisão",
  "Concluído",
] as const;
export type WorkItemStatus = (typeof STATUS_COLUMNS)[number];

// `type` tem check constraint em inglês — label PT-BR só para exibição.
export const TIPO_OPTIONS = [
  { value: "epic", label: "Épico" },
  { value: "feature", label: "Feature" },
  { value: "story", label: "História" },
  { value: "task", label: "Tarefa" },
  { value: "subtask", label: "Subtarefa" },
  { value: "bug", label: "Bug" },
  { value: "risk", label: "Risco" },
] as const;
export type WorkItemType = (typeof TIPO_OPTIONS)[number]["value"];

// `priority` tem check constraint: baixa|media|alta|critica.
export const PRIORIDADE_OPTIONS = [
  { value: "baixa", label: "Baixa" },
  { value: "media", label: "Média" },
  { value: "alta", label: "Alta" },
  { value: "critica", label: "Crítica" },
] as const;
export type WorkItemPriority = (typeof PRIORIDADE_OPTIONS)[number]["value"];

export function typeLabel(value: string | null | undefined): string {
  return TIPO_OPTIONS.find((t) => t.value === value)?.label ?? value ?? "—";
}

export function priorityLabel(value: string | null | undefined): string {
  return PRIORIDADE_OPTIONS.find((p) => p.value === value)?.label ?? value ?? "—";
}

export interface WorkItemRow {
  id: string;
  board_id: string | null;
  column_id: string | null;
  project_id: string;
  title: string;
  description: string | null;
  type: string;
  priority: string;
  assignee_id: string | null;
  status: string | null;
  position: number | null;
  created_at?: string;
}

export interface WorkItemInput {
  project_id: string;
  title: string;
  description?: string | null;
  type?: string;
  priority?: string;
  assignee_id?: string | null;
  status?: string | null;
  position?: number;
  board_id?: string | null;
  column_id?: string | null;
}

const SELECT =
  "id, board_id, column_id, project_id, title, description, type, priority, assignee_id, status, position, created_at";

/** `projects.id` é um slug de texto — aceitamos id ou slug e devolvemos o id real. */
async function resolveProjectId(projectRef: string): Promise<string> {
  const { data, error } = await supabase
    .from("projects")
    .select("id")
    .or(`id.eq.${projectRef},slug.eq.${projectRef}`)
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(error.message || "Erro ao resolver projeto.");
  if (!data) throw new Error(`Projeto “${projectRef}” não encontrado.`);
  return data.id as string;
}

export async function listWorkItemsByProject(projectRef: string): Promise<WorkItemRow[]> {
  const projectId = await resolveProjectId(projectRef);
  const { data, error } = await supabase
    .from("work_items")
    .select(SELECT)
    .eq("project_id", projectId)
    .order("position", { ascending: true })
    .order("created_at", { ascending: true });
  if (error) {
    if (isMissingRelation(error)) {
      logSupabaseError("work-items-api:listWorkItemsByProject", error);
      return [];
    }
    throw new Error(error.message || "Erro ao listar work items.");
  }
  return (data ?? []) as WorkItemRow[];
}

export async function getWorkItem(id: string): Promise<WorkItemRow | null> {
  const { data, error } = await supabase
    .from("work_items")
    .select(SELECT)
    .eq("id", id)
    .maybeSingle();
  if (error) {
    if (isMissingRelation(error)) {
      logSupabaseError("work-items-api:getWorkItem", error);
      return null;
    }
    throw new Error(error.message || "Erro ao buscar work item.");
  }
  return (data as WorkItemRow | null) ?? null;
}

export async function createWorkItem(input: WorkItemInput): Promise<WorkItemRow> {
  const projectId = await resolveProjectId(input.project_id);

  const { data: last, error: lastErr } = await supabase
    .from("work_items")
    .select("position")
    .eq("project_id", projectId)
    .order("position", { ascending: false })
    .limit(1);
  if (lastErr) throw lastErr;
  const nextPosition =
    input.position ?? ((last?.[0]?.position as number | undefined) ?? 0) + 1;

  const payload = {
    project_id: projectId,
    board_id: input.board_id ?? null,
    column_id: input.column_id ?? null,
    title: input.title.trim(),
    description: input.description ?? null,
    type: input.type ?? "task",
    priority: input.priority ?? "media",
    assignee_id: input.assignee_id ?? null,
    status: input.status ?? STATUS_COLUMNS[0],
    position: nextPosition,
  };
  const { data, error } = await supabase
    .from("work_items")
    .insert(payload)
    .select(SELECT)
    .single();
  if (error) throw error;
  return data as WorkItemRow;
}

export async function updateWorkItem(
  id: string,
  patch: Partial<Omit<WorkItemInput, "project_id">>,
): Promise<WorkItemRow> {
  const { data, error } = await supabase
    .from("work_items")
    .update(patch)
    .eq("id", id)
    .select(SELECT)
    .single();
  if (error) throw error;
  return data as WorkItemRow;
}

export async function deleteWorkItem(id: string): Promise<void> {
  const { error } = await supabase.from("work_items").delete().eq("id", id);
  if (error) throw error;
}

/* ------------------------------------------------------------------ */
/* Timeline / Gantt                                                     */
/* ------------------------------------------------------------------ */

export interface TimelineWorkItem {
  id: string;
  project_id: string;
  title: string;
  type: string | null;
  status: string | null;
  priority: string | null;
  assignee_id: string | null;
  epic_id: string | null;
  /** Resolvido via sprint_items (N:N), não é coluna de work_items. */
  sprint_id: string | null;
  start_date: string | null;
  due_date: string | null;
  progress: number | null;
}

const TIMELINE_SELECT =
  "id, project_id, title, type, status, priority, assignee_id, epic_id, start_date, due_date, progress";

export const TIMELINE_MISSING_HINT =
  "A timeline depende de colunas que ainda não existem em work_items (start_date, epic_id). Rode supabase/sql/00_full_schema.sql, supabase/sql/03_work_item_behavior.sql, supabase/sql/epics.sql e supabase/sql/timeline.sql no SQL Editor do Supabase.";

/** 42703 = undefined_column — coluna ainda não migrada. */
function isMissingColumn(err: unknown): boolean {
  const e = err as { code?: unknown; message?: unknown } | null;
  const code = typeof e?.code === "string" ? e.code : "";
  const message = typeof e?.message === "string" ? e.message : "";
  return code === "42703" || /column .* does not exist/i.test(message);
}

/** Work items do projeto com os campos necessários para a timeline. */
export async function listTimelineWorkItems(
  projectRef: string,
): Promise<TimelineWorkItem[]> {
  const projectId = await resolveProjectId(projectRef);
  const { data, error } = await supabase
    .from("work_items")
    .select(TIMELINE_SELECT)
    .eq("project_id", projectId)
    .order("created_at", { ascending: true });
  if (error) {
    if (isMissingColumn(error)) throw new Error(TIMELINE_MISSING_HINT);
    if (isMissingRelation(error)) {
      logSupabaseError("work-items-api:listTimelineWorkItems", error);
      return [];
    }
    throw new Error(error.message || "Erro ao carregar a timeline.");
  }

  const rows = (data ?? []) as Omit<TimelineWorkItem, "sprint_id">[];
  const bySprint = await fetchSprintLinks(rows.map((r) => r.id));
  return rows.map((r) => ({ ...r, sprint_id: bySprint.get(r.id) ?? null }));
}

/** work_item_id -> sprint_id, via tabela de vínculo sprint_items (primeiro vínculo). */
async function fetchSprintLinks(
  itemIds: string[],
): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  if (itemIds.length === 0) return map;
  const { data, error } = await supabase
    .from("sprint_items")
    .select("work_item_id, sprint_id")
    .in("work_item_id", itemIds);
  if (error) {
    logSupabaseError("work-items-api:fetchSprintLinks", error);
    return map;
  }
  for (const row of (data ?? []) as {
    work_item_id: string | null;
    sprint_id: string | null;
  }[]) {
    if (!row.work_item_id || !row.sprint_id) continue;
    if (!map.has(row.work_item_id)) map.set(row.work_item_id, row.sprint_id);
  }
  return map;
}


/** Grava start_date/due_date ao soltar a barra na timeline. */
export async function updateWorkItemDates(
  id: string,
  dates: { start_date: string; due_date: string },
): Promise<void> {
  const { error } = await supabase
    .from("work_items")
    .update({ start_date: dates.start_date, due_date: dates.due_date })
    .eq("id", id);
  if (error) {
    if (isMissingColumn(error)) throw new Error(TIMELINE_MISSING_HINT);
    throw new Error(error.message || "Erro ao atualizar as datas do work item.");
  }
}

