import { supabase } from "./supabase";
import { DEFAULT_TENANT_ID } from "./projects-api";
import { isMissingRelation, logSupabaseError } from "./supabase-errors";

export const STATUS_COLUMNS = [
  "A Fazer",
  "Em Progresso",
  "Em Revisão",
  "Concluído",
] as const;
export type WorkItemStatus = (typeof STATUS_COLUMNS)[number];

export const TIPO_OPTIONS = ["Épico", "História", "Tarefa", "Bug"] as const;
export type WorkItemTipo = (typeof TIPO_OPTIONS)[number];

export const PRIORIDADE_OPTIONS = ["Baixa", "Média", "Alta", "Crítica"] as const;
export type WorkItemPrioridade = (typeof PRIORIDADE_OPTIONS)[number];

export interface WorkItemRow {
  id: string;
  project_id: string;
  tenant_id: string | null;
  item_key: string | null;
  titulo: string;
  tipo: string;
  status: string;
  responsavel: string | null;
  descricao: string | null;
  prioridade: string;
  ordem: number;
  sprint_id: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface WorkItemInput {
  project_id: string;
  titulo: string;
  tipo?: string;
  status?: string;
  responsavel?: string | null;
  descricao?: string | null;
  prioridade?: string;
  ordem?: number;
  sprint_id?: string | null;
  item_key?: string | null;
  tenant_id?: string | null;
}

const SELECT = "id, project_id, tenant_id, item_key, titulo, tipo, status, responsavel, descricao, prioridade, ordem, sprint_id, created_at, updated_at";

async function resolveProjectUuid(projectRef: string): Promise<string> {
  // Accept either uuid or slug
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(projectRef);
  if (isUuid) return projectRef;
  const { data, error } = await supabase
    .from("projects")
    .select("id")
    .eq("slug", projectRef)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error(`Projeto “${projectRef}” não encontrado.`);
  return data.id as string;
}

export async function listWorkItemsByProject(projectRef: string): Promise<WorkItemRow[]> {
  const projectId = await resolveProjectUuid(projectRef);
  const { data, error } = await supabase
    .from("work_items")
    .select(SELECT)
    .eq("project_id", projectId)
    .order("ordem", { ascending: true })
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
  const projectId = await resolveProjectUuid(input.project_id);
  // Compute next ordem for this project
  const { data: last, error: lastErr } = await supabase
    .from("work_items")
    .select("ordem")
    .eq("project_id", projectId)
    .order("ordem", { ascending: false })
    .limit(1);
  if (lastErr) throw lastErr;
  const nextOrdem =
    input.ordem ?? ((last?.[0]?.ordem as number | undefined) ?? 0) + 1;

  const payload = {
    project_id: projectId,
    tenant_id: input.tenant_id ?? DEFAULT_TENANT_ID,
    item_key: input.item_key ?? null,
    titulo: input.titulo.trim(),
    tipo: input.tipo ?? "Tarefa",
    status: input.status ?? "A Fazer",
    responsavel: input.responsavel ?? null,
    descricao: input.descricao ?? null,
    prioridade: input.prioridade ?? "Média",
    sprint_id: input.sprint_id ?? null,
    ordem: nextOrdem,
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
  patch: Partial<Omit<WorkItemInput, "project_id">> & { status?: string; ordem?: number },
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
