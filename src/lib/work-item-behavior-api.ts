import { supabase } from "./supabase";
import { listTeamMembers, type TeamMember } from "./team-members-api";
import { TYPE_BADGE_CLASS, TYPE_DOT_CLASS } from "./work-item-type-classes";

export const WORK_ITEM_TYPES = [
  "epic",
  "feature",
  "story",
  "task",
  "subtask",
  "bug",
  "risk",
] as const;
export type WorkItemType = (typeof WORK_ITEM_TYPES)[number];

export const TYPE_META: Record<
  WorkItemType,
  { label: string; badge: string; dot: string }
> = {
  epic:    { label: "Épico",     badge: TYPE_BADGE_CLASS.epic, dot: TYPE_DOT_CLASS.epic },
  feature: { label: "Feature",   badge: TYPE_BADGE_CLASS.feature, dot: TYPE_DOT_CLASS.feature },
  story:   { label: "História",  badge: TYPE_BADGE_CLASS.story, dot: TYPE_DOT_CLASS.story },
  task:    { label: "Tarefa",    badge: TYPE_BADGE_CLASS.task, dot: TYPE_DOT_CLASS.task },
  subtask: { label: "Subtarefa", badge: TYPE_BADGE_CLASS.subtask, dot: TYPE_DOT_CLASS.subtask },
  bug:     { label: "Bug",       badge: TYPE_BADGE_CLASS.bug, dot: TYPE_DOT_CLASS.bug },
  risk:    { label: "Risco",     badge: TYPE_BADGE_CLASS.risk, dot: TYPE_DOT_CLASS.risk },
};

export function typeMeta(t?: string | null) {
  const k = (t ?? "task") as WorkItemType;
  return TYPE_META[k] ?? TYPE_META.task;
}

export const RELATION_TYPES = [
  "blocks",
  "relates_to",
  "duplicates",
  "caused_by",
  "mitigates",
] as const;
export type RelationType = (typeof RELATION_TYPES)[number];

export const RELATION_LABEL: Record<RelationType, string> = {
  blocks: "bloqueia",
  relates_to: "relaciona-se com",
  duplicates: "duplica",
  caused_by: "causado por",
  mitigates: "mitiga",
};

export interface WorkItemFull {
  id: string;
  project_id: string;
  board_id: string | null;
  column_id: string | null;
  title: string;
  description: string | null;
  type: WorkItemType;
  priority: string;
  status: string | null;
  assignee_id: string | null;
  parent_id: string | null;
  acceptance_criteria: string | null;
  due_date: string | null;
  progress: number | null;
  severity: string | null;
  probability: string | null;
  impact: string | null;
  mitigation_plan: string | null;
  mitigation?: string | null;
  position: number | null;
  created_at?: string;
  /** Preserved so the UI can detect which optional columns exist in the row. */
  [key: string]: unknown;
}

/** Normalize Supabase / arbitrary errors to a real Error with a useful message. */
function toError(e: unknown, fallback = "Erro inesperado"): Error {
  if (e instanceof Error) return e;
  if (e && typeof e === "object") {
    const obj = e as { message?: unknown; hint?: unknown; details?: unknown; code?: unknown };
    const msg =
      (typeof obj.message === "string" && obj.message) ||
      (typeof obj.details === "string" && obj.details) ||
      (typeof obj.hint === "string" && obj.hint) ||
      (typeof obj.code === "string" && `Erro ${obj.code}`) ||
      fallback;
    return new Error(String(msg));
  }
  return new Error(typeof e === "string" ? e : fallback);
}

/** Read every real column that exists — avoids listing non-existent ones. */
const FULL_SELECT = "*";

export async function fetchWorkItem(id: string): Promise<WorkItemFull | null> {
  const { data, error } = await supabase
    .from("work_items")
    .select(FULL_SELECT)
    .eq("id", id)
    .maybeSingle();
  if (error) throw toError(error, "Erro ao carregar work item.");
  return (data as WorkItemFull | null) ?? null;
}

/** Match Postgres "column X does not exist" errors. */
function missingColumn(err: unknown): string | null {
  const obj = err as { code?: string; message?: string } | null;
  if (!obj) return null;
  const msg = obj.message ?? "";
  if (obj.code === "42703" || /column .* does not exist/i.test(msg)) {
    const m = msg.match(/column\s+(?:\S+\.)?"?([a-z0-9_]+)"?/i);
    return m?.[1] ?? "unknown";
  }
  return null;
}

