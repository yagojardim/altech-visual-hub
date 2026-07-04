import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight, SearchX, Calendar, Target, Timer } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { logSupabaseError, formatSupabaseError } from "@/lib/supabase-errors";
import { listProjects } from "@/lib/projects-api";
import { type SprintRow } from "@/lib/sprints-api";
import { getSprintStatusColor, getSprintStatusLabel } from "@/lib/sprint-status";
import { WidgetCard } from "@/components/dashboard/WidgetCard";
import { Badge } from "@/components/ui/badge";
import { LoadingState, EmptyState, ErrorState } from "@/components/states";
import { cn } from "@/lib/utils";

async function getSprint(id: string): Promise<SprintRow | null> {
  const { data, error } = await supabase
    .from("sprints")
    .select("id, project_id, tenant_id, nome, meta, data_inicio, data_fim, status, created_at, updated_at")
    .eq("id", id)
    .maybeSingle();
  if (error) { logSupabaseError("sprints:get", error); throw error; }
  return (data as SprintRow | null) ?? null;
}

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

  const project = (projectsQ.data ?? []).find((p) => p.id === sprint.project_id);
  const status = getSprintStatusLabel(sprint.status);

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
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">{sprint.nome}</h1>
          <Badge variant="outline" className={cn(getSprintStatusColor(sprint.status))}>
            <Timer className="mr-1 h-3 w-3" /> {status}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          {project ? `Projeto: ${project.nome}` : "Sprint do Altech Project."}
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        <WidgetCard>
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs uppercase tracking-wider text-muted-foreground">
              <Target className="h-3.5 w-3.5" /> Objetivo
            </div>
            <p className="text-sm text-foreground">{sprint.meta ?? "Sem objetivo definido."}</p>
          </div>
        </WidgetCard>
        <WidgetCard>
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs uppercase tracking-wider text-muted-foreground">
              <Calendar className="h-3.5 w-3.5" /> Período
            </div>
            <p className="text-sm text-foreground">
              {fmtDate(sprint.data_inicio)} – {fmtDate(sprint.data_fim)}
            </p>
          </div>
        </WidgetCard>
      </div>
    </div>
  );
}
