import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import {
  Activity,
  ArrowUpRight,
  FolderKanban,
  KanbanSquare,
  Layers,
  ListTodo,
  Target,
  Zap,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useWorkspace } from "@/lib/workspace";
import { supabase } from "@/lib/supabase";
import { DashboardContainer } from "@/components/dashboard/DashboardContainer";
import { WidgetGrid } from "@/components/dashboard/WidgetGrid";
import { WidgetCard } from "@/components/dashboard/WidgetCard";
import { WidgetHeader } from "@/components/dashboard/WidgetHeader";
import { LoadingState, EmptyState, ErrorState } from "@/components/states";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_workspace/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard · Altech" }] }),
  component: DashboardPage,
});

type ActivityItem = {
  id: string;
  item_key: string | null;
  title: string;
  status: string | null;
  updated_at: string | null;
  created_at: string | null;
};

type MyItem = {
  id: string;
  item_key: string | null;
  title: string;
  status: string | null;
  priority: string | null;
};

type ActiveSprint = {
  id: string;
  name: string;
  goal: string | null;
  end_date: string | null;
};

type DashboardData = {
  counts: {
    projects: number;
    boards: number;
    openItems: number;
    activeSprints: number;
  };
  activity: ActivityItem[];
  myItems: MyItem[];
  sprint: {
    sprint: ActiveSprint | null;
    total: number;
    done: number;
  };
};

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

function DashboardPage() {
  const { user } = useAuth();
  const { current } = useWorkspace();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [projectsRes, boardsRes, sprintsRes, itemsRes] = await Promise.all([
        supabase.from("projects").select("id", { count: "exact", head: true }),
        supabase.from("boards").select("id", { count: "exact", head: true }),
        supabase.from("sprints").select("id, name, goal, end_date, status").eq("status", "active"),
        supabase
          .from("work_items")
          .select("id, item_key, title, status, priority, assignee, sprint_id, created_at, updated_at")
          .order("updated_at", { ascending: false })
          .limit(200),
      ]);

      if (projectsRes.error) throw projectsRes.error;
      if (boardsRes.error) throw boardsRes.error;
      if (sprintsRes.error) throw sprintsRes.error;
      if (itemsRes.error) throw itemsRes.error;

      const items = (itemsRes.data ?? []) as Array<
        ActivityItem & {
          priority: string | null;
          assignee: string | null;
          sprint_id: string | null;
        }
      >;

      const openItems = items.filter((i) => !isDone(i.status)).length;

      const activity: ActivityItem[] = items.slice(0, 6).map((i) => ({
        id: i.id,
        item_key: i.item_key,
        title: i.title,
        status: i.status,
        created_at: i.created_at,
        updated_at: i.updated_at,
      }));

      const myItems: MyItem[] = items
        .filter(
          (i) =>
            i.assignee &&
            user &&
            (i.assignee === user.id || i.assignee === user.email || i.assignee === user.name),
        )
        .slice(0, 6)
        .map((i) => ({
          id: i.id,
          item_key: i.item_key,
          title: i.title,
          status: i.status,
          priority: i.priority,
        }));

      const activeSprint = (sprintsRes.data ?? [])[0] as ActiveSprint | undefined;
      const sprintScoped = activeSprint
        ? items.filter((i) => i.sprint_id === activeSprint.id)
        : [];

      setData({
        counts: {
          projects: projectsRes.count ?? 0,
          boards: boardsRes.count ?? 0,
          openItems,
          activeSprints: sprintsRes.data?.length ?? 0,
        },
        activity,
        myItems,
        sprint: {
          sprint: activeSprint ?? null,
          total: sprintScoped.length,
          done: sprintScoped.filter((i) => isDone(i.status)).length,
        },
      });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erro ao carregar dashboard");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
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

      {loading && <LoadingState label="Carregando dashboard…" />}
      {error && !loading && (
        <ErrorState description={error} onRetry={() => void load()} />
      )}

      {!loading && !error && data && (
        <>
          <WidgetGrid columns={4}>
            <KpiCard label="Projetos" value={data.counts.projects} icon={FolderKanban} />
            <KpiCard label="Boards" value={data.counts.boards} icon={KanbanSquare} />
            <KpiCard label="Work items abertos" value={data.counts.openItems} icon={Activity} />
            <KpiCard label="Sprints ativas" value={data.counts.activeSprints} icon={Zap} />
          </WidgetGrid>

          <WidgetGrid columns={3}>
            <WidgetCard className="lg:col-span-2">
              <WidgetHeader
                title="Atividade recente"
                description="Últimos work items criados ou atualizados"
                icon={Activity}
              />
              {data.activity.length === 0 ? (
                <EmptyState title="Sem atividade" description="Nenhum work item registrado ainda." />
              ) : (
                <ul className="mt-3 divide-y divide-border">
                  {data.activity.map((i) => (
                    <li key={i.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                      <div className="flex min-w-0 items-center gap-2">
                        <span className="font-mono text-[11px] text-muted-foreground">
                          {i.item_key ?? i.id.slice(0, 6)}
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
                          {fmtRelative(i.updated_at ?? i.created_at)}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </WidgetCard>

            <WidgetCard>
              <WidgetHeader
                title="Sprint atual"
                description={data.sprint.sprint?.name ?? "Sem sprint ativa"}
                icon={Target}
              />
              {data.sprint.sprint ? (
                <div className="mt-3 space-y-3">
                  {data.sprint.sprint.goal && (
                    <p className="text-xs text-muted-foreground">{data.sprint.sprint.goal}</p>
                  )}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Progresso</span>
                      <span className="font-medium">
                        {data.sprint.done} / {data.sprint.total}
                      </span>
                    </div>
                    <Progress
                      value={data.sprint.total ? (data.sprint.done / data.sprint.total) * 100 : 0}
                    />
                  </div>
                  {data.sprint.sprint.end_date && (
                    <p className="text-[11px] text-muted-foreground">
                      Termina em {new Date(data.sprint.sprint.end_date).toLocaleDateString("pt-BR")}
                    </p>
                  )}
                </div>
              ) : (
                <p className="mt-4 text-sm text-muted-foreground">Nenhuma sprint em andamento.</p>
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
              {data.myItems.length === 0 ? (
                <EmptyState
                  title="Nada por aqui"
                  description="Você não tem work items atribuídos no momento."
                />
              ) : (
                <ul className="mt-3 divide-y divide-border">
                  {data.myItems.map((i) => (
                    <li key={i.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                      <div className="flex min-w-0 items-center gap-2">
                        <span className="font-mono text-[11px] text-muted-foreground">
                          {i.item_key ?? i.id.slice(0, 6)}
                        </span>
                        <span className="truncate text-foreground">{i.title}</span>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        {i.priority && (
                          <Badge variant="outline" className="text-[10px] uppercase">
                            {i.priority}
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
  );
}

function KpiCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: typeof Activity;
}) {
  return (
    <WidgetCard>
      <WidgetHeader
        title={label}
        icon={Icon}
        action={<span className="text-2xl font-semibold">{value}</span>}
      />
    </WidgetCard>
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
