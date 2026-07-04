import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight, SearchX, Calendar, Target, Timer, User } from "lucide-react";
import { formatSupabaseError } from "@/lib/supabase-errors";
import { listProjects } from "@/lib/projects-api";
import { listTeamMembers, type TeamMember } from "@/lib/team-members-api";
import { getSprint, listItemsBySprint, type SprintRow, type SprintItemRow } from "@/lib/sprints-api";
import { getSprintStatusColor, getSprintStatusLabel } from "@/lib/sprint-status";
import { STATUS_COLUMNS } from "@/lib/work-items-api";
import { typeMeta, typeBadgeStyle, priorityMeta } from "@/lib/work-item-type-style";
import { WidgetCard } from "@/components/dashboard/WidgetCard";
import { Badge } from "@/components/ui/badge";
import { LoadingState, EmptyState, ErrorState } from "@/components/states";
import { cn } from "@/lib/utils";

function fmtDate(s: string | null): string {
  if (!s) return "—";
  const [y, m, d] = s.split("-");
  return y && m && d ? `${d}/${m}/${y}` : s;
}

export const Route = createFileRoute("/_workspace/sprints/$sprintId")({
  head: () => ({ meta: [{ title: "Sprint · Altech Project" }] }),
  component: SprintDetailPage,
});

function SprintDetailPage() {
  const { sprintId } = Route.useParams();
  const sprintQ = useQuery({ queryKey: ["sprints", "detail", sprintId], queryFn: () => getSprint(sprintId) });
  const projectsQ = useQuery({ queryKey: ["projects", "all"], queryFn: listProjects });

  if (sprintQ.isLoading) return <LoadingState variant="skeleton" rows={2} />;
  if (sprintQ.error) {
    return (
      <ErrorState
        title="Não foi possível carregar a sprint"
        description={formatSupabaseError(sprintQ.error, "Erro ao carregar sprint.")}
        onRetry={() => void sprintQ.refetch()}
      />
    );
  }

  const sprint = sprintQ.data;
  if (!sprint) {
    return (
      <EmptyState
        icon={<SearchX className="h-5 w-5" />}
        title="Sprint não encontrada"
        description="Verifique o endereço ou volte para a lista."
        action={
          <Link
            to="/sprints"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Voltar para Sprints
          </Link>
        }
      />
    );
  }

  return <SprintDetailBody sprint={sprint} projectName={(projectsQ.data ?? []).find((p) => p.id === sprint.project_id)?.nome ?? null} />;
}

function SprintDetailBody({ sprint, projectName }: { sprint: SprintRow; projectName: string | null }) {
  const itemsQ = useQuery({
    queryKey: ["sprint_items", "byId", sprint.id],
    queryFn: () => listItemsBySprint(sprint.id),
  });
  const membersQ = useQuery({ queryKey: ["team_members"], queryFn: listTeamMembers });
  const membersById = useMemo(() => {
    const m = new Map<string, TeamMember>();
    for (const it of membersQ.data ?? []) m.set(it.id, it);
    return m;
  }, [membersQ.data]);

  const status = getSprintStatusLabel(sprint.status);
  const items: SprintItemRow[] = itemsQ.data ?? [];
  const grouped = STATUS_COLUMNS.map((s) => ({
    status: s,
    items: items.filter((it: SprintItemRow) => it.status === s),
  }));
  const extras = items.filter(
    (it: SprintItemRow) => !STATUS_COLUMNS.includes(it.status as (typeof STATUS_COLUMNS)[number]),
  );
  if (extras.length) grouped.push({ status: "Outros" as (typeof STATUS_COLUMNS)[number], items: extras });

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-1.5 text-xs uppercase tracking-wider text-muted-foreground"
        >
          <Link to="/sprints" className="hover:text-foreground">Sprints</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-foreground">{sprint.nome}</span>
        </nav>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">{sprint.nome}</h1>
          <Badge variant="outline" className={cn(getSprintStatusColor(sprint.status))}>
            <Timer className="mr-1 h-3 w-3" /> {status}
          </Badge>
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <Calendar className="h-3.5 w-3.5" /> {fmtDate(sprint.data_inicio)} – {fmtDate(sprint.data_fim)}
          </span>
        </div>
        <p className="text-sm text-muted-foreground">
          {projectName ? `Projeto: ${projectName}` : "Sprint do Altech Project."}
        </p>
      </header>

      <WidgetCard>
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-xs uppercase tracking-wider text-muted-foreground">
            <Target className="h-3.5 w-3.5" /> Objetivo
          </div>
          <p className="text-sm text-foreground">{sprint.meta ?? "Sem objetivo definido."}</p>
        </div>
      </WidgetCard>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Itens da sprint</h2>
          <span className="text-xs text-muted-foreground">{items.length} {items.length === 1 ? "item" : "itens"}</span>
        </div>

        {itemsQ.isLoading ? (
          <LoadingState variant="skeleton" rows={3} />
        ) : itemsQ.error ? (
          <ErrorState
            title="Não foi possível carregar os itens"
            description={formatSupabaseError(itemsQ.error, "Erro ao carregar itens da sprint.")}
            onRetry={() => void itemsQ.refetch()}
          />
        ) : items.length === 0 ? (
          <EmptyState
            icon={<Target className="h-5 w-5" />}
            title="Nenhum item na sprint"
            description="Vincule work items a esta sprint para acompanhá-los aqui."
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {grouped.map((group) => (
              <WidgetCard key={group.status}>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-foreground">{group.status}</h3>
                    <Badge variant="secondary" className="text-xs">{group.items.length}</Badge>
                  </div>
                  {group.items.length === 0 ? (
                    <p className="text-xs text-muted-foreground">Sem itens neste status.</p>
                  ) : (
                    <ul className="space-y-2">
                      {group.items.map((it) => (
                        <li key={it.id} className="rounded-md border border-border/60 bg-card/40 p-3">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm font-medium text-foreground">{it.titulo}</p>
                            <Badge variant="outline" className="text-[10px] uppercase">{it.tipo}</Badge>
                          </div>
                          <div className="mt-1.5 flex items-center justify-between text-xs text-muted-foreground">
                            <span className="truncate">{it.project_id}</span>
                            {it.responsavel ? (
                              <span className="inline-flex items-center gap-1">
                                <User className="h-3 w-3" /> {it.responsavel}
                              </span>
                            ) : null}
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </WidgetCard>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
