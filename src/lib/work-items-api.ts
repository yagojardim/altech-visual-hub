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