export async function patchWorkItem(
  id: string,
  patch: Partial<WorkItemFull>,
): Promise<WorkItemFull> {
  // Mirror alternate schema: some DBs have "mitigation", others "mitigation_plan".
  const payload: Record<string, unknown> = { ...patch };
  if ("mitigation_plan" in payload && !("mitigation" in payload)) {
    payload.mitigation = payload.mitigation_plan;
  }

  let attempt: Record<string, unknown> = { ...payload };
  for (let i = 0; i < 4; i++) {
    const { data, error } = await supabase
      .from("work_items")
      .update(attempt)
      .eq("id", id)
      .select(FULL_SELECT)
      .single();
    if (!error) return data as WorkItemFull;
    const missing = missingColumn(error);
    if (missing && missing in attempt) {
      const next = { ...attempt };
      delete next[missing];
      attempt = next;
      continue;
    }
    throw toError(error, "Erro ao salvar work item.");
  }
  throw new Error("Erro ao salvar work item.");
}

export async function listChildren(parentId: string): Promise<WorkItemFull[]> {
  const { data, error } = await supabase
    .from("work_items")
    .select(FULL_SELECT)
    .eq("parent_id", parentId)
    .order("position", { ascending: true });
  if (error) throw toError(error, "Erro ao carregar itens filhos.");
  return (data ?? []) as WorkItemFull[];
}

export async function listProjectItems(
  projectId: string,
  excludeId?: string,
): Promise<Pick<WorkItemFull, "id" | "title" | "type">[]> {
  const { data, error } = await supabase
    .from("work_items")
    .select("id, title, type")
    .eq("project_id", projectId)
    .order("title", { ascending: true });
  if (error) throw error;
  const rows = (data ?? []) as Pick<WorkItemFull, "id" | "title" | "type">[];
  return excludeId ? rows.filter((r) => r.id !== excludeId) : rows;
}

export async function listProjectAssignees(projectId: string): Promise<TeamMember[]> {
  const { data, error } = await supabase
    .from("project_members")
    .select("member:team_members(id, name, email, role, avatar_color, created_at)")
    .eq("project_id", projectId);
  if (error) throw error;
  const rows = (data ?? []) as Array<{ member: TeamMember | TeamMember[] | null }>;
  const members: TeamMember[] = rows.flatMap((r) => {
    if (!r.member) return [];
    return Array.isArray(r.member) ? (r.member as TeamMember[]) : [r.member];
  });
  if (members.length > 0) return members;
  // Fallback: any team member (dev-friendly)
  try {
    return await listTeamMembers();
  } catch {
    return [];
  }
}

export interface RelationRow {
  id: string;
  relation_type: RelationType;
  target: { id: string; title: string; type: WorkItemType } | null;
}

export async function listRelations(itemId: string): Promise<RelationRow[]> {
  const { data, error } = await supabase
    .from("work_item_relations")
    .select("id, relation_type, target_id")
    .eq("source_id", itemId)
    .order("created_at", { ascending: false });
  if (error) {
    // Table may not exist yet in this environment — degrade gracefully.
    console.warn("[work-item-behavior] relations:", (error as { message?: string }).message);
    return [];
  }
  const rows = (data ?? []) as Array<{ id: string; relation_type: RelationType; target_id: string }>;
  if (rows.length === 0) return [];
  const targetIds = Array.from(new Set(rows.map((r) => r.target_id)));
  const { data: targets, error: tErr } = await supabase
    .from("work_items")
    .select("id, title, type")
    .in("id", targetIds);
  if (tErr) throw toError(tErr, "Erro ao carregar relações.");
  const byId = new Map(
    ((targets ?? []) as Array<{ id: string; title: string; type: WorkItemType }>).map((t) => [
      t.id,
      t,
    ]),
  );
  return rows.map((r) => ({
    id: r.id,
    relation_type: r.relation_type,
    target: byId.get(r.target_id) ?? null,
  }));
}


export async function addRelation(
  sourceId: string,
  targetId: string,
  relationType: RelationType,
): Promise<void> {
  const { error } = await supabase
    .from("work_item_relations")
    .insert({ source_id: sourceId, target_id: targetId, relation_type: relationType });
  if (error) throw error;
}

export async function removeRelation(id: string): Promise<void> {
  const { error } = await supabase.from("work_item_relations").delete().eq("id", id);
  if (error) throw error;
}

export interface AuditRow {
  id: string;
  event: string;
  actor_name: string | null;
  before: unknown;
  after: unknown;
  created_at: string;
}

export async function listItemHistory(itemId: string): Promise<AuditRow[]> {
  const { data, error } = await supabase
    .from("audit_log")
    .select("id, event, actor_name, before, after, created_at")
    .eq("entity_type", "work_item")
    .eq("entity_id", itemId)
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) {
    console.warn("[work-item-behavior] history:", error.message);
    return [];
  }
  return (data ?? []) as AuditRow[];
}
