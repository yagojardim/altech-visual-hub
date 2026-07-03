import { useEffect, useState } from "react";
import {
  Activity,
  Building2,
  User,
  Calendar,
  ListTodo,
  Play,
  CheckCircle2,
  Timer,
  AlertCircle,
  Clock,
} from "lucide-react";
import { WidgetCard } from "@/components/dashboard/WidgetCard";
import { WidgetGrid } from "@/components/dashboard/WidgetGrid";
import { WidgetHeader } from "@/components/dashboard/WidgetHeader";
import { LoadingState, ErrorState, EmptyState } from "@/components/states";
import { getProjectBySlug, type ProjectRow } from "@/lib/projects-api";
import { listWorkItemsByProject, type WorkItemRow } from "@/lib/work-items-api";
import { listSprintsByProject, isDoneStatus, type SprintRow } from "@/lib/sprints-api";

function fmtDate(s: string | null): string {
  if (!s) return "—";
  const [y, m, d] = s.split("-");
  if (!y || !m || !d) return s;
  return `${d}/${m}/${y}`;
}

function formatRange(a: string | null, b: string | null): string {
  const start = fmtDate(a);
  const end = fmtDate(b);
  if (a && b) return `${start} – ${end}`;
  return a ? start : b ? end : "—";
}

function relativeTime(iso?: string): string {
  if (!iso) return "—";
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "—";
  const diff = Date.now() - then;
  const min = Math.round(diff / 60000);
  if (min < 1) return "agora";
  if (min < 60) return `${min} min atrás`;
  const h = Math.round(min / 60);
  if (h < 24) return `${h} h atrás`;
  const d = Math.round(h / 24);
  return `${d} d atrás`;
}

const STATUS_IN_PROGRESS = new Set(["em progresso", "em andamento", "em revisão", "em revisao", "doing"]);
const STATUS_PENDING = new Set(["a fazer", "todo", "backlog", "planejado"]);

export function ProjectOverviewGrid({ projectId }: { projectId?: string } = {}) {
  const [project, setProject] = useState<ProjectRow | null>(null);
  const [items, setItems] = useState<WorkItemRow[]>([]);
  const [sprints, setSprints] = useState<SprintRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!projectId) return;
    let alive = true;
    setLoading(true);
    setError(null);
    (async () => {
      try {
        const p = await getProjectBySlug(projectId);
        if (!alive) return;
        setProject(p);
        if (!p) {
          setItems([]);
          setSprints([]);
          return;
        }
        const [wi, sp] = await Promise.all([
          listWorkItemsByProject(p.id),
          listSprintsByProject(p.id),
        ]);
        if (!alive) return;
        setItems(wi);
        setSprints(sp);
      } catch (e) {
        if (!alive) return;
        setError(e instanceof Error ? e.message : "Erro ao carregar projeto");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [projectId, reloadKey]);

  if (loading) return <LoadingState variant="skeleton" rows={4} />;
  if (error)
    return (
      <ErrorState
        title="Não foi possível carregar o projeto"
        description={error}
        onRetry={() => setReloadKey((k) => k + 1)}
      />
    );
  if (!project)
    return (
      <EmptyState
        title="Nada por aqui ainda"
        description="Este projeto ainda não tem dados carregados."
      />
    );

  const summary = [
    {
      title: "Status",
      description: "Estado atual do projeto",
      icon: Activity,
      value: project?.status ?? "—",
    },
    {
      title: "Cliente",
      description: "Organização contratante",
      icon: Building2,
      value: project?.cliente ?? "—",
    },
    {
      title: "Responsável",
      description: "Gestor do projeto",
      icon: User,
      value: project?.responsavel ?? "—",
    },
    {
      title: "Datas",
      description: "Prazo do projeto",
      icon: Calendar,
      value: formatRange(project?.data_inicio ?? null, project?.data_fim ?? null),
    },
  ];

  const total = items.length;
  const done = items.filter((i) => isDoneStatus(i.status)).length;
  const inProgress = items.filter((i) => STATUS_IN_PROGRESS.has((i.status ?? "").toLowerCase())).length;
  const pending = items.filter((i) => STATUS_PENDING.has((i.status ?? "").toLowerCase())).length;
  const activeSprint = sprints.find((s) => (s.status ?? "").toLowerCase() === "ativa");
  const lastUpdate = [...items, ...sprints]
    .map((r) => r.updated_at)
    .filter((s): s is string => !!s)
    .sort()
    .pop();

  const indicators = [
    { title: "Total de Work Items", description: "Todos os itens do projeto", icon: ListTodo, value: total },
    { title: "Itens em andamento", description: "Ativamente trabalhados", icon: Play, value: inProgress },
    { title: "Itens concluídos", description: "Finalizados até o momento", icon: CheckCircle2, value: done },
    {
      title: "Sprint atual",
      description: "Sprint em execução",
      icon: Timer,
      value: activeSprint?.nome ?? "Nenhuma",
    },
    { title: "Pendências", description: "Itens ainda não iniciados", icon: AlertCircle, value: pending },
    {
      title: "Última atualização",
      description: "Modificação mais recente",
      icon: Clock,
      value: relativeTime(lastUpdate),
    },
  ];

  return (
    <div className="space-y-6">
      <WidgetGrid columns={4}>
        {summary.map((item) => (
          <WidgetCard key={item.title}>
            <WidgetHeader
              title={item.title}
              description={item.description}
              icon={item.icon}
              action={<span className="text-sm font-medium text-foreground">{item.value}</span>}
            />
          </WidgetCard>
        ))}
      </WidgetGrid>

      <WidgetGrid columns={3}>
        {indicators.map((item) => {
          const Icon = item.icon;
          return (
            <WidgetCard key={item.title}>
              <WidgetHeader
                title={item.title}
                description={item.description}
                icon={Icon}
                action={
                  <span className="text-sm font-medium text-foreground">{String(item.value)}</span>
                }
              />
            </WidgetCard>
          );
        })}
      </WidgetGrid>
    </div>
  );
}
