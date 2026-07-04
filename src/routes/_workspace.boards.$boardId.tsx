import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronRight, SearchX, KanbanSquare } from "lucide-react";
import {
  DndContext,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { logSupabaseError, formatSupabaseError } from "@/lib/supabase-errors";
import { getBoard } from "@/lib/boards-api";
import { listProjects } from "@/lib/projects-api";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState, ErrorState } from "@/components/states";
import { cn } from "@/lib/utils";


interface BoardColumn {
  id: string;
  board_id: string;
  name: string;
  position: number;
}

interface KanbanItem {
  id: string;
  board_id: string | null;
  column_id: string | null;
  titulo: string;
  tipo: string;
  prioridade: string;
  responsavel: string | null;
  position: number;
}

async function listColumns(boardId: string): Promise<BoardColumn[]> {
  const { data, error } = await supabase
    .from("board_columns")
    .select("id, board_id, name, position")
    .eq("board_id", boardId)
    .order("position", { ascending: true });
  if (error) { logSupabaseError("board_columns:list", error); throw error; }
  return (data ?? []) as BoardColumn[];
}

async function listBoardItems(boardId: string): Promise<KanbanItem[]> {
  const { data, error } = await supabase
    .from("work_items")
    .select("id, board_id, column_id, titulo, tipo, prioridade, responsavel, position")
    .eq("board_id", boardId)
    .order("position", { ascending: true });
  if (error) { logSupabaseError("work_items:byBoard", error); throw error; }
  return (data ?? []) as KanbanItem[];
}

export const Route = createFileRoute("/_workspace/boards/$boardId")({
  head: () => ({ meta: [{ title: "Board · Altech Project" }] }),
  component: BoardKanbanPage,
});

const TYPE_VARIANTS: Record<string, string> = {
  story: "bg-blue-500/10 text-blue-400 border-blue-500/30",
  história: "bg-blue-500/10 text-blue-400 border-blue-500/30",
  historia: "bg-blue-500/10 text-blue-400 border-blue-500/30",
  task: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
  tarefa: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
  bug: "bg-red-500/10 text-red-400 border-red-500/30",
  risk: "bg-amber-500/10 text-amber-400 border-amber-500/30",
  épico: "bg-purple-500/10 text-purple-400 border-purple-500/30",
  epico: "bg-purple-500/10 text-purple-400 border-purple-500/30",
};

const PRIORITY_VARIANTS: Record<string, string> = {
  baixa: "bg-muted text-muted-foreground border-border",
  media: "bg-blue-500/10 text-blue-400 border-blue-500/30",
  média: "bg-blue-500/10 text-blue-400 border-blue-500/30",
  alta: "bg-amber-500/10 text-amber-400 border-amber-500/30",
  critica: "bg-red-500/10 text-red-400 border-red-500/30",
  crítica: "bg-red-500/10 text-red-400 border-red-500/30",
};

function initials(name: string | null): string {
  if (!name) return "—";
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase() ?? "")
    .join("") || "—";
}

