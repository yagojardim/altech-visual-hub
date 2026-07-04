import { supabase } from "./supabase";
import { DEFAULT_SPRINT_STATUS } from "./sprint-status";
import { isMissingRelation, logSupabaseError } from "./supabase-errors";

export { SPRINT_STATUS, type SprintStatus } from "./sprint-status";

// Real DB row in public.sprints
// Colunas: id, project_id (text = slug do projeto), name, goal,
// status, start_date, end_date, created_at.
interface SprintDBRow {
  id: string;
  project_id: string;
  name: string;
  goal: string | null;
  status: string;
  start_date: string | null;
  end_date: string | null;
  created_at?: string;
}

// Shape exposto para o restante do app (mantido em PT-BR por compatibilidade
// visual com componentes/rotas já existentes). Sem tenant_id/updated_at porque
// o banco atual não tem essas colunas.
export interface SprintRow {
  id: string;
  project_id: string; // slug do projeto (texto)
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
  project_id: string; // slug do projeto
  nome: string;
  meta?: string | null;
  data_inicio?: string | null;
  data_fim?: string | null;
  status?: string;
  tenant_id?: string | null;
}

const SELECT = "id, project_id, name, goal, status, start_date, end_date, created_at";

function fromDB(row: SprintDBRow): SprintRow {
  return {
    id: row.id,
    project_id: row.project_id,
    tenant_id: null,
    nome: row.name,
    meta: row.goal,
    data_inicio: row.start_date,
    data_fim: row.end_date,
    status: row.status,
    created_at: row.created_at,
    updated_at: undefined,
  };
}

function toDBInsert(input: SprintInput): Omit<SprintDBRow, "id" | "created_at"> {
  return {
    project_id: input.project_id,
    name: input.nome.trim(),
    goal: input.meta?.trim() ?? null,
    status: input.status ?? DEFAULT_SPRINT_STATUS,
    start_date: input.data_inicio ?? null,
    end_date: input.data_fim ?? null,
  };
}

function toDBUpdate(patch: Partial<Omit<SprintInput, "project_id">>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (patch.nome !== undefined) out.name = patch.nome;
  if (patch.meta !== undefined) out.goal = patch.meta;
  if (patch.data_inicio !== undefined) out.start_date = patch.data_inicio;
  if (patch.data_fim !== undefined) out.end_date = patch.data_fim;
  if (patch.status !== undefined) out.status = patch.status;
  return out;
}

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
  return (data ?? []).map((r) => fromDB(r as SprintDBRow));
}

export async function listSprintsByProject(projectSlug: string): Promise<SprintRow[]> {
  const { data, error } = await supabase
    .from("sprints")
    .select(SELECT)
    .eq("project_id", projectSlug)
    .order("created_at", { ascending: false });
  if (error) {
    if (isMissingRelation(error)) {
      logSupabaseError("sprints-api:listSprintsByProject", error);
      return [];
    }
    throw new Error(error.message || "Erro ao listar sprints do projeto.");
  }
  return (data ?? []).map((r) => fromDB(r as SprintDBRow));
}

export async function getSprint(id: string): Promise<SprintRow | null> {
  const { data, error } = await supabase
    .from("sprints")
    .select(SELECT)
    .eq("id", id)
    .maybeSingle();
  if (error) {
    if (isMissingRelation(error)) {
      logSupabaseError("sprints-api:getSprint", error);
      return null;
    }
    throw new Error(error.message || "Erro ao carregar sprint.");
  }
  return data ? fromDB(data as SprintDBRow) : null;
}

export async function createSprint(input: SprintInput): Promise<SprintRow> {
  const { data, error } = await supabase
    .from("sprints")
    .insert(toDBInsert(input))
    .select(SELECT)
    .single();
  if (error) throw error;
  return fromDB(data as SprintDBRow);
}

