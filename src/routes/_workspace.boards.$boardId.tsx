import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState, useRef, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronRight, SearchX, KanbanSquare, Plus } from "lucide-react";
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
import { qk } from "@/lib/query-keys";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState, ErrorState } from "@/components/states";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { WorkItemDrawer } from "@/components/work-items/WorkItemDrawer";



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
  const queryClient = useQueryClient();
  const itemsKey = qk.workItemsByBoard(boardId);
  const [openItemId, setOpenItemId] = useState<string | null>(null);

  const boardQ = useQuery({ queryKey: ["boards", "detail", boardId], queryFn: () => getBoard(boardId) });
  const projectsQ = useQuery({ queryKey: qk.projects(), queryFn: listProjects });
  const columnsQ = useQuery({ queryKey: ["board_columns", boardId], queryFn: () => listColumns(boardId) });
  const itemsQ = useQuery({ queryKey: itemsKey, queryFn: () => listBoardItems(boardId) });

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

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

  const handleDragEnd = async (event: DragEndEvent) => {
    const itemId = String(event.active.id);
    const overId = event.over?.id ? String(event.over.id) : null;
    if (!overId) return;
    const current = itemsQ.data ?? [];
    const item = current.find((i) => i.id === itemId);
    if (!item || item.column_id === overId) return;

    const targetItems = current.filter((i) => i.column_id === overId);
    const nextPosition = targetItems.reduce((max, i) => Math.max(max, i.position ?? 0), 0) + 1;

    const previous = current;
    const optimistic = current.map((i) =>
      i.id === itemId ? { ...i, column_id: overId, position: nextPosition } : i,
    );
    queryClient.setQueryData<KanbanItem[]>(itemsKey, optimistic);

    const { error } = await supabase
      .from("work_items")
      .update({ column_id: overId, position: nextPosition })
      .eq("id", itemId);

    if (error) {
      logSupabaseError("work_items:moveCard", error);
      queryClient.setQueryData<KanbanItem[]>(itemsKey, previous);
      toast.error(formatSupabaseError(error, "Não foi possível mover o card."));
      return;
    }
    void queryClient.invalidateQueries({ queryKey: qk.workItems() });
  };

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

      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <div className="-mx-4 overflow-x-auto px-4 pb-2">
          <div className="flex min-w-full gap-4">
            {loading && columns.length === 0
              ? Array.from({ length: 4 }).map((_, i) => <ColumnSkeleton key={i} />)
              : columns.map((col) => (
                  <DroppableColumn
                    key={col.id}
                    column={col}
                    items={itemsByColumn.get(col.id) ?? []}
                    boardId={boardId}
                    projectId={board?.project_id ?? null}
                    onCreated={() => void queryClient.invalidateQueries({ queryKey: qk.workItems() })}
                    onOpenItem={setOpenItemId}
                  />
                ))}

          </div>
        </div>
      </DndContext>
      <WorkItemDrawer
        itemId={openItemId}
        open={!!openItemId}
        onOpenChange={(o) => { if (!o) setOpenItemId(null); }}
        onChanged={() => { void queryClient.invalidateQueries({ queryKey: qk.workItems() }); }}
      />
    </div>
  );
}

function DroppableColumn({
  column,
  items,
  boardId,
  projectId,
  onCreated,
  onOpenItem,
}: {
  column: BoardColumn;
  items: KanbanItem[];
  boardId: string;
  projectId: string | null;
  onCreated: () => void;
  onOpenItem: (id: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState("");
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (adding) inputRef.current?.focus();
  }, [adding]);

  const cancel = () => {
    setAdding(false);
    setTitle("");
  };

  const submit = async () => {
    const titulo = title.trim();
    if (!titulo) { cancel(); return; }
    if (!projectId) {
      toast.error("Board sem projeto associado.");
      return;
    }
    setSaving(true);
    const nextPosition = items.reduce((max, i) => Math.max(max, i.position ?? 0), 0) + 1;
    const { error } = await supabase.from("work_items").insert({
      board_id: boardId,
      column_id: column.id,
      project_id: projectId,
      titulo,
      tipo: "task",
      prioridade: "media",
      position: nextPosition,
    });
    setSaving(false);
    if (error) {
      logSupabaseError("work_items:insert", error);
      toast.error(formatSupabaseError(error, "Não foi possível criar o card."));
      return;
    }
    setTitle("");
    setAdding(false);
    onCreated();
  };

  return (
    <section
      ref={setNodeRef}
      className={cn(
        "flex w-72 shrink-0 flex-col gap-3 rounded-xl border border-border bg-panel p-3 transition-colors",
        isOver && "border-primary/60 bg-panel-elevated",
      )}
    >
      <header className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-foreground">{column.name}</h2>
        <span className="rounded-full bg-panel-elevated px-2 py-0.5 text-[11px] text-muted-foreground">
          {items.length}
        </span>
      </header>
      <div className="flex min-h-[80px] flex-col gap-2">
        {items.length === 0 && !adding ? (
          <div className="rounded-md border border-dashed border-border px-3 py-6 text-center text-xs text-muted-foreground">
            Sem itens
          </div>
        ) : (
          items.map((it) => <DraggableItemCard key={it.id} item={it} onOpen={onOpenItem} />)
        )}
      </div>

      {adding ? (
        <div className="space-y-2">
          <Input
            ref={inputRef}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") { e.preventDefault(); void submit(); }
              if (e.key === "Escape") { e.preventDefault(); cancel(); }
            }}
            placeholder="Título do card"
            disabled={saving}
            className="h-8 text-sm"
          />
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={() => void submit()} disabled={saving} className="h-7">
              {saving ? "Salvando..." : "Adicionar"}
            </Button>
            <Button size="sm" variant="ghost" onClick={cancel} disabled={saving} className="h-7">
              Cancelar
            </Button>
          </div>
        </div>
      ) : (
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setAdding(true)}
          className="h-7 justify-start text-xs text-muted-foreground hover:text-foreground"
        >
          <Plus className="mr-1 h-3.5 w-3.5" /> Adicionar
        </Button>
      )}
    </section>
  );
}


function DraggableItemCard({ item, onOpen }: { item: KanbanItem; onOpen: (id: string) => void }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: item.id });
  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;
  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      role="button"
      tabIndex={0}
      onClick={() => { if (!isDragging) onOpen(item.id); }}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onOpen(item.id); } }}
      className={cn("cursor-grab touch-none", isDragging && "cursor-grabbing opacity-60")}
    >
      <ItemCard item={item} />
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

