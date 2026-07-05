/**
 * Altech Project — Dashboard metrics service.
 *
 * Consulta o Supabase existente (@supabase/supabase-js) e expõe métricas
 * reutilizáveis para o Dashboard, sempre filtradas por tenant e pelos
 * projetos vinculados ao usuário via `project_members`.
 *
 * Sem UI. Sem Lovable Cloud. Nomes de coluna reais (EN quando existirem).
 *
 * Colunas relevantes em `work_items` (schema atual):
 *   id, project_id, tenant_id, title|titulo, type|tipo, priority|prioridade,
 *   status, assignee_id, parent_id, due_date, acceptance_criteria,
 *   sprint_id, created_at, updated_at
 */
import { supabase } from "@/lib/supabase";
import { toWorkItems, type WorkItem } from "@/lib/work-item-map";

// ------------------------- Tipos públicos -------------------------

export interface DashboardScope {
  /** tenant atual (sempre obrigatório). */
  tenantId: string;
  /**
   * Se fornecido, restringe aos projetos vinculados a este membro em
   * `project_members`. Se ausente, considera todos os projetos do tenant.
   */
  memberId?: string | null;
  /** Se fornecido, filtra "meus itens" por este `assignee_id`. */
  assigneeId?: string | null;
}

export interface StatusBucket {
  status: string;
  count: number;
}

export interface SprintProgress {
  sprintId: string | null;
  sprintName: string | null;
  planned: number;
  done: number;
  percent: number; // 0..100
}

export interface DashboardMetrics {
  dueToday: WorkItem[];
  overdue: WorkItem[];
  blocked: WorkItem[];
  myItems: WorkItem[];
  byStatus: StatusBucket[];
  activeSprint: SprintProgress | null;
  criticalBugs: WorkItem[];
  storiesMissingAcceptance: WorkItem[];
  /** Itens sem responsável (assignee_id null). */
  unassigned: WorkItem[];
  /** Itens sem prioridade definida. */
  missingPriority: WorkItem[];
  /** Histórias/épicos/features prontos para entrar em sprint. */
  readyForSprint: WorkItem[];
  /** Itens aguardando validação (review/QA/validação). */
  awaitingValidation: WorkItem[];
  /** Itens vinculados à sprint ativa. */
  activeSprintItems: WorkItem[];
  /** projetos considerados no escopo (após tenant + project_members). */
  projectIds: string[];
  /** total de work items lidos no escopo (base das agregações). */
  totalItems: number;
}

// ------------------------- Helpers internos -------------------------

const DONE_STATUSES = new Set([
  "done",
  "concluido",
  "concluído",
  "completed",
  "closed",
  "resolved",
]);

const BLOCKED_STATUSES = new Set([
  "bloqueado",
  "blocked",
  "impedido",
]);

const READY_STATUSES = new Set([
  "pronto",
  "pronta",
  "pronto para sprint",
  "pronta para sprint",
  "ready",
  "ready for sprint",
  "refinado",
  "refinada",
]);

const REVIEW_STATUSES = new Set([
  "em validação",
  "em validacao",
  "validação",
  "validacao",
  "aguardando validação",
  "aguardando validacao",
  "review",
  "code review",
  "em revisão",
  "em revisao",
  "qa",
  "em qa",
  "testing",
  "em teste",
]);

const CRITICAL_PRIORITIES = new Set(["critica", "crítica", "critical"]);
const EMPTY_PRIORITIES = new Set(["", "sem prioridade", "none", "nenhuma", "-"]);
const VALUE_TYPES = new Set(["story", "epic", "feature", "história", "historia", "épico", "epico"]);

function isDone(status?: string | null): boolean {
  return !!status && DONE_STATUSES.has(status.toLowerCase());
}

function isBlocked(status?: string | null): boolean {
  return !!status && BLOCKED_STATUSES.has(status.toLowerCase());
}

function isReady(status?: string | null): boolean {
  return !!status && READY_STATUSES.has(status.toLowerCase());
}

function isReview(status?: string | null): boolean {
  return !!status && REVIEW_STATUSES.has(status.toLowerCase());
}

function isCritical(priority?: string | null): boolean {
  return !!priority && CRITICAL_PRIORITIES.has(priority.toLowerCase());
}

function hasPriority(priority?: string | null): boolean {
  if (!priority) return false;
  return !EMPTY_PRIORITIES.has(priority.toLowerCase().trim());
}

function isValueType(type?: string | null): boolean {
  return !!type && VALUE_TYPES.has(type.toLowerCase());
}