export async function updateSprint(
  id: string,
  patch: Partial<Omit<SprintInput, "project_id">>,
): Promise<SprintRow> {
  const { data, error } = await supabase
    .from("sprints")
    .update(toDBUpdate(patch))
    .eq("id", id)
    .select(SELECT)
    .single();
  if (error) throw error;
  return fromDB(data as SprintDBRow);
}

export async function deleteSprint(id: string): Promise<void> {
  const { error } = await supabase.from("sprints").delete().eq("id", id);
  if (error) throw error;
}

// -------- Sprint items (link table sprint_items → work_items) --------

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

// work_items real: id, project_id, title, type, status, priority, assignee_id, position, ...
interface WorkItemDBRow {
  id: string;
  project_id: string;
  title: string | null;
  type: string | null;
  status: string | null;
  assignee_id: string | null;
}

const WORK_ITEM_SELECT = "id, project_id, title, type, status, assignee_id, position";

function toSprintItem(raw: WorkItemDBRow, sprintId: string | null): SprintItemRow {
  return {
    id: raw.id,
    item_key: null,
    titulo: raw.title ?? "(sem título)",
    tipo: raw.type ?? "task",
    status: raw.status ?? "Backlog",
    responsavel: raw.assignee_id,
    project_id: raw.project_id,
    sprint_id: sprintId,
  };
}

export async function listItemsBySprint(sprintId: string): Promise<SprintItemRow[]> {
  const { data, error } = await supabase
    .from("sprint_items")
    .select(`work_item_id, work_items(${WORK_ITEM_SELECT})`)
    .eq("sprint_id", sprintId);
  if (error) {
    if (isMissingRelation(error)) {
      logSupabaseError("sprints-api:listItemsBySprint", error);
      return [];
    }
    throw error;
  }
  const rows = (data ?? []) as Array<{ work_items: WorkItemDBRow | WorkItemDBRow[] | null }>;
  return rows.flatMap((r) => {
    const wi = r.work_items;
    if (!wi) return [];
    const arr = Array.isArray(wi) ? wi : [wi];
    return arr.map((w) => toSprintItem(w, sprintId));
  });
}

export async function listUnassignedItems(projectSlug: string): Promise<SprintItemRow[]> {
  // Ids já vinculados a alguma sprint
  const linked = await supabase.from("sprint_items").select("work_item_id");
  if (linked.error) {
    if (isMissingRelation(linked.error)) {
      logSupabaseError("sprints-api:listUnassignedItems:linked", linked.error);
    } else {
      throw linked.error;
    }
  }
  const linkedIds = new Set((linked.data ?? []).map((r) => r.work_item_id as string));

  let query = supabase
    .from("work_items")
    .select(WORK_ITEM_SELECT)
    .eq("project_id", projectSlug)
    .order("position", { ascending: true });

  if (linkedIds.size > 0) {
    query = query.not("id", "in", `(${Array.from(linkedIds).join(",")})`);
  }

  const { data, error } = await query;
  if (error) {
    if (isMissingRelation(error)) {
      logSupabaseError("sprints-api:listUnassignedItems", error);
      return [];
    }
    throw error;
  }
  return (data ?? []).map((r) => toSprintItem(r as WorkItemDBRow, null));
}

export async function setItemSprint(
  itemId: string,
  sprintId: string | null,
): Promise<void> {
  if (sprintId === null) {
    const { error } = await supabase.from("sprint_items").delete().eq("work_item_id", itemId);
    if (error) throw error;
    return;
  }
  // remove vínculo anterior e cria o novo (link table sem PK única em work_item_id)
  const del = await supabase.from("sprint_items").delete().eq("work_item_id", itemId);
  if (del.error) throw del.error;
  const ins = await supabase.from("sprint_items").insert({ sprint_id: sprintId, work_item_id: itemId });
  if (ins.error) throw ins.error;
}

const DONE = new Set([
  "concluído",
  "concluido",
  "done",
  "completed",
  "closed",
  "concluída",
  "concluida",
]);
export function isDoneStatus(s: string | null | undefined): boolean {
  return !!s && DONE.has(s.toLowerCase());
}