function BoardKanbanPage() {
  const { boardId } = Route.useParams();

  const boardQ = useQuery({ queryKey: ["boards", "detail", boardId], queryFn: () => getBoard(boardId) });
  const projectsQ = useQuery({ queryKey: ["projects", "all"], queryFn: listProjects });
  const columnsQ = useQuery({ queryKey: ["board_columns", boardId], queryFn: () => listColumns(boardId) });
  const itemsQ = useQuery({ queryKey: ["work_items", "byBoard", boardId], queryFn: () => listBoardItems(boardId) });

  const loading = boardQ.isLoading || columnsQ.isLoading || itemsQ.isLoading;
  const anyError = boardQ.error ?? columnsQ.error ?? itemsQ.error;

  const itemsByColumn = useMemo(() => {
    const m = new Map<string, KanbanItem[]>();
    for (const it of itemsQ.data ?? []) {
      const key = it.column_id ?? "__none__";
      if (!m.has(key)) m.set(key, []);
      m.get(key)!.push(it);
    }
    return m;
  }, [itemsQ.data]);

  if (anyError) {
    return (
      <ErrorState
        title="Não foi possível carregar o board"
        description={formatSupabaseError(anyError, "Erro ao carregar Kanban.")}
        onRetry={() => {
          void boardQ.refetch();
          void columnsQ.refetch();
          void itemsQ.refetch();
        }}
      />
    );
  }

  if (!loading && !boardQ.data) {
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

  const board = boardQ.data;
  const project = board ? (projectsQ.data ?? []).find((p) => p.id === board.project_id) : undefined;
  const columns = columnsQ.data ?? [];

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-1.5 text-xs uppercase tracking-wider text-muted-foreground"
        >
          <Link to="/boards" className="hover:text-foreground">Boards</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-foreground">{board?.name ?? "…"}</span>
        </nav>
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
            {board?.name ?? <Skeleton className="inline-block h-6 w-40" />}
          </h1>
          <Badge variant="secondary"><KanbanSquare className="mr-1 h-3 w-3" /> Board</Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          {project ? `Projeto: ${project.nome}` : "Kanban read-only do Altech Project."}
        </p>
      </header>

      <div className="-mx-4 overflow-x-auto px-4 pb-2">
        <div className="flex min-w-full gap-4">
          {loading && columns.length === 0
            ? Array.from({ length: 4 }).map((_, i) => <ColumnSkeleton key={i} />)
            : columns.map((col) => {
                const items = itemsByColumn.get(col.id) ?? [];
                return (
                  <section
                    key={col.id}
                    className="flex w-72 shrink-0 flex-col gap-3 rounded-xl border border-border bg-panel p-3"
                  >
                    <header className="flex items-center justify-between">
                      <h2 className="text-sm font-medium text-foreground">{col.name}</h2>
                      <span className="rounded-full bg-panel-elevated px-2 py-0.5 text-[11px] text-muted-foreground">
                        {items.length}
                      </span>
                    </header>

                    <div className="flex flex-col gap-2">
                      {items.length === 0 ? (
                        <div className="rounded-md border border-dashed border-border px-3 py-6 text-center text-xs text-muted-foreground">
                          Sem itens
                        </div>
                      ) : (
                        items.map((it) => <ItemCard key={it.id} item={it} />)
                      )}
                    </div>
                  </section>
                );
              })}
        </div>
      </div>
    </div>
  );
}

function ItemCard({ item }: { item: KanbanItem }) {
  const typeKey = item.tipo?.toLowerCase() ?? "";
  const prioKey = item.prioridade?.toLowerCase() ?? "";
  return (
    <article className="rounded-lg border border-border bg-panel-elevated p-3 shadow-sm transition-colors hover:border-primary/40">
      <h3 className="text-sm font-medium text-foreground line-clamp-2">{item.titulo}</h3>
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <Badge variant="outline" className={cn("text-[10px]", TYPE_VARIANTS[typeKey] ?? "")}>
          {item.tipo}
        </Badge>
        <Badge variant="outline" className={cn("text-[10px]", PRIORITY_VARIANTS[prioKey] ?? "")}>
          {item.prioridade}
        </Badge>
      </div>
      <div className="mt-3 flex items-center justify-between">
        <Avatar className="h-6 w-6">
          <AvatarFallback className="text-[10px]">{initials(item.responsavel)}</AvatarFallback>
        </Avatar>
        <span className="truncate text-[11px] text-muted-foreground">{item.responsavel ?? "—"}</span>
      </div>
    </article>
  );
}

function ColumnSkeleton() {
  return (
    <section className="flex w-72 shrink-0 flex-col gap-3 rounded-xl border border-border bg-panel p-3">
      <Skeleton className="h-4 w-24" />
      {Array.from({ length: 3 }).map((_, i) => (
        <Skeleton key={i} className="h-20 w-full" />
      ))}
    </section>
  );
}
