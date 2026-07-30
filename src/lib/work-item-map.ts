/**
 * Canonical Work Item shape used by the UI layer.
 *
 * The Supabase schema (00_full_schema.sql) stores work_items in English:
 * title, type, status, priority, assignee_id, position, description.
 * This module isolates that detail so every consumer (board, backlog, sprints,
 * details panel) reads a single predictable shape.
 */

export interface WorkItem {
  id: string;
  projectId: string;
  /** Não existe coluna item_key no schema real — sempre null (UI usa fallback). */
  itemKey: string | null;
  title: string;
  type: string;
  status: string;
  priority: string;
  assignee: string | null;
  description: string | null;
  order: number;
  sprintId: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export type WorkItemPatch = Partial<
  Pick<
    WorkItem,
    | "title"
    | "type"
    | "status"
    | "priority"
    | "assignee"
    | "description"
    | "order"
  >
>;

type AnyRow = { [key: string]: unknown } | null | undefined;

function pickString(row: AnyRow, ...keys: string[]): string {
  if (!row) return "";
  for (const k of keys) {
    const v = row[k];
    if (typeof v === "string" && v.length > 0) return v;
  }
  return "";
}

function pickNullableString(row: AnyRow, ...keys: string[]): string | null {
  if (!row) return null;
  for (const k of keys) {
    const v = row[k];
    if (typeof v === "string") return v;
    if (v === null) return null;
  }
  return null;
}

function pickNumber(row: AnyRow, ...keys: string[]): number {
  if (!row) return 0;
  for (const k of keys) {
    const v = row[k];
    if (typeof v === "number" && Number.isFinite(v)) return v;
    if (typeof v === "string" && v.trim() !== "" && !Number.isNaN(Number(v))) {
      return Number(v);
    }
  }
  return 0;
}

/**
 * Normalize any Supabase `work_items` row (PT or EN columns) into the canonical
 * `WorkItem` shape used by the UI.
 */
export function toWorkItem(raw: unknown): WorkItem {
  const row = (raw ?? {}) as Record<string, unknown>;
  return {
    id: pickString(row, "id"),
    projectId: pickString(row, "project_id", "projectId"),
    itemKey: null,
    title: pickString(row, "title") || "(sem título)",
    type: pickString(row, "type") || "task",
    status: pickString(row, "status") || "A Fazer",
    priority: pickString(row, "priority") || "media",
    assignee: pickNullableString(row, "assignee_id", "assignee"),
    description: pickNullableString(row, "description"),
    order: pickNumber(row, "position", "order"),
    sprintId: pickNullableString(row, "sprint_id", "sprintId"),
    createdAt: (row.created_at as string | undefined) ?? (row.createdAt as string | undefined),
    updatedAt: (row.updated_at as string | undefined) ?? (row.updatedAt as string | undefined),
  };
}

export function toWorkItems(rows: readonly unknown[] | null | undefined): WorkItem[] {
  return (rows ?? []).map((r) => toWorkItem(r as AnyRow));
}

/**
 * Convert a canonical patch back to the PT column names the database expects.
 * Keeps the DB write path unchanged while callers can speak canonical.
 */
export function toWorkItemPatch(patch: WorkItemPatch): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (patch.title !== undefined) out.title = patch.title;
  if (patch.type !== undefined) out.type = patch.type;
  if (patch.status !== undefined) out.status = patch.status;
  if (patch.priority !== undefined) out.priority = patch.priority;
  if (patch.assignee !== undefined) out.assignee_id = patch.assignee;
  if (patch.description !== undefined) out.description = patch.description;
  if (patch.order !== undefined) out.position = patch.order;
  return out;
}
