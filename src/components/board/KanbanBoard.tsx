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
import { Plus, User } from "lucide-react";
import { toast } from "sonner";
import {
  listWorkItemsByProject,
  updateWorkItem,
  STATUS_COLUMNS,
  type WorkItemRow,
} from "@/lib/work-items-api";
import { LoadingState, ErrorState, EmptyState } from "@/components/states";
import { KanbanSquare } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { WorkItemDetailsPanel } from "@/components/work-item/WorkItemDetailsPanel";
import { CreateWorkItemDialog } from "@/components/work-item/CreateWorkItemDialog";

function initials(name?: string | null) {
  if (!name) return null;
  return name.split(/\s+/).slice(0, 2).map((s) => s[0]?.toUpperCase() ?? "").join("");
}

function ItemCard({ item, onOpen }: { item: WorkItemRow; onOpen: (id: string) => void }) {
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
      onClick={() => {
        if (!isDragging) onOpen(item.id);
      }}
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
        <Badge variant="outline" className="text-[10px] uppercase">
          {item.tipo}
        </Badge>
      </div>
      <h4 className="text-sm font-medium leading-snug text-foreground">{item.titulo}</h4>
      <div className="flex items-center justify-end gap-2 pt-1">
        <div
          className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-[10px] font-medium text-muted-foreground"
          title={item.responsavel ?? "Sem responsável"}
        >
          {initials(item.responsavel) ?? <User className="h-3 w-3" />}
        </div>
      </div>
    </article>
  );
}

function Column({
  status,
  items,
  onOpen,
}: {
  status: string;
  items: WorkItemRow[];
  onOpen: (id: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `col:${status}` });
  return (
    <section
      ref={setNodeRef}
      className={cn(
        "flex min-w-[16rem] flex-col rounded-xl border border-border bg-panel/60",
        isOver && "ring-2 ring-primary/40",
      )}
    >
      <header className="flex items-center justify-between gap-2 rounded-t-xl border-b border-border px-3 py-2">
        <h3 className="text-sm font-medium text-foreground">{status}</h3>
        <span className="rounded-full bg-panel px-2 py-0.5 text-[11px] text-muted-foreground">
          {items.length}
        </span>
      </header>
      <div className="flex flex-1 flex-col gap-2 p-3">
        {items.map((item) => (
          <ItemCard key={item.id} item={item} onOpen={onOpen} />
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
  const [items, setItems] = useState<WorkItemRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openItemId, setOpenItemId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const rows = await listWorkItemsByProject(projectId);
      setItems(rows);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao carregar board");
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    void load();
  }, [load]);

  const itemsByStatus = useMemo(() => {
    const map = new Map<string, WorkItemRow[]>();
    for (const s of STATUS_COLUMNS) map.set(s, []);
    for (const it of items) {
      const key = STATUS_COLUMNS.includes(it.status as (typeof STATUS_COLUMNS)[number])
        ? it.status
        : STATUS_COLUMNS[0];
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(it);
    }
    return map;
  }, [items]);

  const onDragEnd = async (e: DragEndEvent) => {
    const itemId = String(e.active.id);
    const overId = e.over ? String(e.over.id) : null;
    if (!overId || !overId.startsWith("col:")) return;
    const nextStatus = overId.slice(4);
    const item = items.find((i) => i.id === itemId);
    if (!item || item.status === nextStatus) return;

    const prev = items;
    setItems((cur) => cur.map((i) => (i.id === itemId ? { ...i, status: nextStatus } : i)));
    try {
      await updateWorkItem(itemId, { status: nextStatus });
    } catch (err) {
      setItems(prev);
      const msg = err instanceof Error ? err.message : "Erro ao mover item";
      toast.error(msg);
    }
  };

  if (loading) return <LoadingState label="Carregando board…" variant="skeleton" rows={4} />;
  if (error) return <ErrorState description={error} onRetry={() => void load()} />;

  return (
    <>
      <div className="mb-3 flex justify-end">
        <Button size="sm" variant="cta" onClick={() => setCreating(true)}>
          <Plus className="mr-1 h-4 w-4" />
          Novo work item
        </Button>
      </div>
      {items.length === 0 ? (
        <EmptyState
          icon={<KanbanSquare className="h-5 w-5" />}
          title="Nada por aqui ainda"
          description="Crie seu primeiro work item para começar."
          action={
            <Button size="sm" variant="cta" onClick={() => setCreating(true)}>
              <Plus className="mr-1 h-4 w-4" />
              Novo work item
            </Button>
          }
        />
      ) : (
        <DndContext sensors={sensors} onDragEnd={onDragEnd}>
          <div
            className="grid gap-3 overflow-x-auto pb-2"
            style={{ gridTemplateColumns: `repeat(${STATUS_COLUMNS.length}, minmax(16rem, 1fr))` }}
          >
            {STATUS_COLUMNS.map((status) => (
              <Column
                key={status}
                status={status}
                items={itemsByStatus.get(status) ?? []}
                onOpen={setOpenItemId}
              />
            ))}
          </div>
        </DndContext>
      )}

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
        defaultStatus="A Fazer"
        onCreated={() => void load()}
      />
    </>
  );
}
