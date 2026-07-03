import { supabase } from "./supabase";
import { DEFAULT_TENANT_ID } from "./projects-api";
import { DEFAULT_SPRINT_STATUS } from "./sprint-status";
import { isMissingRelation, logSupabaseError } from "./supabase-errors";

export { SPRINT_STATUS, type SprintStatus } from "./sprint-status";

export interface SprintRow {
  id: string;
  project_id: string;
  tenant_id: string | null;
  nome: string;
  meta: string | null;
  data_inicio: string | null;
  data_fim: string | null;
  status: string;
  created_at?: string;
  updated_at?: string;
}

export interface SprintInput {
  project_id: string;
  nome: string;
  meta?: string | null;
  data_inicio?: string | null;
  data_fim?: string | null;
  status?: string;
  tenant_id?: string | null;
}

const SELECT =
  "id, project_id, tenant_id, nome, meta, data_inicio, data_fim, status, created_at, updated_at";

export async function listSprints(): Promise<SprintRow[]> {
  const { data, error } = await supabase
    .from("sprints")
    .select(SELECT)
    .order("created_at", { ascending: false });
  if (error) {
    if (isMissingRelation(error)) {
      logSupabaseError("sprints-api:listSprints", error);
      return [];
    }
    throw new Error(error.message || "Erro ao listar sprints.");
  }
  return (data ?? []) as SprintRow[];
}

export async function listSprintsByProject(projectId: string): Promise<SprintRow[]> {
  const { data, error } = await supabase
    .from("sprints")
    .select(SELECT)
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });
  if (error) {
    if (isMissingRelation(error)) {
      logSupabaseError("sprints-api:listSprintsByProject", error);
      return [];
    }
    throw new Error(error.message || "Erro ao listar sprints do projeto.");
  }
  return (data ?? []) as SprintRow[];
}


export async function createSprint(input: SprintInput): Promise<SprintRow> {
  const payload = {
    project_id: input.project_id,
    tenant_id: input.tenant_id ?? DEFAULT_TENANT_ID,
    nome: input.nome.trim(),
    meta: input.meta?.trim() || null,
    data_inicio: input.data_inicio || null,
    data_fim: input.data_fim || null,
    status: input.status ?? DEFAULT_SPRINT_STATUS,
  };
  const { data, error } = await supabase
    .from("sprints")
    .insert(payload)
    .select(SELECT)
    .single();
  if (error) throw error;
  return data as SprintRow;
}

export async function updateSprint(
  id: string,
  patch: Partial<Omit<SprintInput, "project_id">>,
): Promise<SprintRow> {
  const { data, error } = await supabase
    .from("sprints")
    .update(patch)
    .eq("id", id)
    .select(SELECT)
    .single();
  if (error) throw error;
  return data as SprintRow;
}

export async function deleteSprint(id: string): Promise<void> {
  const { error } = await supabase.from("sprints").delete().eq("id", id);
  if (error) throw error;
}

export interface SprintItemRow {
  id: string;
  item_key: string | null;
  titulo: string;
  status: string;
  tipo: string;
  responsavel: string | null;
  project_id: string;
  sprint_id: string | null;
}

const ITEM_SELECT =
  "id, item_key, titulo, status, tipo, responsavel, project_id, sprint_id";

export async function listItemsBySprint(sprintId: string): Promise<SprintItemRow[]> {
  const { data, error } = await supabase
    .from("work_items")
    .select(ITEM_SELECT)
    .eq("sprint_id", sprintId)
    .order("ordem", { ascending: true });
  if (error) throw error;
  return (data ?? []) as SprintItemRow[];
}

export async function listUnassignedItems(projectId: string): Promise<SprintItemRow[]> {
  const { data, error } = await supabase
    .from("work_items")
    .select(ITEM_SELECT)
    .eq("project_id", projectId)
    .is("sprint_id", null)
    .order("ordem", { ascending: true });
  if (error) throw error;
  return (data ?? []) as SprintItemRow[];
}

export async function setItemSprint(
  itemId: string,
  sprintId: string | null,
): Promise<void> {
  const { error } = await supabase
    .from("work_items")
    .update({ sprint_id: sprintId })
    .eq("id", itemId);
  if (error) throw error;
}

const DONE = new Set(["concluído", "concluido", "done", "completed", "closed"]);
export function isDoneStatus(s: string | null | undefined): boolean {
  return !!s && DONE.has(s.toLowerCase());
}
