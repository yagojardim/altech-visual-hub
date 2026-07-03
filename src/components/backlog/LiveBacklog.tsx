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
import { ArrowDown, ArrowUp, Plus } from "lucide-react";
import { toast } from "sonner";
import {
  listWorkItemsByProject,
  updateWorkItem,
  STATUS_COLUMNS,
  type WorkItemRow,
} from "@/lib/work-items-api";
import { LoadingState, EmptyState, ErrorState } from "@/components/states";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { WorkItemDetailsPanel } from "@/components/work-item/WorkItemDetailsPanel";
import { CreateWorkItemDialog } from "@/components/work-item/CreateWorkItemDialog";

function ItemRow({
  item,
  onClick,
  onMoveUp,
  onMoveDown,
  first,
  last,
}: {
  item: WorkItemRow;
  onClick: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  first: boolean;
  last: boolean;
}) {
  const drag = useDraggable({ id: item.id });
  const style = drag.transform
    ? { transform: `translate3d(${drag.transform.x}px, ${drag.transform.y}px, 0)` }
    : undefined;

  return (
    <div
      ref={drag.setNodeRef}
      style={style}
      {...drag.attributes}
      {...drag.listeners}
      className={cn(
        "grid grid-cols-[6rem_1fr_6rem_7rem_auto] items-center gap-3 rounded-lg border border-border bg-panel px-3 py-2 text-sm shadow-sm hover:border-primary/40",
        "cursor-grab",
        drag.isDragging && "opacity-50",
      )}
    >
      <button
        onClick={onClick}
        className="text-left font-mono text-[11px] text-muted-foreground hover:text-primary"
      >
        {item.item_key ?? item.id.slice(0, 6)}
      </button>
      <button
        onClick={onClick}
        className="truncate text-left font-medium text-foreground hover:text-primary"
      >
        {item.titulo}
      </button>
      <Badge variant="outline" className="justify-self-start text-[10px] uppercase">
        {item.tipo}
      </Badge>
      <span className="truncate text-xs text-muted-foreground">
        {item.responsavel ?? "—"}
      </span>
      <div className="flex items-center gap-1">
        <Button
          size="icon"
          variant="ghost"
          className="h-7 w-7"
          disabled={first}
          onClick={(e) => {
            e.stopPropagation();
            onMoveUp();
          }}
          aria-label="Mover para cima"
        >
          <ArrowUp className="h-3.5 w-3.5" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="h-7 w-7"
          disabled={last}
          onClick={(e) => {
            e.stopPropagation();
            onMoveDown();
          }}
          aria-label="Mover para baixo"
        >
          <ArrowDown className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

function DropZone({ id, children }: { id: string; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div
      ref={setNodeRef}
      className={cn(
        "rounded-xl border border-dashed border-border/70 p-2 transition-colors",
        isOver && "border-primary/60 bg-primary/5",
      )}
    >
      {children}
    </div>
  );
}

export function LiveBacklog({ projectId }: { projectId: string }) {
  const [items, setItems] = useState<WorkItemRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openItemId, setOpenItemId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const rows = await listWorkItemsByProject(projectId);
      setItems(rows);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao carregar backlog");
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    void load();
  }, [load]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const grouped = useMemo(() => {
    const map = new Map<string, WorkItemRow[]>();
    for (const s of STATUS_COLUMNS) map.set(s, []);
    for (const it of items) {
      if (!map.has(it.status)) map.set(it.status, []);
      map.get(it.status)!.push(it);
    }
    return map;
  }, [items]);

  const persistOrder = async (next: WorkItemRow[]) => {
    // Only persist items whose ordem changed to minimise writes.
    const prevById = new Map(items.map((i) => [i.id, i.ordem]));
    const changes = next.filter((i) => prevById.get(i.id) !== i.ordem);
    setItems(next);
    for (const it of changes) {
      try {
        await updateWorkItem(it.id, { ordem: it.ordem });
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Erro ao reordenar");
        void load();
        return;
      }
    }
  };

  const moveWithinBy = async (id: string, delta: number) => {
    const item = items.find((i) => i.id === id);
    if (!item) return;
    const siblings = items
      .filter((i) => i.status === item.status)
      .sort((a, b) => a.ordem - b.ordem);
    const idx = siblings.findIndex((i) => i.id === id);
    const target = idx + delta;
    if (idx < 0 || target < 0 || target >= siblings.length) return;
    const reordered = [...siblings];
    [reordered[idx], reordered[target]] = [reordered[target], reordered[idx]];
    const withNewOrdem = reordered.map((it, i) => ({ ...it, ordem: i + 1 }));
    const merged = items.map((i) => withNewOrdem.find((n) => n.id === i.id) ?? i);
    await persistOrder(merged);
  };

  const onDragEnd = async (e: DragEndEvent) => {
    const itemId = String(e.active.id);
    const overId = e.over ? String(e.over.id) : null;
    if (!overId || !overId.startsWith("group:")) return;
    const nextStatus = overId.slice(6);
    const item = items.find((i) => i.id === itemId);
    if (!item || item.status === nextStatus) return;

    const prev = items;
    // Optimistic: change status + append at end of destination group
    const destOrder =
      Math.max(0, ...items.filter((i) => i.status === nextStatus).map((i) => i.ordem)) + 1;
    setItems((cur) =>
      cur.map((i) => (i.id === itemId ? { ...i, status: nextStatus, ordem: destOrder } : i)),
    );
    try {
      await updateWorkItem(itemId, { status: nextStatus, ordem: destOrder });
    } catch (err) {
      setItems(prev);
      toast.error(err instanceof Error ? err.message : "Erro ao mover item");
    }
  };

  if (loading) return <LoadingState label="Carregando backlog…" variant="skeleton" rows={5} />;
  if (error) return <ErrorState description={error} onRetry={() => void load()} />;

  const totalItems = items.length;

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Backlog</h2>
          <p className="text-xs text-muted-foreground">
            {totalItems} {totalItems === 1 ? "item" : "itens"} • arraste entre grupos para mudar o status
          </p>
        </div>
        <Button size="sm" variant="cta" onClick={() => setCreating(true)}>
          <Plus className="mr-1 h-4 w-4" />
          Novo work item
        </Button>
      </div>

      <DndContext sensors={sensors} onDragEnd={onDragEnd}>
        <div className="space-y-6">
          {STATUS_COLUMNS.map((status) => {
            const list = (grouped.get(status) ?? []).sort((a, b) => a.ordem - b.ordem);
            return (
              <section key={status} className="space-y-2">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-medium text-foreground">{status}</h3>
                  <span className="rounded-full bg-panel px-2 py-0.5 text-[11px] text-muted-foreground">
                    {list.length}
                  </span>
                </div>
                <DropZone id={`group:${status}`}>
                  {list.length === 0 ? (
                    <div className="p-4 text-center text-xs text-muted-foreground">
                      Solte um item aqui.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {list.map((item, idx) => (
                        <ItemRow
                          key={item.id}
                          item={item}
                          onClick={() => setOpenItemId(item.id)}
                          onMoveUp={() => void moveWithinBy(item.id, -1)}
                          onMoveDown={() => void moveWithinBy(item.id, +1)}
                          first={idx === 0}
                          last={idx === list.length - 1}
                        />
                      ))}
                    </div>
                  )}
                </DropZone>
              </section>
            );
          })}
          {totalItems === 0 && (
            <EmptyState
              title="Nada por aqui ainda"
              description="Crie seu primeiro work item para começar."
            />
          )}
        </div>
      </DndContext>

      <Sheet open={openItemId !== null} onOpenChange={(o) => !o && setOpenItemId(null)}>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-xl lg:max-w-3xl">
          <SheetHeader className="sr-only">
            <SheetTitle>Work Item</SheetTitle>
            <SheetDescription>Detalhes do work item selecionado</SheetDescription>
          </SheetHeader>
          {openItemId && (
            <WorkItemDetailsPanel
              workItemId={openItemId}
              onChange={() => void load()}
            />
          )}
        </SheetContent>
      </Sheet>

      <CreateWorkItemDialog
        projectId={projectId}
        open={creating}
        onOpenChange={setCreating}
        onCreated={() => void load()}
      />
    </>
  );
}
