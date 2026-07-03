import { useCallback, useEffect, useMemo, useState } from "react";
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  useDraggable,
  type DragEndEvent,
} from "@dnd-kit/core";
import { AlertTriangle, User } from "lucide-react";
import { supabase, type BoardColumn, type BoardRow, type WorkItem } from "@/lib/supabase";
import { LoadingState, EmptyState, ErrorState } from "@/components/states";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const PRIORITY_COLORS: Record<string, string> = {
  critical: "bg-destructive text-destructive-foreground",
  high: "bg-destructive/15 text-destructive",
  medium: "bg-warning/15 text-warning",
  low: "bg-muted text-muted-foreground",
};

function priorityClass(p?: string | null) {
  if (!p) return PRIORITY_COLORS.low;
  return PRIORITY_COLORS[p.toLowerCase()] ?? PRIORITY_COLORS.low;
}

function initials(name?: string | null) {
  if (!name) return "?";
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase() ?? "")
    .join("");
}

function ItemCard({ item }: { item: WorkItem }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: item.id,
  });
  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;

  return (
    <article
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={cn(
        "flex cursor-grab flex-col gap-2 rounded-xl border border-border bg-panel p-3 shadow-sm",
        "hover:border-primary/40 hover:bg-panel-elevated",
        isDragging && "opacity-50",
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-mono text-muted-foreground">
          {item.item_key ?? item.id.slice(0, 6)}
        </span>
        {item.type && (
          <Badge variant="outline" className="text-[10px] uppercase">
            {item.type}
          </Badge>
        )}
      </div>
      <h4 className="text-sm font-medium leading-snug text-foreground">{item.title}</h4>
      <div className="flex items-center justify-between gap-2 pt-1">
        <span className={cn("rounded px-1.5 py-0.5 text-[10px] font-medium", priorityClass(item.priority))}>
          {item.priority ?? "—"}
        </span>
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-[10px] font-medium text-muted-foreground">
          {item.assignee_name || item.assignee ? (
            initials(item.assignee_name ?? item.assignee)
          ) : (
            <User className="h-3 w-3" />
          )}
        </div>
      </div>
    </article>
  );
}

function Column({
  column,
  items,
}: {
  column: BoardColumn;
  items: WorkItem[];
}) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });
  const overLimit = column.wip_limit != null && items.length > column.wip_limit;

  return (
    <section
      ref={setNodeRef}
      className={cn(
        "flex min-w-[16rem] flex-col rounded-xl border border-border bg-panel/60",
        isOver && "ring-2 ring-primary/40",
      )}
    >
      <header
        className={cn(
          "flex items-center justify-between gap-2 rounded-t-xl border-b border-border px-3 py-2",
          overLimit && "bg-warning/15",
        )}
      >
        <div className="flex items-center gap-2">
          {overLimit && <AlertTriangle className="h-3.5 w-3.5 text-warning" />}
          <h3 className="text-sm font-medium text-foreground">{column.name}</h3>
        </div>
        <span
          className={cn(
            "rounded-full bg-panel px-2 py-0.5 text-[11px] text-muted-foreground",
            overLimit && "bg-warning/25 text-warning",
          )}
        >
          {items.length}
          {column.wip_limit != null ? ` / ${column.wip_limit}` : ""}
        </span>
      </header>
      <div className="flex flex-1 flex-col gap-2 p-3">
        {items.map((item) => (
          <ItemCard key={item.id} item={item} />
        ))}
        {items.length === 0 && (
          <div className="rounded-lg border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
            Sem itens
          </div>
        )}
      </div>
    </section>
  );
}

export function KanbanBoard({ projectId }: { projectId: string }) {
  const [board, setBoard] = useState<BoardRow | null>(null);
  const [columns, setColumns] = useState<BoardColumn[]>([]);
  const [items, setItems] = useState<WorkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: boards, error: bErr } = await supabase
        .from("boards")
        .select("id, project_id, name")
        .eq("project_id", projectId)
        .limit(1);
      if (bErr) throw bErr;
      const b = boards?.[0] as BoardRow | undefined;
      if (!b) {
        setBoard(null);
        setColumns([]);
        setItems([]);
        return;
      }
      setBoard(b);

      const [colsRes, itemsRes] = await Promise.all([
        supabase
          .from("board_columns")
          .select("id, board_id, name, position, wip_limit")
          .eq("board_id", b.id)
          .order("position", { ascending: true }),
        supabase
          .from("work_items")
          .select("id, board_id, column_id, item_key, title, type, priority, status, assignee")
          .eq("board_id", b.id),
      ]);
      if (colsRes.error) throw colsRes.error;
      if (itemsRes.error) throw itemsRes.error;
      setColumns((colsRes.data ?? []) as BoardColumn[]);
      setItems((itemsRes.data ?? []) as WorkItem[]);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Erro ao carregar board";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    void load();
  }, [load]);

  const itemsByColumn = useMemo(() => {
    const map = new Map<string, WorkItem[]>();
    for (const col of columns) map.set(col.id, []);
    for (const it of items) {
      if (it.column_id && map.has(it.column_id)) map.get(it.column_id)!.push(it);
    }
    return map;
  }, [columns, items]);

  const onDragEnd = async (e: DragEndEvent) => {
    const itemId = String(e.active.id);
    const overId = e.over ? String(e.over.id) : null;
    if (!overId) return;
    const item = items.find((i) => i.id === itemId);
    const column = columns.find((c) => c.id === overId);
    if (!item || !column || item.column_id === column.id) return;

    const prev = items;
    setItems((cur) =>
      cur.map((i) => (i.id === itemId ? { ...i, column_id: column.id, status: column.name } : i)),
    );
    const { error: uErr } = await supabase
      .from("work_items")
      .update({ column_id: column.id, status: column.name })
      .eq("id", itemId);
    if (uErr) {
      setItems(prev);
      setError(uErr.message);
    }
  };

  if (loading) return <LoadingState label="Carregando board…" />;
  if (error) return <ErrorState description={error} onRetry={() => void load()} />;
  if (!board || columns.length === 0) {
    return (
      <EmptyState
        title="Board não configurado"
        description="Nenhum board com colunas foi encontrado para este projeto."
      />
    );
  }

  return (
    <DndContext sensors={sensors} onDragEnd={onDragEnd}>
      <div className="grid gap-3 overflow-x-auto pb-2" style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(16rem, 1fr))` }}>
        {columns.map((col) => (
          <Column key={col.id} column={col} items={itemsByColumn.get(col.id) ?? []} />
        ))}
      </div>
    </DndContext>
  );
}
