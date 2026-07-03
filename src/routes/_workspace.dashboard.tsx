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
  Timer,
  Zap,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useWorkspace } from "@/lib/workspace";
import { supabase } from "@/lib/supabase";
import { DEFAULT_TENANT_ID } from "@/lib/projects-api";
import { DashboardContainer } from "@/components/dashboard/DashboardContainer";
import { WidgetGrid } from "@/components/dashboard/WidgetGrid";
import { WidgetCard } from "@/components/dashboard/WidgetCard";
import { WidgetHeader } from "@/components/dashboard/WidgetHeader";
import { LoadingState, EmptyState, ErrorState } from "@/components/states";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_workspace/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard · Altech Project" }] }),
  component: DashboardPage,
});

type ActivityItem = {
  id: string;
  item_key: string | null;
  titulo: string;
  status: string | null;
  updated_at: string | null;
  created_at: string | null;
};

type MyItem = {
  id: string;
  item_key: string | null;
  titulo: string;
  status: string | null;
  tipo: string | null;
};

type DashboardData = {
  counts: {
    activeProjects: number;
    openItems: number;
    doneItems: number;
    totalItems: number;
    activeSprints: number;
  };
  statusBreakdown: Array<{ status: string; count: number }>;
  activity: ActivityItem[];
  myItems: MyItem[];
};

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
      const [projectsRes, itemsRes, sprintsRes] = await Promise.all([
        supabase
          .from("projects")
          .select("id, status")
          .eq("tenant_id", DEFAULT_TENANT_ID),
        supabase
          .from("work_items")
          .select("id, item_key, titulo, tipo, status, responsavel, created_at, updated_at")
          .eq("tenant_id", DEFAULT_TENANT_ID)
          .order("updated_at", { ascending: false })
          .limit(200),
        supabase
          .from("sprints")
          .select("id, status")
          .eq("tenant_id", DEFAULT_TENANT_ID),
      ]);

      if (projectsRes.error) throw projectsRes.error;
      if (itemsRes.error) throw itemsRes.error;
      // sprints table might not exist yet; tolerate error silently
      const sprintRows = (sprintsRes.error ? [] : sprintsRes.data ?? []) as Array<{
        id: string;
        status: string | null;
      }>;

      const projectRows = (projectsRes.data ?? []) as Array<{ id: string; status: string | null }>;
      const activeProjects = projectRows.filter(
        (p) => !PROJECT_INACTIVE.has((p.status ?? "").toLowerCase()),
      ).length;

      const activeSprints = sprintRows.filter((s) =>
        SPRINT_ACTIVE.has((s.status ?? "").toLowerCase()),
      ).length;

      const items = (itemsRes.data ?? []) as Array<
        ActivityItem & { tipo: string | null; responsavel: string | null }
      >;

      const openItems = items.filter((i) => !isDone(i.status)).length;
      const doneItems = items.filter((i) => isDone(i.status)).length;

      const statusMap = new Map<string, number>();
      for (const i of items) {
        const key = (i.status ?? "sem status").toString();
        statusMap.set(key, (statusMap.get(key) ?? 0) + 1);
      }
      const statusBreakdown = Array.from(statusMap.entries())
        .map(([status, count]) => ({ status, count }))
        .sort((a, b) => b.count - a.count);

      const activity: ActivityItem[] = items.slice(0, 6).map((i) => ({
        id: i.id,
        item_key: i.item_key,
        titulo: i.titulo,
        status: i.status,
        created_at: i.created_at,
        updated_at: i.updated_at,
      }));

      const myItems: MyItem[] = items
        .filter(
          (i) =>
            i.responsavel &&
            user &&
            (i.responsavel === user.name || i.responsavel === user.email || i.responsavel === user.id),
        )
        .slice(0, 6)
        .map((i) => ({
          id: i.id,
          item_key: i.item_key,
          titulo: i.titulo,
          status: i.status,
          tipo: i.tipo,
        }));

      setData({
        counts: {
          activeProjects,
          openItems,
          doneItems,
          totalItems: items.length,
          activeSprints,
        },
        statusBreakdown,
        activity,
        myItems,
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
          Visão geral do seu workspace Altech Project. Use{" "}
          <kbd className="rounded border border-border bg-panel px-1 py-0.5 text-[10px] font-mono">
            ⌘K
          </kbd>{" "}
          para navegar.
        </p>
      </header>

      {loading && <LoadingState label="Carregando dashboard…" variant="skeleton" rows={4} />}
      {error && !loading && (
        <ErrorState description={error} onRetry={() => void load()} />
      )}

      {!loading && !error && data && (
        <>
          <WidgetGrid columns={4}>
            <KpiCard label="Projetos" value={data.counts.projects} icon={FolderKanban} />
            <KpiCard label="Work items" value={data.counts.totalItems} icon={KanbanSquare} />
            <KpiCard label="Abertos" value={data.counts.openItems} icon={Activity} />
            <KpiCard label="Concluídos" value={data.counts.doneItems} icon={Zap} />
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
                        <span className="truncate text-foreground">{i.titulo}</span>
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
                title="Progresso"
                description="Itens concluídos no workspace"
                icon={Target}
              />
              <div className="mt-3 space-y-3">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Concluídos</span>
                    <span className="font-medium">
                      {data.counts.doneItems} / {data.counts.totalItems}
                    </span>
                  </div>
                  <Progress
                    value={
                      data.counts.totalItems
                        ? (data.counts.doneItems / data.counts.totalItems) * 100
                        : 0
                    }
                  />
                </div>
              </div>
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
                        <span className="truncate text-foreground">{i.titulo}</span>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        {i.tipo && (
                          <Badge variant="outline" className="text-[10px] uppercase">
                            {i.tipo}
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