/** YYYY-MM-DD no fuso local (compatível com coluna `date`). */
function todayISO(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Descobre os project_ids do escopo: tenant + (opcional) project_members. */
async function resolveProjectIds(scope: DashboardScope): Promise<string[]> {
  // Base: todos os projetos do tenant.
  // `projects` não tem tenant_id no schema base — usamos `work_items.tenant_id`
  // para descobrir projetos relevantes.
  const { data: tenantProjects, error: tpErr } = await supabase
    .from("work_items")
    .select("project_id")
    .eq("tenant_id", scope.tenantId)
    .not("project_id", "is", null);
  if (tpErr) throw tpErr;

  const tenantSet = new Set<string>(
    ((tenantProjects ?? []) as Array<{ project_id: string | null }>)
      .map((r) => r.project_id)
      .filter((v): v is string => !!v),
  );

  if (!scope.memberId) return Array.from(tenantSet);

  const { data: memberships, error: mErr } = await supabase
    .from("project_members")
    .select("project_id")
    .eq("member_id", scope.memberId);
  if (mErr) throw mErr;

  const memberSet = new Set<string>(
    ((memberships ?? []) as Array<{ project_id: string | null }>)
      .map((r) => r.project_id)
      .filter((v): v is string => !!v),
  );

  // Interseção: só projetos do tenant que o membro participa.
  return Array.from(tenantSet).filter((id) => memberSet.has(id));
}

// ------------------------- API principal -------------------------

/**
 * Carrega todas as métricas do dashboard em uma única passagem.
 * Isolada em erros: qualquer falha propaga como exceção — o consumidor
 * (`useDashboardMetrics`) traduz para estado de erro.
 */
export async function fetchDashboardMetrics(
  scope: DashboardScope,
): Promise<DashboardMetrics> {
  const projectIds = await resolveProjectIds(scope);

  const empty: DashboardMetrics = {
    dueToday: [],
    overdue: [],
    blocked: [],
    myItems: [],
    byStatus: [],
    activeSprint: null,
    criticalBugs: [],
    storiesMissingAcceptance: [],
    unassigned: [],
    missingPriority: [],
    readyForSprint: [],
    awaitingValidation: [],
    activeSprintItems: [],
    projectIds,
    totalItems: 0,
  };

  if (projectIds.length === 0) return empty;

  const today = todayISO();

  // Carrega todo o universo do escopo uma vez para agregações consistentes.
  const { data: rawItems, error: itemsErr } = await supabase
    .from("work_items")
    .select("*")
    .eq("tenant_id", scope.tenantId)
    .in("project_id", projectIds);
  if (itemsErr) throw itemsErr;

  const items = toWorkItems(rawItems ?? []);
  const rawById = new Map<string, Record<string, unknown>>();
  for (const r of (rawItems ?? []) as Array<Record<string, unknown>>) {
    const id = r.id as string | undefined;
    if (id) rawById.set(id, r);
  }

  // -- Sprint ativa (por tenant + projetos do escopo).
  const { data: sprintsRaw, error: sprintsErr } = await supabase
    .from("sprints")
    .select("id, project_id, name, status")
    .in("project_id", projectIds);
  if (sprintsErr) throw sprintsErr;

  const activeSprintRow = ((sprintsRaw ?? []) as Array<{
    id: string;
    project_id: string;
    name: string | null;
    status: string | null;
  }>).find((s) => {
    const st = (s.status ?? "").toLowerCase();
    return (
      st === "ativa" ||
      st === "ativo" ||
      st === "active" ||
      st === "in_progress" ||
      st === "em_progresso" ||
      st === "em andamento" ||
      st === "andamento"
    );
  }) ?? null;

  let activeSprint: SprintProgress | null = null;
  if (activeSprintRow) {
    // Itens da sprint ativa: via work_items.sprint_id OR sprint_items.
    const linkedIds = new Set<string>();
    for (const it of items) if (it.sprintId === activeSprintRow.id) linkedIds.add(it.id);

    const { data: si, error: siErr } = await supabase
      .from("sprint_items")
      .select("work_item_id")
      .eq("sprint_id", activeSprintRow.id);
    if (siErr) throw siErr;
    for (const row of (si ?? []) as Array<{ work_item_id: string }>) {
      linkedIds.add(row.work_item_id);
    }

    const planned = items.filter((it) => linkedIds.has(it.id));
    const done = planned.filter((it) => isDone(it.status)).length;
    const total = planned.length;
    activeSprint = {
      sprintId: activeSprintRow.id,
      sprintName: activeSprintRow.name,
      planned: total,
      done,
      percent: total > 0 ? Math.round((done / total) * 100) : 0,
    };
  }

  // -- Agregações a partir de `items` + raw (para colunas fora do map).
  const dueToday: WorkItem[] = [];
  const overdue: WorkItem[] = [];
  const blocked: WorkItem[] = [];
  const myItems: WorkItem[] = [];
  const criticalBugs: WorkItem[] = [];
  const storiesMissingAcceptance: WorkItem[] = [];
  const statusMap = new Map<string, number>();

  for (const it of items) {
    const raw = rawById.get(it.id) ?? {};
    const dueDate = (raw.due_date as string | null | undefined) ?? null;
    const assigneeId = (raw.assignee_id as string | null | undefined) ?? null;
    const acceptance = (raw.acceptance_criteria as string | null | undefined) ?? null;

    // Vencendo hoje / atrasados (ignoram concluídos).
    if (dueDate && !isDone(it.status)) {
      if (dueDate === today) dueToday.push(it);
      else if (dueDate < today) overdue.push(it);
    }

    if (isBlocked(it.status)) blocked.push(it);

    if (scope.assigneeId && assigneeId === scope.assigneeId) myItems.push(it);

    const t = (it.type || "").toLowerCase();
    if (t === "bug" && isCritical(it.priority)) criticalBugs.push(it);
    if (t === "story" && (!acceptance || acceptance.trim().length === 0)) {
      storiesMissingAcceptance.push(it);
    }

    const key = (it.status || "sem status").toString();
    statusMap.set(key, (statusMap.get(key) ?? 0) + 1);
  }

  const byStatus: StatusBucket[] = Array.from(statusMap.entries())
    .map(([status, count]) => ({ status, count }))
    .sort((a, b) => b.count - a.count);

  return {
    dueToday,
    overdue,
    blocked,
    myItems,
    byStatus,
    activeSprint,
    criticalBugs,
    storiesMissingAcceptance,
    projectIds,
    totalItems: items.length,
  };
}
