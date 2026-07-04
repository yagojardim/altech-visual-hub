import { supabase } from "./supabase";
import { listTeamMembers, type TeamMember } from "./team-members-api";

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
  epic:    { label: "Épico",     badge: "bg-purple-500/15 text-purple-300 border-purple-500/30", dot: "bg-purple-400" },
  feature: { label: "Feature",   badge: "bg-blue-500/15 text-blue-300 border-blue-500/30",       dot: "bg-blue-400" },
  story:   { label: "História",  badge: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30", dot: "bg-emerald-400" },
  task:    { label: "Tarefa",    badge: "bg-slate-500/15 text-slate-200 border-slate-500/30",    dot: "bg-slate-400" },
  subtask: { label: "Subtarefa", badge: "bg-slate-500/10 text-slate-300 border-slate-500/20",    dot: "bg-slate-500" },
  bug:     { label: "Bug",       badge: "bg-red-500/15 text-red-300 border-red-500/30",          dot: "bg-red-400" },
  risk:    { label: "Risco",     badge: "bg-amber-500/15 text-amber-300 border-amber-500/30",    dot: "bg-amber-400" },
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
  position: number | null;
  created_at?: string;
}

const FULL_SELECT =
  "id, project_id, board_id, column_id, title, description, type, priority, status, assignee_id, parent_id, acceptance_criteria, due_date, progress, severity, probability, impact, mitigation_plan, position, created_at";

export async function fetchWorkItem(id: string): Promise<WorkItemFull | null> {
  const { data, error } = await supabase
    .from("work_items")
    .select(FULL_SELECT)
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return (data as WorkItemFull | null) ?? null;
}

export async function patchWorkItem(
  id: string,
  patch: Partial<WorkItemFull>,
): Promise<WorkItemFull> {
  const { data, error } = await supabase
    .from("work_items")
    .update(patch)
    .eq("id", id)
    .select(FULL_SELECT)
    .single();
  if (error) throw error;
  return data as WorkItemFull;
}

export async function listChildren(parentId: string): Promise<WorkItemFull[]> {
  const { data, error } = await supabase
    .from("work_items")
    .select(FULL_SELECT)
    .eq("parent_id", parentId)
    .order("position", { ascending: true });
  if (error) throw error;
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
    .select("id, relation_type, target:work_items!work_item_relations_target_id_fkey(id, title, type)")
    .eq("source_id", itemId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as RelationRow[];
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
