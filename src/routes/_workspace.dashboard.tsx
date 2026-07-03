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
import { supabase } from "@/lib/supabase";
import { DEFAULT_TENANT_ID } from "@/lib/projects-api";
import { toWorkItems, type WorkItem } from "@/lib/work-item-map";
import { formatSupabaseError } from "@/lib/supabase-errors";
import { DashboardContainer } from "@/components/dashboard/DashboardContainer";
import { WidgetGrid } from "@/components/dashboard/WidgetGrid";
import { WidgetCard } from "@/components/dashboard/WidgetCard";
import { WidgetHeader } from "@/components/dashboard/WidgetHeader";
import { LoadingState, EmptyState } from "@/components/states";
import { FlowMap, type FlowItem } from "@/components/signature/FlowMap";
import { HealthScore } from "@/components/signature/HealthScore";
import { EvolutionTimeline, type EvolutionEvent } from "@/components/signature/EvolutionTimeline";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

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

function isDone(status?: string | null) {
  if (!status) return false;
  return DONE_STATUSES.has(status.toLowerCase());
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
  doneItems: Result<number>;
  totalItems: Result<number>;
  statusBreakdown: Result<Array<{ status: string; count: number }>>;
  activity: Result<ActivityItem[]>;
  myItems: Result<MyItem[]>;
};

function DashboardPage() {
  const { user } = useAuth();
  const { current } = useWorkspace();
  const [state, setState] = useState<DashboardState | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);

    // Cada métrica roda de forma isolada: falha de uma não afeta as outras.
    const [projectsR, sprintsR, itemsR] = await Promise.all([
      safe("projects", async () => {
        const { data, error } = await supabase
          .from("projects")
          .select("id, status")
          .eq("tenant_id", DEFAULT_TENANT_ID);
        if (error) throw error;
        return (data ?? []) as Array<{ id: string; status: string | null }>;
      }),
      safe("sprints", async () => {
        const { data, error } = await supabase
          .from("sprints")
          .select("id, status")
          .eq("tenant_id", DEFAULT_TENANT_ID);
        if (error) throw error;
        return (data ?? []) as Array<{ id: string; status: string | null }>;
      }),
      safe("work_items", async () => {
        const { data, error } = await supabase
          .from("work_items")
          .select("*")
          .eq("tenant_id", DEFAULT_TENANT_ID)
          .order("updated_at", { ascending: false })
          .limit(200);
        if (error) throw error;
        return toWorkItems(data ?? []) as WorkItem[];
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
    let doneItems: Result<number>;
    let totalItems: Result<number>;
    let statusBreakdown: Result<Array<{ status: string; count: number }>>;
    let activity: Result<ActivityItem[]>;
    let myItems: Result<MyItem[]>;

    if (itemsR.ok) {
      const items = itemsR.value;
      openItems = { ok: true, value: items.filter((i) => !isDone(i.status)).length };
      doneItems = { ok: true, value: items.filter((i) => isDone(i.status)).length };
      totalItems = { ok: true, value: items.length };

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
        <header className="space-y-1">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[11px] uppercase tracking-wider text-primary">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            {current ? `${current.name} · ${current.plan}` : "Workspace ativo"}
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">Bem-vindo, {user?.name}</h1>
          <p className="text-sm text-muted-foreground">
            Visão geral do seu workspace Altech. Use{" "}
            <kbd className="rounded border border-border bg-panel px-1 py-0.5 text-[10px] font-mono">
              ⌘K
            </kbd>{" "}
            para navegar.
          </p>
        </header>

        {loading && <LoadingState label="Carregando dashboard…" variant="skeleton" rows={4} />}

        {!loading && state && (
          <>
            <WidgetGrid columns={4}>
              <KpiCard label="Projetos ativos" result={state.activeProjects} icon={FolderKanban} />
              <KpiCard label="Sprints em andamento" result={state.activeSprints} icon={Timer} />
              <KpiCard label="Itens abertos" result={state.openItems} icon={Activity} />
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

            {state.activity.ok && (
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

            <WidgetGrid columns={3}>
              <WidgetCard className="lg:col-span-2">
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

              <QuickLinks />
            </WidgetGrid>
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
