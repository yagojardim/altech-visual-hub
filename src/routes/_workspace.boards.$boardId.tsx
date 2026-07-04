import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronRight, SearchX, KanbanSquare, MoveRight } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { logSupabaseError, formatSupabaseError } from "@/lib/supabase-errors";
import { getBoard } from "@/lib/boards-api";
import { listProjects } from "@/lib/projects-api";
import { useAuth } from "@/lib/auth";
import { auditLog } from "@/lib/audit-log";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState, ErrorState } from "@/components/states";
import { cn } from "@/lib/utils";


export const Route = createFileRoute("/_workspace/boards/$boardId")({
  head: () => ({ meta: [{ title: "Board · Altech Project" }] }),
  component: BoardKanbanPage,
});

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
  title: string;
  type: string | null;
  priority: string | null;
  assignee_id: string | null;
  position: number | null;
}

interface Member {
  id: string;
  name: string;
  avatar_color: string | null;
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
    .select("id, board_id, column_id, title, type, priority, assignee_id, position")
    .eq("board_id", boardId)
    .order("position", { ascending: true });
  if (error) { logSupabaseError("work_items:byBoard", error); throw error; }
  return (data ?? []) as KanbanItem[];
}

async function listMembers(): Promise<Member[]> {
  const { data, error } = await supabase
    .from("team_members")
    .select("id, name, avatar_color");
  if (error) { logSupabaseError("team_members:list", error); throw error; }
  return (data ?? []) as Member[];
}

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

function initials(name: string | null | undefined): string {
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
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const itemsKey = ["work_items", "by_board", boardId] as const;

  const boardQ = useQuery({ queryKey: ["boards", "detail", boardId], queryFn: () => getBoard(boardId) });
  const projectsQ = useQuery({ queryKey: ["projects"], queryFn: listProjects });
  const columnsQ = useQuery({ queryKey: ["board_columns", boardId], queryFn: () => listColumns(boardId) });
  const itemsQ = useQuery({ queryKey: itemsKey, queryFn: () => listBoardItems(boardId) });
  const membersQ = useQuery({ queryKey: ["team_members"], queryFn: listMembers });

  const loading = boardQ.isLoading || columnsQ.isLoading || itemsQ.isLoading;
  const anyError = boardQ.error ?? columnsQ.error ?? itemsQ.error;

  const moveItem = async (item: KanbanItem, target: BoardColumn) => {
    if (item.column_id === target.id) return;
    const columns = columnsQ.data ?? [];
    const beforeCol = columns.find((c) => c.id === item.column_id) ?? null;
    const current = itemsQ.data ?? [];
    const targetItems = current.filter((i) => i.column_id === target.id);
    const nextPosition = targetItems.reduce((max, i) => Math.max(max, i.position ?? 0), 0) + 1;

    // Optimistic update
    const previous = current;
    const optimistic = current.map((i) =>
      i.id === item.id
        ? { ...i, column_id: target.id, status: target.name, position: nextPosition }
        : i,
    );
    queryClient.setQueryData<KanbanItem[]>([...itemsKey], optimistic);

    const { error } = await supabase
      .from("work_items")
      .update({ column_id: target.id, status: target.name, position: nextPosition })
      .eq("id", item.id);

    if (error) {
      logSupabaseError("work_items:moveCard", error);
      queryClient.setQueryData<KanbanItem[]>([...itemsKey], previous);
      toast.error(formatSupabaseError(error, "Não foi possível mover o card."));
      return;
    }

    toast.success(`Movido para “${target.name}”`);
    void auditLog({
      event: "work_item.status.changed",
      actor_id: user?.id ?? null,
      actor_name: user?.name ?? null,
      entity_type: "work_item",
      entity_id: item.id,
      before: { column_id: item.column_id, column_name: beforeCol?.name ?? null, status: item.status ?? null },
      after: { column_id: target.id, column_name: target.name, status: target.name },
    });
    void queryClient.invalidateQueries({ queryKey: [...itemsKey] });
  };


  const membersById = useMemo(() => {
    const m = new Map<string, Member>();
    for (const it of membersQ.data ?? []) m.set(it.id, it);
    return m;
  }, [membersQ.data]);

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
          {project ? `Projeto: ${project.nome}` : "Kanban do Altech Project."}
        </p>
      </header>

      <div className="-mx-4 overflow-x-auto px-4 pb-2">
        <div className="flex min-w-full gap-4">
          {loading && columns.length === 0
            ? Array.from({ length: 4 }).map((_, i) => <ColumnSkeleton key={i} />)
            : columns.map((col) => (
                <BoardColumnView
                  key={col.id}
                  column={col}
                  items={itemsByColumn.get(col.id) ?? []}
                  membersById={membersById}
                  loading={itemsQ.isLoading}
                />
              ))}
        </div>
      </div>
    </div>
  );
}

function BoardColumnView({
  column,
  items,
  membersById,
  loading,
}: {
  column: BoardColumn;
  items: KanbanItem[];
  membersById: Map<string, Member>;
  loading: boolean;
}) {
  return (
    <section className="flex w-72 shrink-0 flex-col gap-3 rounded-xl border border-border bg-panel p-3">
      <header className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-foreground">{column.name}</h2>
        <span className="rounded-full bg-panel-elevated px-2 py-0.5 text-[11px] text-muted-foreground">
          {loading ? "…" : items.length}
        </span>
      </header>
      <div className="flex min-h-[80px] flex-col gap-2">
        {loading ? (
          <>
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </>
        ) : items.length === 0 ? (
          <div className="rounded-md border border-dashed border-border px-3 py-6 text-center text-xs text-muted-foreground">
            Sem itens
          </div>
        ) : (
          items.map((it) => (
            <ItemCard
              key={it.id}
              item={it}
              member={it.assignee_id ? membersById.get(it.assignee_id) ?? null : null}
            />
          ))
        )}
      </div>
    </section>
  );
}

function ItemCard({ item, member }: { item: KanbanItem; member: Member | null }) {
  const typeKey = (item.type ?? "").toLowerCase();
  const prioKey = (item.priority ?? "").toLowerCase();
  const avatarBg = member?.avatar_color ?? "#3f3f46";
  const label = member?.name ?? "Sem responsável";
  return (
    <article className="rounded-lg border border-border bg-panel-elevated p-3 shadow-sm transition-colors hover:border-primary/40">
      <h3 className="text-sm font-medium text-foreground line-clamp-2">{item.title}</h3>
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        {item.type && (
          <Badge variant="outline" className={cn("text-[10px] capitalize", TYPE_VARIANTS[typeKey] ?? "")}>
            {item.type}
          </Badge>
        )}
        {item.priority && (
          <Badge variant="outline" className={cn("text-[10px] capitalize", PRIORITY_VARIANTS[prioKey] ?? "")}>
            {item.priority}
          </Badge>
        )}
      </div>
      <div className="mt-3 flex items-center gap-2">
        <div
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold text-white"
          style={{ background: avatarBg }}
          aria-hidden="true"
          title={label}
        >
          {initials(member?.name ?? null)}
        </div>
        <span className="truncate text-[11px] text-muted-foreground">{label}</span>
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
