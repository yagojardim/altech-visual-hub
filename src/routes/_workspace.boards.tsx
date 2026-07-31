import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { KanbanSquare, ChevronRight } from "lucide-react";
import { z } from "zod";

import { useCan } from "@/lib/auth";
import { UnauthorizedState, LoadingState, EmptyState, ErrorState } from "@/components/states";
import { WidgetCard } from "@/components/dashboard/WidgetCard";
import { Chip } from "@/components/ui/chip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { listBoards } from "@/lib/boards-api";
import { listProjects } from "@/lib/projects-api";
import { qk } from "@/lib/query-keys";
import { formatSupabaseError } from "@/lib/supabase-errors";

const searchSchema = z.object({
  project: z.string().optional(),
});

export const Route = createFileRoute("/_workspace/boards")({
  head: () => ({ meta: [{ title: "Boards · Altech Project" }] }),
  validateSearch: (search) => searchSchema.parse(search),

  component: BoardsPage,
});

function BoardsPage() {
  const canView = useCan("board.view");
  const navigate = Route.useNavigate();
  const { project: projectFilter } = Route.useSearch();

  const projectsQ = useQuery({ queryKey: qk.projects(), queryFn: listProjects });
  const boardsQ = useQuery({ queryKey: ["boards", "all"], queryFn: listBoards });

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

  const filteredBoards = useMemo(() => {
    const boards = boardsQ.data ?? [];
    if (!projectFilter || projectFilter === "all") return boards;
    const pid = projectBySlug.get(projectFilter) ?? projectFilter;
    return boards.filter((b) => b.project_id === pid);
  }, [boardsQ.data, projectFilter, projectBySlug]);

  if (!canView) return <UnauthorizedState />;

  const loading = boardsQ.isLoading || projectsQ.isLoading;
  const error =
    boardsQ.error
      ? formatSupabaseError(boardsQ.error, "Erro ao carregar boards.")
      : null;

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-1.5 text-xs uppercase tracking-wider text-muted-foreground"
        >
          <span>Workspace</span>
          <ChevronRight className="h-3 w-3" />
          <span className="text-foreground">Boards</span>
        </nav>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0 space-y-1">
            <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">Boards</h1>
            <p className="text-sm text-muted-foreground">
              Boards do workspace Altech Project.
            </p>
          </div>
          <div className="w-full sm:w-64">
            <Select
              value={projectFilter ?? "all"}
              onValueChange={(v) =>
                navigate({
                  search: { project: v === "all" ? undefined : v },
                })
              }

            >
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por projeto" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os projetos</SelectItem>
                {(projectsQ.data ?? []).map((p) => (
                  <SelectItem key={p.id} value={p.slug}>
                    {p.nome}
                  </SelectItem>
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
          title="Não foi possível carregar os boards"
          description={error}
          onRetry={() => void boardsQ.refetch()}
        />
      ) : filteredBoards.length === 0 ? (
        <EmptyState
          icon={<KanbanSquare className="h-5 w-5" />}
          title="Nenhum board por aqui"
          description={
            projectFilter
              ? "Não há boards para o projeto selecionado."
              : "Ainda não existem boards cadastrados."
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filteredBoards.map((b) => {
            const proj = b.project_id ? projectById.get(b.project_id) : undefined;
            return (
              <Link
                key={b.id}
                to="/boards/$boardId"
                params={{ boardId: b.id }}
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
                      <h3 className="truncate text-base font-semibold text-foreground">{b.name}</h3>
                    </div>
                    <Badge variant="secondary" className="shrink-0">
                      <KanbanSquare className="mr-1 h-3 w-3" /> Board
                    </Badge>
                  </div>
                  <p className="line-clamp-2 text-sm text-muted-foreground">
                    {b.description ?? "Board do workspace Altech Project."}
                  </p>
                  <div className="mt-auto pt-2 text-xs text-muted-foreground">
                    Projeto: <span className="text-foreground">{proj?.nome ?? "—"}</span>
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
