import { supabase } from "./supabase";
import { isMissingRelation, logSupabaseError } from "./supabase-errors";
import { statusBucket, BUCKET_LABEL, EPIC_STATUS_BUCKETS, type EpicStatusBucket } from "./epics-api";

/**
 * Releases (public.releases) — mesmo padrão dos demais *-api.ts:
 * leitura direta via @supabase/supabase-js, colunas reais (EN).
 */

export const RELEASE_STATES = ["planned", "in-progress", "released"] as const;
export type ReleaseState = (typeof RELEASE_STATES)[number];

export const RELEASE_STATE_LABEL: Record<ReleaseState, string> = {
  planned: "Planejada",
  "in-progress": "Em andamento",
  released: "Lançada",
};

export const RELEASE_STATE_COLOR: Record<ReleaseState, string> = {
  planned: "var(--backlog)",
  "in-progress": "var(--inprogress)",
  released: "var(--healthy)",
};

export function releaseState(state?: string | null): ReleaseState {
  return (RELEASE_STATES as readonly string[]).includes(state ?? "")
    ? (state as ReleaseState)
    : "planned";
}

export interface ReleaseRow {
  id: string;
  project_id: string;
  version: string;
  name: string | null;
  release_date: string | null;
  state: ReleaseState;
  notes: string | null;
  created_at?: string;
}

export interface ReleaseInput {
  project_id: string;
  version: string;
  name?: string | null;
  release_date?: string | null;
  state?: ReleaseState;
  notes?: string | null;
}

const SELECT =
  "id, project_id, version, name, release_date, state, notes, created_at";

export const RELEASES_MISSING_HINT =
  "Tabela public.releases ainda não existe. Rode supabase/sql/releases.sql no SQL Editor do Supabase.";

/** Mais recente primeiro (por data de release, depois criação). */
export async function listReleases(projectId: string): Promise<ReleaseRow[]> {
  const { data, error } = await supabase
    .from("releases")
    .select(SELECT)
    .eq("project_id", projectId)
    .order("release_date", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });
  if (error) {
    if (isMissingRelation(error)) {
      logSupabaseError("releases-api:listReleases", error);
      throw new Error(RELEASES_MISSING_HINT);
    }
    throw new Error(error.message || "Erro ao listar releases.");
  }
  return (data ?? []) as ReleaseRow[];
}

export async function createRelease(input: ReleaseInput): Promise<ReleaseRow> {
  const payload = {
    project_id: input.project_id,
    version: input.version.trim(),
    name: input.name?.trim() || null,
    release_date: input.release_date || null,
    state: input.state ?? "planned",
    notes: input.notes?.trim() || null,
  };
  const { data, error } = await supabase
    .from("releases")
    .insert(payload)
    .select(SELECT)
    .single();
  if (error) {
    if (isMissingRelation(error)) throw new Error(RELEASES_MISSING_HINT);
    throw new Error(error.message || "Erro ao criar release.");
  }
  return data as ReleaseRow;
}

export async function updateRelease(
  id: string,
  patch: Partial<Omit<ReleaseInput, "project_id">>,
): Promise<ReleaseRow> {
  const { data, error } = await supabase
    .from("releases")
    .update(patch)
    .eq("id", id)
    .select(SELECT)
    .single();
  if (error) throw new Error(error.message || "Erro ao atualizar release.");
  return data as ReleaseRow;
}

export async function deleteRelease(id: string): Promise<void> {
  const { error } = await supabase.from("releases").delete().eq("id", id);
  if (error) throw new Error(error.message || "Erro ao excluir release.");
}

/* ------------------------------------------------------------------ */
/* Issues vinculadas                                                    */
/* ------------------------------------------------------------------ */

export interface ReleaseIssue {
  id: string;
  project_id: string;
  release_id: string | null;
  title: string;
  type: string | null;
  status: string | null;
  priority: string | null;
  assignee_id: string | null;
}

const ISSUE_SELECT =
  "id, project_id, release_id, title, type, status, priority, assignee_id";

export async function listProjectIssuesForReleases(
  projectId: string,
): Promise<ReleaseIssue[]> {
  const { data, error } = await supabase
    .from("work_items")
    .select(ISSUE_SELECT)
    .eq("project_id", projectId)
    .order("created_at", { ascending: true });
  if (error) {
    if (isMissingRelation(error)) {
      logSupabaseError("releases-api:listProjectIssues", error);
      throw new Error(RELEASES_MISSING_HINT);
    }
    throw new Error(error.message || "Erro ao listar issues do projeto.");
  }
  return (data ?? []) as ReleaseIssue[];
}

export async function linkIssueToRelease(
  issueId: string,
  releaseId: string | null,
): Promise<void> {
  const { error } = await supabase
    .from("work_items")
    .update({ release_id: releaseId })
    .eq("id", issueId);
  if (error) throw new Error(error.message || "Erro ao vincular issue à release.");
}

/* ------------------------------------------------------------------ */
/* Agregação                                                            */
/* ------------------------------------------------------------------ */

export { BUCKET_LABEL, EPIC_STATUS_BUCKETS as RELEASE_STATUS_BUCKETS, statusBucket };
export type ReleaseStatusBucket = EpicStatusBucket;

export interface ReleaseStats {
  total: number;
  done: number;
  progress: number;
  byBucket: Record<ReleaseStatusBucket, number>;
}

export function computeReleaseStats(issues: ReleaseIssue[]): ReleaseStats {
  const byBucket = {
    backlog: 0,
    todo: 0,
    "in-progress": 0,
    "in-review": 0,
    done: 0,
  } as Record<ReleaseStatusBucket, number>;
  for (const i of issues) byBucket[statusBucket(i.status)] += 1;
  const total = issues.length;
  const done = byBucket.done;
  return {
    total,
    done,
    progress: total === 0 ? 0 : Math.round((done / total) * 100),
    byBucket,
  };
}

/** Dias restantes até a data da release (negativo = atrasada). */
export function daysUntil(date?: string | null): number | null {
  if (!date) return null;
  const target = new Date(`${date}T00:00:00`);
  if (Number.isNaN(target.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / 86_400_000);
}

export function formatReleaseDate(date?: string | null): string {
  if (!date) return "Sem data";
  const d = new Date(`${date}T00:00:00`);
  if (Number.isNaN(d.getTime())) return "Sem data";
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
}
