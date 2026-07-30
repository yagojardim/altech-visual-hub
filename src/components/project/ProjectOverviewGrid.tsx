import { useQuery } from "@tanstack/react-query";
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
import { FlowMap, type FlowItem } from "@/components/signature/FlowMap";
import { HealthScore } from "@/components/signature/HealthScore";
import { ImpactMap } from "@/components/signature/ImpactMap";
import { getProjectBySlug } from "@/lib/projects-api";
import { typeLabel } from "@/lib/work-items-api";
import { listWorkItemsByProject } from "@/lib/work-items-api";
import { listSprintsByProject, isDoneStatus } from "@/lib/sprints-api";
import { qk } from "@/lib/query-keys";

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
  const projectQuery = useQuery({
    queryKey: ["projects", "bySlug", projectId ?? ""],
    queryFn: () => (projectId ? getProjectBySlug(projectId) : Promise.resolve(null)),
    enabled: !!projectId,
  });
  const project = projectQuery.data ?? null;

  const itemsQuery = useQuery({
    queryKey: project ? qk.workItemsByProject(project.id) : ["work_items", "disabled"],
    queryFn: () => (project ? listWorkItemsByProject(project.id) : Promise.resolve([])),
    enabled: !!project,
  });

  const sprintsQuery = useQuery({
    queryKey: ["sprints", "byProject", project?.id ?? ""],
    queryFn: () => (project ? listSprintsByProject(project.id) : Promise.resolve([])),
    enabled: !!project,
  });

  const loading = projectQuery.isLoading || (!!project && (itemsQuery.isLoading || sprintsQuery.isLoading));
  const err = projectQuery.error ?? itemsQuery.error ?? sprintsQuery.error;
  const error = err instanceof Error ? err.message : err ? String(err) : null;

  const items = itemsQuery.data ?? [];
  const sprints = sprintsQuery.data ?? [];

  if (loading) return <LoadingState variant="skeleton" rows={4} />;
  if (error)
    return (
      <ErrorState
        title="Não foi possível carregar o projeto"
        description={error}
        onRetry={() => {
          void projectQuery.refetch();
          void itemsQuery.refetch();
          void sprintsQuery.refetch();
        }}
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
    .map((r) => (r as { updated_at?: string; created_at?: string }).updated_at ?? (r as { created_at?: string }).created_at)
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

      <FlowMap
        items={items.slice(0, 21).map<FlowItem>((i) => ({
          id: i.id,
          title: i.title ?? "—",
          meta: typeLabel(i.type),
          status: i.status,
        }))}
      />

      <WidgetGrid columns={2}>
        <HealthScore
          dimensions={[
            { label: "Prazo", score: total ? Math.min(100, Math.round((done / total) * 100) + 15) : 60, hint: "vs. datas do projeto" },
            { label: "Risco", score: pending > total / 2 ? 45 : 80, hint: `${pending} pendências` },
            { label: "Capacidade", score: inProgress > 0 ? 72 : 55, hint: `${inProgress} em andamento` },
            { label: "Entrega", score: total ? Math.round((done / total) * 100) : 0, hint: `${done}/${total} concluídos` },
          ]}
        />
        <ImpactMap
          objective={project?.nome ? `Entregar valor em ${project.nome}` : "Objetivo do projeto"}
          epics={[
            {
              title: "Descoberta & Validação",
              deliveries: ["Pesquisa com usuários", "Hipóteses validadas"],
              outcome: `${pending} pendências mapeadas`,
            },
            {
              title: "Construção & Entrega",
              deliveries: [`${inProgress} itens em execução`, `${done} entregues`],
              outcome: total ? `${Math.round((done / total) * 100)}% do escopo` : "Sem itens",
            },
          ]}
        />
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
