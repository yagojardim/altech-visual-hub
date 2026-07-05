import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import {
  Activity,
  ArrowUpRight,
  FolderKanban,
  Layers,
  ListTodo,
  Target,
  Timer,
  Zap,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useWorkspace } from "@/lib/workspace";
import { useDevRole, type DevRole } from "@/lib/dev-role";
import { supabase } from "@/lib/supabase";
import { toWorkItems, type WorkItem } from "@/lib/work-item-map";
import { formatSupabaseError } from "@/lib/supabase-errors";
import { DashboardContainer } from "@/components/dashboard/DashboardContainer";
import { PMDashboard, PODashboard } from "@/components/dashboard/RoleDashboards";
import { DashboardContextHeader } from "@/components/dashboard/DashboardContextHeader";
import { DashboardOverview } from "@/components/dashboard/DashboardOverview";
import { TooltipProvider } from "@/components/ui/tooltip";

export const Route = createFileRoute("/_workspace/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard · Altech Project" }] }),
  component: DashboardPage,
});

type ActivityItem = {
  id: string;
  itemKey: string | null;
  title: string;
  status: string | null;
  updatedAt: string | null;
  createdAt: string | null;
};

type MyItem = {
  id: string;
  itemKey: string | null;
  title: string;
  status: string | null;
  type: string | null;
};

type Result<T> = { ok: true; value: T } | { ok: false; error: string };

const PROJECT_INACTIVE = new Set(["arquivado", "arquivada", "concluido", "concluído", "cancelado", "cancelada", "encerrado"]);
const SPRINT_ACTIVE = new Set(["ativa", "ativo", "em andamento", "andamento", "em progresso", "iniciada", "active", "in_progress"]);
const DONE_STATUSES = new Set(["done", "concluido", "concluído", "completed", "closed", "resolved"]);
const BACKLOG_STATUSES = new Set(["backlog", "a fazer", "afazer", "to do", "todo", "aberto"]);

function isDone(status?: string | null) {
  if (!status) return false;
  return DONE_STATUSES.has(status.toLowerCase());
}

function isBacklog(status?: string | null) {
  if (!status) return false;
  return BACKLOG_STATUSES.has(status.toLowerCase());
}

function fmtRelative(iso?: string | null) {
  if (!iso) return "—";
  const d = new Date(iso).getTime();
  const diff = Math.max(0, Date.now() - d);
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "agora";
  if (mins < 60) return `há ${mins}m`;
  const h = Math.floor(mins / 60);
  if (h < 24) return `há ${h}h`;
  const days = Math.floor(h / 24);
  return `há ${days}d`;
}

async function safe<T>(label: string, fn: () => Promise<T>): Promise<Result<T>> {
  try {
    return { ok: true, value: await fn() };
  } catch (e) {
    const msg = formatSupabaseError(e) || "Erro desconhecido";
    console.warn(`[dashboard] ${label} falhou:`, e);
    return { ok: false, error: msg };
  }
}

type DashboardState = {
  activeProjects: Result<number>;
  activeSprints: Result<number>;
  openItems: Result<number>;
  backlogItems: Result<number>;
  doneItems: Result<number>;
  totalItems: Result<number>;
  statusBreakdown: Result<Array<{ status: string; count: number }>>;
  activity: Result<ActivityItem[]>;
  myItems: Result<MyItem[]>;
};

const ROLE_CONFIG: Record<
  DevRole,
  { focus: string; showEvolution: boolean; showMyItems: boolean; showQuickLinks: boolean }
> = {
  SUPER_ADMIN: { focus: "Visão global: tenants, workspaces e saúde da plataforma.", showEvolution: true, showMyItems: true, showQuickLinks: true },
  "Admin Empresa": { focus: "Governança do tenant: projetos ativos, capacidade e riscos.", showEvolution: true, showMyItems: true, showQuickLinks: true },
  PMO: { focus: "Portfólio: entrega vs. planejado, riscos e capacidade dos times.", showEvolution: true, showMyItems: false, showQuickLinks: true },
  PM: { focus: "Projetos sob gestão: sprint atual, bloqueios e progresso.", showEvolution: true, showMyItems: true, showQuickLinks: true },
  PO: { focus: "Backlog priorizado e progresso das histórias.", showEvolution: false, showMyItems: true, showQuickLinks: true },
  "Tech Lead": { focus: "Fluxo técnico: WIP, bloqueios e capacidade do time.", showEvolution: true, showMyItems: true, showQuickLinks: true },
  Dev: { focus: "Meus work items em andamento e próximos.", showEvolution: false, showMyItems: true, showQuickLinks: false },
  QA: { focus: "Itens em validação e defeitos abertos.", showEvolution: false, showMyItems: true, showQuickLinks: false },
  Cliente: { focus: "Progresso do projeto e entregas visíveis.", showEvolution: true, showMyItems: false, showQuickLinks: false },
  Solicitante: { focus: "Status das suas solicitações.", showEvolution: false, showMyItems: false, showQuickLinks: false },
};

