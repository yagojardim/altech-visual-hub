import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { Timer, ChevronRight, Calendar, Target } from "lucide-react";
import { useCan } from "@/lib/auth";
import { UnauthorizedState, LoadingState, EmptyState, ErrorState } from "@/components/states";
import { WidgetCard } from "@/components/dashboard/WidgetCard";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { listSprints } from "@/lib/sprints-api";
import { listProjects } from "@/lib/projects-api";
import { formatSupabaseError } from "@/lib/supabase-errors";
import { getSprintStatusColor, getSprintStatusLabel } from "@/lib/sprint-status";
import { cn } from "@/lib/utils";

const searchSchema = z.object({ project: z.string().optional() });

export const Route = createFileRoute("/_workspace/sprints")({
  head: () => ({ meta: [{ title: "Sprints · Altech Project" }] }),
  validateSearch: (search) => searchSchema.parse(search),
  component: SprintsPage,
});

function fmtDate(s: string | null): string {
  if (!s) return "—";
  const [y, m, d] = s.split("-");
  return y && m && d ? `${d}/${m}/${y}` : s;
}

function fmtRange(a: string | null, b: string | null) {
  if (a && b) return `${fmtDate(a)} – ${fmtDate(b)}`;
  return fmtDate(a) !== "—" ? fmtDate(a) : fmtDate(b);
}

function SprintsPage() {
  const canView = useCan("workitem.view");
  const navigate = Route.useNavigate();
  const { project: projectFilter } = Route.useSearch();

  const projectsQ = useQuery({ queryKey: ["projects", "all"], queryFn: listProjects });
  const sprintsQ = useQuery({ queryKey: ["sprints", "all"], queryFn: listSprints });

  const projectById = useMemo(() => {
    const m = new Map<string, { nome: string; slug: string }>();
    for (const p of projectsQ.data ?? []) m.set(p.id, { nome: p.nome, slug: p.slug });
    return m;
  }, [projectsQ.data]);

  const projectBySlug = useMemo(() => {
    const m = new Map<string, string>();
    for (const p of projectsQ.data ?? []) m.set(p.slug, p.id);
    return m;
  }, [projectsQ.data]);

  const filtered = useMemo(() => {
    const rows = sprintsQ.data ?? [];
    if (!projectFilter || projectFilter === "all") return rows;
    const pid = projectBySlug.get(projectFilter) ?? projectFilter;
    return rows.filter((s) => s.project_id === pid);
  }, [sprintsQ.data, projectFilter, projectBySlug]);

  if (!canView) return <UnauthorizedState />;

  const loading = sprintsQ.isLoading || projectsQ.isLoading;
  const error = sprintsQ.error ? formatSupabaseError(sprintsQ.error, "Erro ao carregar sprints.") : null;

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-1.5 text-xs uppercase tracking-wider text-muted-foreground"
        >
          <span>Workspace</span>
          <ChevronRight className="h-3 w-3" />
          <span className="text-foreground">Sprints</span>
        </nav>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0 space-y-1">
            <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">Sprints</h1>
            <p className="text-sm text-muted-foreground">
              Sprints do workspace Altech Project.
            </p>
          </div>
          <div className="w-full sm:w-64">
            <Select
              value={projectFilter ?? "all"}
              onValueChange={(v) => navigate({ search: { project: v === "all" ? undefined : v } })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por projeto" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os projetos</SelectItem>
                {(projectsQ.data ?? []).map((p) => (
                  <SelectItem key={p.id} value={p.slug}>{p.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </header>

      {loading ? (
        <LoadingState variant="skeleton" />
      ) : error ? (
        <ErrorState
          title="Não foi possível carregar as sprints"
          description={error}
          onRetry={() => void sprintsQ.refetch()}
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Timer className="h-5 w-5" />}
          title="Nenhuma sprint por aqui"
          description={
            projectFilter
              ? "Não há sprints para o projeto selecionado."
              : "Ainda não existem sprints cadastradas."
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((s) => {
            const proj = projectById.get(s.project_id);
            const status = getSprintStatusLabel(s.status);
            return (
              <Link
                key={s.id}
                to="/sprints/$sprintId"
                params={{ sprintId: s.id }}
                className="block focus:outline-none"
              >
                <WidgetCard
                  hover
                  className="flex h-full flex-col gap-3 focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 space-y-1">
                      <code className="rounded bg-panel-elevated px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-primary">
                        {proj?.slug ?? "sem-projeto"}
                      </code>
                      <h3 className="truncate text-base font-semibold text-foreground">{s.nome}</h3>
                    </div>
                    <Badge variant="outline" className={cn("shrink-0", getSprintStatusColor(s.status))}>
                      {status}
                    </Badge>
                  </div>
                  <p className="line-clamp-2 text-sm text-muted-foreground">
                    <Target className="mr-1 inline h-3.5 w-3.5 text-muted-foreground" />
                    {s.meta ?? "Sem objetivo definido."}
                  </p>
                  <div className="mt-auto flex items-center justify-between pt-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5" />
                      {fmtRange(s.data_inicio, s.data_fim) || "—"}
                    </span>
                    <span className="truncate">{proj?.nome ?? "—"}</span>
                  </div>
                </WidgetCard>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
