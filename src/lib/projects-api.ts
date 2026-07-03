import { supabase } from "./supabase";
import { isMissingRelation, logSupabaseError } from "./supabase-errors";

// DB row (schema real em public.projects)
interface ProjectDBRow {
  id: string;
  slug: string;
  name: string;
  status: "planejamento" | "em_progresso" | "concluido" | "arquivado";
  description: string | null;
  team: string | null;
  owner: string | null;
  start_date: string | null;
  end_date: string | null;
  created_at?: string;
}

// Shape exposto ao restante do app (mantido em PT-BR por compatibilidade visual)
export interface ProjectRow {
  id: string;
  slug: string;
  nome: string;
  status: string;
  responsavel: string | null;
  cliente: string | null;
  descricao: string | null;
  data_inicio: string | null;
  data_fim: string | null;
  tenant_id: string | null;
  created_at?: string;
}

export interface ProjectInput {
  slug: string;
  nome: string;
  status?: string;
  responsavel?: string | null;
  cliente?: string | null;
  descricao?: string | null;
  data_inicio?: string | null;
  data_fim?: string | null;
  tenant_id?: string | null;
}

export const DEFAULT_TENANT_ID = "00000000-0000-0000-0000-000000000001";

const STATUS_TO_DB: Record<string, ProjectDBRow["status"]> = {
  "Planejamento": "planejamento",
  "Em progresso": "em_progresso",
  "Pausado": "arquivado",
  "Concluído": "concluido",
  "Concluido": "concluido",
  "Arquivado": "arquivado",
};

const STATUS_FROM_DB: Record<ProjectDBRow["status"], string> = {
  planejamento: "Planejamento",
  em_progresso: "Em progresso",
  concluido: "Concluído",
  arquivado: "Arquivado",
};

function toDbStatus(status?: string | null): ProjectDBRow["status"] {
  if (!status) return "planejamento";
  return STATUS_TO_DB[status] ?? "planejamento";
}

function fromDb(row: ProjectDBRow): ProjectRow {
  return {
    id: row.id,
    slug: row.slug,
    nome: row.name,
    status: STATUS_FROM_DB[row.status] ?? row.status,
    responsavel: row.owner,
    cliente: row.team,
    descricao: row.description,
    data_inicio: row.start_date,
    data_fim: row.end_date,
    tenant_id: DEFAULT_TENANT_ID,
    created_at: row.created_at,
  };
}

function toDbPayload(input: Partial<ProjectInput>): Partial<ProjectDBRow> {
  const payload: Partial<ProjectDBRow> = {};
  if (input.slug !== undefined) payload.slug = input.slug;
  if (input.nome !== undefined) payload.name = input.nome;
  if (input.status !== undefined) payload.status = toDbStatus(input.status);
  if (input.responsavel !== undefined) payload.owner = input.responsavel;
  if (input.cliente !== undefined) payload.team = input.cliente;
  if (input.descricao !== undefined) payload.description = input.descricao;
  if (input.data_inicio !== undefined) payload.start_date = input.data_inicio;
  if (input.data_fim !== undefined) payload.end_date = input.data_fim;
  return payload;
}

function toSlug(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

// Seed agora vive na migration SQL; mantemos no-op para compatibilidade.
export async function ensureSeed(): Promise<void> {
  return;
}

export async function listProjects(): Promise<ProjectRow[]> {
  const { data, error } = await supabase
    .from("projects")
    .select("id, slug, name, status, description, team, owner, start_date, end_date, created_at")
    .order("created_at", { ascending: true });
  if (error) {
    if (isMissingRelation(error)) {
      logSupabaseError("projects-api:listProjects", error);
      return [];
    }
    throw new Error(error.message || "Erro ao listar projetos.");
  }
  return (data ?? []).map((r) => fromDb(r as ProjectDBRow));
}

export async function createProject(input: ProjectInput): Promise<ProjectRow> {
  const slug = input.slug?.trim() ? toSlug(input.slug) : toSlug(input.nome);
  const payload = {
    ...toDbPayload({ ...input, slug }),
    id: slug,
    status: toDbStatus(input.status ?? "Planejamento"),
    name: input.nome,
    slug,
  } satisfies Partial<ProjectDBRow>;
  const { data, error } = await supabase
    .from("projects")
    .insert(payload)
    .select("id, slug, name, status, description, team, owner, start_date, end_date, created_at")
    .single();
  if (error) throw error;
  return fromDb(data as ProjectDBRow);
}

export async function updateProject(
  id: string,
  patch: Partial<ProjectInput>,
): Promise<ProjectRow> {
  const { data, error } = await supabase
    .from("projects")
    .update(toDbPayload(patch))
    .eq("id", id)
    .select("id, slug, name, status, description, team, owner, start_date, end_date, created_at")
    .single();
  if (error) throw error;
  return fromDb(data as ProjectDBRow);
}

export async function deleteProject(id: string): Promise<void> {
  const { error } = await supabase.from("projects").delete().eq("id", id);
  if (error) throw error;
}

export async function getProjectBySlug(slug: string): Promise<ProjectRow | null> {
  const { data, error } = await supabase
    .from("projects")
    .select("id, slug, name, status, description, team, owner, start_date, end_date, created_at")
    .eq("slug", slug)
    .maybeSingle();
  if (error) {
    if (isMissingRelation(error)) {
      logSupabaseError("projects-api:getProjectBySlug", error);
      return null;
    }
    throw new Error(error.message || "Erro ao buscar projeto.");
  }
  return data ? fromDb(data as ProjectDBRow) : null;
}
