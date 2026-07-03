import { supabase } from "./supabase";
import { isMissingRelation, logSupabaseError } from "./supabase-errors";

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

export const SEED_PROJECTS: ProjectInput[] = [
  {
    slug: "altech-core",
    nome: "Altech Core",
    status: "Em progresso",
    responsavel: "Ana Silva",
    cliente: "Altech",
    descricao: "Projeto principal do Altech Project. Estrutura visual do MVP.",
    data_inicio: "2026-01-01",
    data_fim: "2026-03-31",
    tenant_id: DEFAULT_TENANT_ID,
  },
  {
    slug: "altech-labs",
    nome: "Altech Labs",
    status: "Planejamento",
    responsavel: "Bruno Costa",
    cliente: "Altech Labs",
    descricao: "Iniciativa de exploração de novas capacidades do Altech Project.",
    data_inicio: "2026-05-01",
    data_fim: "2026-06-15",
    tenant_id: DEFAULT_TENANT_ID,
  },
  {
    slug: "altech-launch",
    nome: "Altech Launch",
    status: "Em progresso",
    responsavel: "Camila Rocha",
    cliente: "Altech",
    descricao: "Preparação do go-to-market da primeira release pública.",
    data_inicio: "2026-03-05",
    data_fim: "2026-04-30",
    tenant_id: DEFAULT_TENANT_ID,
  },
];

function toSlug(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

const SEED_FLAG_KEY = "altech_seed_done";

let seedPromise: Promise<void> | null = null;

export async function ensureSeed(): Promise<void> {
  if (typeof window === "undefined") return;
  if (window.localStorage.getItem(SEED_FLAG_KEY) === "1") return;
  if (seedPromise) return seedPromise;

  seedPromise = (async () => {
    const { count, error: countError } = await supabase
      .from("projects")
      .select("*", { count: "exact", head: true });
    if (countError) {
      if (isMissingRelation(countError)) {
        logSupabaseError("projects-api:ensureSeed", countError);
        // Sem tabela ainda: não tenta inserir; marca flag para não repetir.
        window.localStorage.setItem(SEED_FLAG_KEY, "1");
        return;
      }
      throw countError;
    }
    if ((count ?? 0) > 0) {
      window.localStorage.setItem(SEED_FLAG_KEY, "1");
      return;
    }
    const { error: insertError } = await supabase.from("projects").insert(SEED_PROJECTS);
    if (insertError) throw insertError;
    window.localStorage.setItem(SEED_FLAG_KEY, "1");
  })().catch((err) => {
    seedPromise = null;
    throw err;
  });

  return seedPromise;
}

export async function listProjects(): Promise<ProjectRow[]> {
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .order("created_at", { ascending: true });
  if (error) {
    if (isMissingRelation(error)) {
      logSupabaseError("projects-api:listProjects", error);
      return [];
    }
    throw new Error(error.message || "Erro ao listar projetos.");
  }
  return (data ?? []) as ProjectRow[];
}


export async function createProject(input: ProjectInput): Promise<ProjectRow> {
  const slug = input.slug?.trim() ? toSlug(input.slug) : toSlug(input.nome);
  const payload: ProjectInput = {
    ...input,
    slug,
    tenant_id: input.tenant_id ?? DEFAULT_TENANT_ID,
    status: input.status ?? "Planejamento",
  };
  const { data, error } = await supabase
    .from("projects")
    .insert(payload)
    .select("*")
    .single();
  if (error) throw error;
  return data as ProjectRow;
}

export async function updateProject(
  id: string,
  patch: Partial<ProjectInput>,
): Promise<ProjectRow> {
  const { data, error } = await supabase
    .from("projects")
    .update(patch)
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return data as ProjectRow;
}

export async function getProjectBySlug(slug: string): Promise<ProjectRow | null> {
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw error;
  return (data as ProjectRow | null) ?? null;
}