function DashboardPage() {
  const { user } = useAuth();
  useWorkspace();
  const { role } = useDevRole();
  const roleCfg = ROLE_CONFIG[role];
  const [state, setState] = useState<DashboardState | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);

    // Cada métrica roda de forma isolada: falha de uma não afeta as outras.
    const [projectsR, sprintsR, itemsR, linkedR] = await Promise.all([
      safe("projects", async () => {
        const { data, error } = await supabase
          .from("projects")
          .select("id, status");
        if (error) throw error;
        return (data ?? []) as Array<{ id: string; status: string | null }>;
      }),
      safe("sprints", async () => {
        const { data, error } = await supabase
          .from("sprints")
          .select("id, status");
        if (error) throw error;
        return (data ?? []) as Array<{ id: string; status: string | null }>;
      }),
      safe("work_items", async () => {
        const { data, error } = await supabase
          .from("work_items")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(200);
        if (error) throw error;
        return toWorkItems(data ?? []) as WorkItem[];
      }),
      safe("sprint_items", async () => {
        const { data, error } = await supabase.from("sprint_items").select("work_item_id");
        if (error) throw error;
        return new Set<string>(((data ?? []) as Array<{ work_item_id: string }>).map((r) => r.work_item_id));
      }),
    ]);

    const activeProjects: Result<number> = projectsR.ok
      ? {
          ok: true,
          value: projectsR.value.filter(
            (p) => !PROJECT_INACTIVE.has((p.status ?? "").toLowerCase()),
          ).length,
        }
      : projectsR;

    const activeSprints: Result<number> = sprintsR.ok
      ? {
          ok: true,
          value: sprintsR.value.filter((s) =>
            SPRINT_ACTIVE.has((s.status ?? "").toLowerCase()),
          ).length,
        }
      : sprintsR;

    let openItems: Result<number>;
    let backlogItems: Result<number>;
    let doneItems: Result<number>;
    let totalItems: Result<number>;
    let statusBreakdown: Result<Array<{ status: string; count: number }>>;
    let activity: Result<ActivityItem[]>;
    let myItems: Result<MyItem[]>;

    if (itemsR.ok) {
      const items = itemsR.value;
      const linkedIds = linkedR.ok ? linkedR.value : new Set<string>();
      openItems = { ok: true, value: items.filter((i) => !isDone(i.status)).length };
      doneItems = { ok: true, value: items.filter((i) => isDone(i.status)).length };
      totalItems = { ok: true, value: items.length };
      backlogItems = {
        ok: true,
        value: items.filter(
          (i) => isBacklog(i.status) || (!i.sprintId && !linkedIds.has(i.id) && !isDone(i.status)),
        ).length,
      };

      try {
        const statusMap = new Map<string, number>();
        for (const i of items) {
          const key = (i.status || "sem status").toString();
          statusMap.set(key, (statusMap.get(key) ?? 0) + 1);
        }
        statusBreakdown = {
          ok: true,
          value: Array.from(statusMap.entries())
            .map(([status, count]) => ({ status, count }))
            .sort((a, b) => b.count - a.count),
        };
      } catch (e) {
        console.warn("[dashboard] statusBreakdown falhou:", e);
        statusBreakdown = { ok: false, error: "Falha ao calcular status" };
      }

      try {
        activity = {
          ok: true,
          value: items.slice(0, 6).map((i) => ({
            id: i.id,
            itemKey: i.itemKey,
            title: i.title,
            status: i.status,
            createdAt: i.createdAt ?? null,
            updatedAt: i.updatedAt ?? null,
          })),
        };
      } catch (e) {
        console.warn("[dashboard] activity falhou:", e);
        activity = { ok: false, error: "Falha ao montar atividade" };
      }

      try {
        myItems = {
          ok: true,
          value: items
            .filter(
              (i) =>
                i.assignee &&
                user &&
                (i.assignee === user.name || i.assignee === user.email || i.assignee === user.id),
            )
            .slice(0, 6)
            .map((i) => ({
              id: i.id,
              itemKey: i.itemKey,
              title: i.title,
              status: i.status,
              type: i.type,
            })),
        };
      } catch (e) {
        console.warn("[dashboard] myItems falhou:", e);
        myItems = { ok: false, error: "Falha ao filtrar seus itens" };
      }
    } else {
      openItems = itemsR;
      backlogItems = itemsR;
      doneItems = itemsR;
      totalItems = itemsR;
      statusBreakdown = itemsR;
      activity = itemsR;
      myItems = itemsR;
    }

    setState({
      activeProjects,
      activeSprints,
      openItems,
      backlogItems,
      doneItems,
      totalItems,
      statusBreakdown,
      activity,
      myItems,
    });
    setLoading(false);
  }, [user]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <TooltipProvider delayDuration={200}>
      <DashboardContainer>
        <DashboardContextHeader />
        <p className="text-sm text-muted-foreground">
          {roleCfg.focus} Use{" "}
          <kbd className="rounded border border-border bg-panel px-1 py-0.5 text-[10px] font-mono">
            ⌘K
          </kbd>{" "}
          para navegar.
        </p>

        {role === "PM" && <PMDashboard />}
        {role === "PO" && <PODashboard />}

        {role !== "PM" && role !== "PO" && loading && (
          <LoadingState label="Carregando dashboard…" variant="skeleton" rows={4} />
        )}

        {role !== "PM" && role !== "PO" && !loading && state && (
          <>
            <WidgetGrid columns={4}>
              <KpiCard label="Projetos ativos" result={state.activeProjects} icon={FolderKanban} />
              <KpiCard label="Sprints em andamento" result={state.activeSprints} icon={Timer} />
              <KpiCard label="Itens em backlog" result={state.backlogItems} icon={ListTodo} />
              <KpiCard label="Itens concluídos" result={state.doneItems} icon={Zap} />
            </WidgetGrid>

            {state.activity.ok && (
              <FlowMap
                items={state.activity.value.map<FlowItem>((a) => ({
                  id: a.id,
                  title: a.title,
                  meta: a.itemKey ?? undefined,
                  status: a.status,
                }))}
              />
            )}

            <WidgetGrid columns={1}>
              <HealthScore
                dimensions={[
                  {
                    label: "Prazo",
                    score:
                      state.totalItems.ok && state.doneItems.ok && state.totalItems.value
                        ? Math.min(100, Math.round((state.doneItems.value / state.totalItems.value) * 100) + 10)
                        : 60,
                    hint: "Ritmo de entrega vs. planejado",
                  },
                  {
                    label: "Risco",
                    score: state.activeSprints.ok && state.activeSprints.value > 0 ? 78 : 55,
                    hint: "Bloqueios e dependências",
                  },
                  {
                    label: "Capacidade",
                    score: state.activeProjects.ok ? Math.max(30, 90 - state.activeProjects.value * 8) : 70,
                    hint: "Carga do time",
                  },
                  {
                    label: "Entrega",
                    score:
                      state.totalItems.ok && state.doneItems.ok && state.totalItems.value
                        ? Math.round((state.doneItems.value / state.totalItems.value) * 100)
                        : 50,
                    hint: "% concluído no ciclo",
                  },
                ]}
              />
            </WidgetGrid>

            {roleCfg.showEvolution && state.activity.ok && (
              <WidgetGrid columns={1}>
                <EvolutionTimeline
                  events={state.activity.value.map<EvolutionEvent>((a) => ({
                    id: a.id,
                    date: a.updatedAt ?? a.createdAt ?? new Date().toISOString(),
                    title: a.title,
                    detail: a.itemKey ?? undefined,
                    status: a.status,
                  }))}
                />
              </WidgetGrid>
            )}


            <WidgetGrid columns={3}>
              <WidgetCard className="lg:col-span-2">
                <WidgetHeader
                  title="Atividade recente"
                  description="Últimos work items criados ou atualizados"
                  icon={Activity}
                />
                {!state.activity.ok ? (
                  <ErrorInline message={state.activity.error} />
                ) : state.activity.value.length === 0 ? (
                  <EmptyState title="Nada por aqui ainda" description="Nenhum work item registrado ainda." />
                ) : (
                  <ul className="mt-3 divide-y divide-border">
                    {state.activity.value.map((i) => (
                      <li key={i.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                        <div className="flex min-w-0 items-center gap-2">
                          <span className="font-mono text-[11px] text-muted-foreground">
                            {i.itemKey ?? i.id.slice(0, 6)}
                          </span>
                          <span className="truncate text-foreground">{i.title}</span>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          {i.status && (
                            <Badge variant="outline" className="text-[10px] uppercase">
                              {i.status}
                            </Badge>
                          )}
                          <span className="text-[11px] text-muted-foreground">
                            {fmtRelative(i.updatedAt ?? i.createdAt)}
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </WidgetCard>

              <WidgetCard>
                <WidgetHeader
                  title="Work items por status"
                  description={
                    state.totalItems.ok
                      ? `${state.totalItems.value} itens no workspace`
                      : "Dados indisponíveis"
                  }
                  icon={Target}
                />
                {!state.statusBreakdown.ok ? (
                  <ErrorInline message={state.statusBreakdown.error} />
                ) : (
                  <div className="mt-3 space-y-3">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Concluídos</span>
                        <span className="font-medium">
                          {state.doneItems.ok ? state.doneItems.value : "—"} /{" "}
                          {state.totalItems.ok ? state.totalItems.value : "—"}
                        </span>
                      </div>
                      <Progress
                        value={
                          state.doneItems.ok && state.totalItems.ok && state.totalItems.value
                            ? (state.doneItems.value / state.totalItems.value) * 100
                            : 0
                        }
                      />
                    </div>
                    {state.statusBreakdown.value.length > 0 && (
                      <ul className="space-y-1.5 pt-1">
                        {state.statusBreakdown.value.map((s) => (
                          <li
                            key={s.status}
                            className="flex items-center justify-between text-xs"
                          >
                            <span className="flex items-center gap-2 text-muted-foreground">
                              <span
                                className={cn(
                                  "inline-block h-1.5 w-1.5 rounded-full",
                                  isDone(s.status) ? "bg-emerald-500" : "bg-primary",
                                )}
                              />
                              <span className="capitalize">{s.status}</span>
                            </span>
                            <span className="font-medium text-foreground">{s.count}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </WidgetCard>
            </WidgetGrid>

            {(roleCfg.showMyItems || roleCfg.showQuickLinks) && (
              <WidgetGrid columns={3}>
                {roleCfg.showMyItems && (
                  <WidgetCard className={roleCfg.showQuickLinks ? "lg:col-span-2" : "lg:col-span-3"}>
                    <WidgetHeader
                      title="Meus itens"
                      description={`Atribuídos a ${user?.name ?? "você"}`}
                      icon={ListTodo}
                    />
                    {!state.myItems.ok ? (
                      <ErrorInline message={state.myItems.error} />
                    ) : state.myItems.value.length === 0 ? (
                      <EmptyState
                        title="Nada por aqui ainda"
                        description="Você não tem work items atribuídos no momento."
                      />
                    ) : (
                      <ul className="mt-3 divide-y divide-border">
                        {state.myItems.value.map((i) => (
                          <li key={i.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                            <div className="flex min-w-0 items-center gap-2">
                              <span className="font-mono text-[11px] text-muted-foreground">
                                {i.itemKey ?? i.id.slice(0, 6)}
                              </span>
                              <span className="truncate text-foreground">{i.title}</span>
                            </div>
                            <div className="flex shrink-0 items-center gap-2">
                              {i.type && (
                                <Badge variant="outline" className="text-[10px] uppercase">
                                  {i.type}
                                </Badge>
                              )}
                              {i.status && (
                                <Badge
                                  className={cn(
                                    "text-[10px] uppercase",
                                    isDone(i.status)
                                      ? "bg-emerald-500/15 text-emerald-600"
                                      : "bg-primary/15 text-primary",
                                  )}
                                >
                                  {i.status}
                                </Badge>
                              )}
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </WidgetCard>
                )}

                {roleCfg.showQuickLinks && <QuickLinks />}
              </WidgetGrid>
            )}
          </>
        )}
      </DashboardContainer>
    </TooltipProvider>
  );
}

function KpiCard({
  label,
  result,
  icon: Icon,
}: {
  label: string;
  result: Result<number>;
  icon: typeof Activity;
}) {
  const display = result.ok ? (
    <span className="text-2xl font-semibold">{result.value}</span>
  ) : (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          className="text-2xl font-semibold text-muted-foreground cursor-help"
          aria-label={`Métrica indisponível: ${result.error}`}
        >
          —
        </span>
      </TooltipTrigger>
      <TooltipContent side="left" className="max-w-xs text-xs">
        Métrica indisponível: {result.error}
      </TooltipContent>
    </Tooltip>
  );

  return (
    <WidgetCard>
      <WidgetHeader title={label} icon={Icon} action={display} />
    </WidgetCard>
  );
}

function ErrorInline({ message }: { message: string }) {
  return (
    <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="cursor-help font-medium">—</span>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs text-xs">
          {message}
        </TooltipContent>
      </Tooltip>
      <span>Dados indisponíveis no momento.</span>
    </div>
  );
}

function QuickLinks() {
  return (
    <WidgetCard>
      <WidgetHeader title="Atalhos" description="Navegação rápida" icon={Layers} />
      <div className="mt-3 space-y-2">
        <QuickLink to="/projects" label="Projetos" />
        <QuickLink to="/boards" label="Boards" />
        <QuickLink to="/sprints" label="Sprints" />
        <QuickLink to="/backlog" label="Backlog" />
      </div>
    </WidgetCard>
  );
}

function QuickLink({ to, label }: { to: string; label: string }) {
  return (
    <Link
      to={to}
      className="flex items-center justify-between rounded-md border border-border bg-panel px-3 py-2 text-sm text-foreground transition-colors hover:border-primary/40 hover:text-primary"
    >
      <span>{label}</span>
      <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
    </Link>
  );
}
