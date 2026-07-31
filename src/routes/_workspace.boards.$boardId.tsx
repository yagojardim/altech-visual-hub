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
import { Chip, StatusBadge } from "@/components/ui/chip";
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
  status: string | null;
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
    .select("id, board_id, column_id, title, type, priority, status, assignee_id, position")
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

import { typeMeta, priorityMeta } from "@/lib/work-item-type-style";

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
          <Chip label="Board" variant="accent" size="sm" icon={<KanbanSquare className="h-3 w-3" />} />
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
                  columns={columns}
                  items={itemsByColumn.get(col.id) ?? []}
                  membersById={membersById}
                  loading={itemsQ.isLoading}
                  onMove={moveItem}
                />
              ))}
        </div>
      </div>
    </div>
  );
}

function BoardColumnView({
  column,
  columns,
  items,
  membersById,
  loading,
  onMove,
}: {
  column: BoardColumn;
  columns: BoardColumn[];
  items: KanbanItem[];
  membersById: Map<string, Member>;
  loading: boolean;
  onMove: (item: KanbanItem, target: BoardColumn) => void | Promise<void>;
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
              columns={columns}
              onMove={onMove}
            />
          ))
        )}
      </div>
    </section>
  );
}

function ItemCard({
  item,
  member,
  columns,
  onMove,
}: {
  item: KanbanItem;
  member: Member | null;
  columns: BoardColumn[];
  onMove: (item: KanbanItem, target: BoardColumn) => void | Promise<void>;
}) {
  const tMeta = typeMeta(item.type);
  const pMeta = priorityMeta(item.priority);
  const avatarBg = member?.avatar_color ?? "#3f3f46";
  const label = member?.name ?? "Sem responsável";
  const others = columns.filter((c) => c.id !== item.column_id);
  return (
    <article className="rounded-lg border border-border bg-panel-elevated p-3 shadow-sm transition-colors hover:border-primary/40">
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-sm font-medium text-foreground line-clamp-2">{item.title}</h3>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="-mr-1 h-6 w-6 shrink-0 text-muted-foreground hover:text-foreground"
              aria-label="Mover card"
            >
              <MoveRight className="h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuLabel className="text-[11px] uppercase tracking-wider text-muted-foreground">
              Mover para
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {others.length === 0 ? (
              <DropdownMenuItem disabled>Sem outras colunas</DropdownMenuItem>
            ) : (
              others.map((c) => (
                <DropdownMenuItem key={c.id} onSelect={() => void onMove(item, c)}>
                  {c.name}
                </DropdownMenuItem>
              ))
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        {item.type && (
          <Chip
            label={tMeta.label}
            variant="custom"
            color={tMeta.color}
            size="xs"
            dot
            className="uppercase tracking-wide"
          />
        )}
        {pMeta && (
          <Chip label={pMeta.label} variant="custom" color={pMeta.color} size="xs" dot />
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
