/**
 * Canonical Work Item shape used by the UI layer.
 *
 * The Supabase schema still stores columns in Portuguese (titulo, tipo, status,
 * prioridade, responsavel, ordem, descricao). This module isolates that detail
 * so every consumer (board, backlog, sprints, details panel) can read a single
 * predictable shape and never touch raw PT/EN column names directly.
 *
 * `toWorkItem` reads *both* PT and EN column names with a safe fallback so
 * either schema variant produces a fully populated canonical object — never an
 * `undefined` field being rendered as a stale placeholder.
 *
 * `toWorkItemPatch` converts a canonical patch back to the PT column names the
 * database currently expects, so `updateWorkItem` can continue to receive the
 * same payload shape without any schema migration.
 */

export interface WorkItem {
  id: string;
  projectId: string;
  tenantId: string | null;
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
    | "sprintId"
    | "itemKey"
  >
>;

type AnyRow = Record<string, unknown> | Record<string, never> | null | undefined | object;

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
export function toWorkItem(raw: AnyRow): WorkItem {
  const row = (raw ?? {}) as Record<string, unknown>;
  return {
    id: pickString(row, "id"),
    projectId: pickString(row, "project_id", "projectId"),
    tenantId: pickNullableString(row, "tenant_id", "tenantId"),
    itemKey: pickNullableString(row, "item_key", "itemKey"),
    title: pickString(row, "titulo", "title") || "(sem título)",
    type: pickString(row, "tipo", "type") || "Tarefa",
    status: pickString(row, "status") || "A Fazer",
    priority: pickString(row, "prioridade", "priority") || "Média",
    assignee: pickNullableString(row, "responsavel", "assignee"),
    description: pickNullableString(row, "descricao", "description"),
    order: pickNumber(row, "ordem", "order"),
    sprintId: pickNullableString(row, "sprint_id", "sprintId"),
    createdAt: (row.created_at as string | undefined) ?? (row.createdAt as string | undefined),
    updatedAt: (row.updated_at as string | undefined) ?? (row.updatedAt as string | undefined),
  };
}

export function toWorkItems(rows: AnyRow[] | null | undefined): WorkItem[] {
  return (rows ?? []).map((r) => toWorkItem(r));
}

/**
 * Convert a canonical patch back to the PT column names the database expects.
 * Keeps the DB write path unchanged while callers can speak canonical.
 */
export function toWorkItemPatch(patch: WorkItemPatch): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (patch.title !== undefined) out.titulo = patch.title;
  if (patch.type !== undefined) out.tipo = patch.type;
  if (patch.status !== undefined) out.status = patch.status;
  if (patch.priority !== undefined) out.prioridade = patch.priority;
  if (patch.assignee !== undefined) out.responsavel = patch.assignee;
  if (patch.description !== undefined) out.descricao = patch.description;
  if (patch.order !== undefined) out.ordem = patch.order;
  if (patch.sprintId !== undefined) out.sprint_id = patch.sprintId;
  if (patch.itemKey !== undefined) out.item_key = patch.itemKey;
  return out;
}
