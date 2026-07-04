import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight, SearchX, KanbanSquare } from "lucide-react";
import { WidgetCard } from "@/components/dashboard/WidgetCard";
import { Badge } from "@/components/ui/badge";
import { LoadingState, EmptyState, ErrorState } from "@/components/states";
import { getBoard } from "@/lib/boards-api";
import { listProjects } from "@/lib/projects-api";
import { formatSupabaseError } from "@/lib/supabase-errors";

export const Route = createFileRoute("/_workspace/boards/$boardId")({
  head: () => ({ meta: [{ title: "Board · Altech Project" }] }),
  component: BoardDetailPage,
});

function BoardDetailPage() {
  const { boardId } = Route.useParams();

  const boardQ = useQuery({
    queryKey: ["boards", "detail", boardId],
    queryFn: () => getBoard(boardId),
  });
  const projectsQ = useQuery({ queryKey: ["projects", "all"], queryFn: listProjects });

  if (boardQ.isLoading) return <LoadingState variant="skeleton" rows={2} />;

  if (boardQ.error) {
    return (
      <ErrorState
        title="Não foi possível carregar o board"
        description={formatSupabaseError(boardQ.error, "Erro ao carregar board.")}
        onRetry={() => void boardQ.refetch()}
      />
    );
  }

  const board = boardQ.data;
  if (!board) {
    return (
      <EmptyState
        icon={<SearchX className="h-5 w-5" />}
        title="Board não encontrado"
        description="Verifique o endereço ou volte para a lista de boards."
        action={
          <Link
            to="/boards"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Voltar para Boards
          </Link>
        }
      />
    );
  }

  const project = (projectsQ.data ?? []).find((p) => p.id === board.project_id);

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-1.5 text-xs uppercase tracking-wider text-muted-foreground"
        >
          <Link to="/boards" className="hover:text-foreground">Boards</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-foreground">{board.name}</span>
        </nav>
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">{board.name}</h1>
          <Badge variant="secondary">
            <KanbanSquare className="mr-1 h-3 w-3" /> Board
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          {board.description ?? "Board do workspace Altech Project."}
        </p>
      </header>

      <WidgetCard>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Projeto</span>
            <span className="font-medium text-foreground">{project?.nome ?? "—"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Slug do projeto</span>
            <code className="text-xs text-foreground">{project?.slug ?? "—"}</code>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">ID do board</span>
            <code className="text-xs text-foreground">{board.id}</code>
          </div>
        </div>
      </WidgetCard>
    </div>
  );
}
