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
import { ArrowDown, ArrowUp, Plus, Search } from "lucide-react";
import { toast } from "sonner";
import {
  listWorkItemsByProject,
  updateWorkItem,
  STATUS_COLUMNS,
  TIPO_OPTIONS,
  PRIORIDADE_OPTIONS,
  type WorkItemRow,
} from "@/lib/work-items-api";
import { LoadingState, EmptyState, ErrorState } from "@/components/states";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { WorkItemToolbar } from "@/components/work-item/WorkItemToolbar";
import { OrgControls, type OrgControlsValue } from "@/components/work-item/OrgControls";
import { useOrgPrefs } from "@/lib/use-org-prefs";

type BacklogPrefs = OrgControlsValue & {
  search: string;
  [k: string]: unknown;
};

const DEFAULT_PREFS: BacklogPrefs = {
  filters: {
    status: [] as string[],
    tipo: [] as string[],
    prioridade: [] as string[],
    responsavel: [] as string[],
  },
  sortBy: "ordem",
  sortDir: "asc",
  groupBy: "status",
  search: "",
};

const SORT_OPTIONS = [
  { value: "ordem", label: "Ordem" },
  { value: "prioridade", label: "Prioridade" },
  { value: "titulo", label: "Título" },
  { value: "updated_at", label: "Atualização" },
  { value: "created_at", label: "Criação" },
];

const GROUP_OPTIONS = [
  { value: "none", label: "Sem agrupamento" },
  { value: "status", label: "Status" },
  { value: "tipo", label: "Tipo" },
  { value: "prioridade", label: "Prioridade" },
  { value: "responsavel", label: "Responsável" },
];

const PRIORITY_RANK: Record<string, number> = {
  "Crítica": 0,
  "Alta": 1,
  "Média": 2,
  "Baixa": 3,
};

function ItemRow({
  item,
  onClick,
  onMoveUp,
  onMoveDown,
  first,
  last,
  draggable,
}: {
  item: WorkItemRow;
  onClick: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  first: boolean;
  last: boolean;
  draggable: boolean;
}) {
  const drag = useDraggable({ id: item.id, disabled: !draggable });
  const style = drag.transform
    ? { transform: `translate3d(${drag.transform.x}px, ${drag.transform.y}px, 0)` }
    : undefined;

  return (
    <div
      ref={drag.setNodeRef}
      style={style}
      {...(draggable ? drag.attributes : {})}
      {...(draggable ? drag.listeners : {})}
      className={cn(
        "grid grid-cols-[6rem_1fr_6rem_7rem_auto] items-center gap-3 rounded-lg border border-border bg-panel px-3 py-2 text-sm shadow-sm hover:border-primary/40",
        draggable ? "cursor-grab" : "cursor-default",
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
          disabled={first || !draggable}
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
          disabled={last || !draggable}
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

function DropZone({
  id,
  children,
  enabled,
}: {
  id: string;
  children: React.ReactNode;
  enabled: boolean;
}) {
  const { setNodeRef, isOver } = useDroppable({ id, disabled: !enabled });
  return (
    <div
      ref={setNodeRef}
      className={cn(
        "rounded-xl border border-dashed border-border/70 p-2 transition-colors",
        enabled && isOver && "border-primary/60 bg-primary/5",
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

  const [prefs, updatePrefs, resetPrefs] = useOrgPrefs<BacklogPrefs>(
    `/backlog:${projectId}`,
    DEFAULT_PREFS,
  );

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

  const filterFields = useMemo(() => {
    const responsaveis = Array.from(
      new Set(items.map((i) => i.responsavel ?? "—")),
    ).sort();
    return [
      {
        key: "status",
        label: "Status",
        options: STATUS_COLUMNS.map((s) => ({ value: s, label: s })),
      },
      {
        key: "tipo",
        label: "Tipo",
        options: TIPO_OPTIONS.map((t) => ({ value: t, label: t })),
      },
      {
        key: "prioridade",
        label: "Prioridade",
        options: PRIORIDADE_OPTIONS.map((p) => ({ value: p, label: p })),
      },
      {
        key: "responsavel",
        label: "Responsável",
        options: responsaveis.map((v) => ({ value: v, label: v })),
      },
    ];
  }, [items]);

  const visible = useMemo(() => {
    const q = prefs.search.trim().toLowerCase();
    const filtered = items.filter((it) => {
      if (q) {
        const hay = `${it.titulo} ${it.item_key ?? ""} ${it.descricao ?? ""} ${it.responsavel ?? ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      for (const [key, values] of Object.entries(prefs.filters)) {
        if (!values || values.length === 0) continue;
        const v = ((it as unknown as Record<string, unknown>)[key] as string | null) ?? "—";
        if (!values.includes(v)) return false;
      }
      return true;
    });
    return filtered;
  }, [items, prefs.search, prefs.filters]);

  const sortItems = useCallback(
    (list: WorkItemRow[]) => {
      const dir = prefs.sortDir === "desc" ? -1 : 1;
      const sorted = [...list];
      sorted.sort((a, b) => {
        switch (prefs.sortBy) {
          case "ordem":
            return (a.ordem - b.ordem) * dir;
          case "prioridade": {
            const av = PRIORITY_RANK[a.prioridade] ?? 99;
            const bv = PRIORITY_RANK[b.prioridade] ?? 99;
            return (av - bv) * dir;
          }
          case "titulo":
            return a.titulo.localeCompare(b.titulo, "pt-BR") * dir;
          case "updated_at":
            return String(a.updated_at ?? "").localeCompare(String(b.updated_at ?? "")) * dir;
          case "created_at":
            return String(a.created_at ?? "").localeCompare(String(b.created_at ?? "")) * dir;
          default:
            return 0;
        }
      });
      return sorted;
    },
    [prefs.sortBy, prefs.sortDir],
  );

  const groups = useMemo(() => {
    const sorted = sortItems(visible);
    if (prefs.groupBy === "none") {
      return [{ key: "__all__", label: "Todos", items: sorted }];
    }
    if (prefs.groupBy === "status") {
      // preserve canonical status order
      const map = new Map<string, WorkItemRow[]>();
      for (const s of STATUS_COLUMNS) map.set(s, []);
      for (const it of sorted) {
        if (!map.has(it.status)) map.set(it.status, []);
        map.get(it.status)!.push(it);
      }
      return Array.from(map.entries()).map(([key, items]) => ({ key, label: key, items }));
    }
    const map = new Map<string, WorkItemRow[]>();
    for (const it of sorted) {
      const key =
        ((it as unknown as Record<string, unknown>)[prefs.groupBy] as string | null) ?? "—";
      const k = key || "—";
      if (!map.has(k)) map.set(k, []);
      map.get(k)!.push(it);
    }
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b, "pt-BR"))
      .map(([key, items]) => ({ key, label: key, items }));
  }, [visible, prefs.groupBy, sortItems]);

  const persistOrder = async (next: WorkItemRow[]) => {
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

  const totalItems = items.length;
  const shownItems = visible.length;
  const canDrag = prefs.groupBy === "status" && prefs.sortBy === "ordem";

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Backlog</h2>
          <p className="text-xs text-muted-foreground">
            {shownItems} de {totalItems} {totalItems === 1 ? "item" : "itens"}
            {canDrag ? " • arraste entre grupos para mudar o status" : ""}
          </p>
        </div>
        <Button size="sm" variant="cta" onClick={() => setCreating(true)}>
          <Plus className="mr-1 h-4 w-4" />
          Novo work item
        </Button>
      </div>

      <div className="mb-4">
        <WorkItemToolbar
          actions={
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Pesquisar no backlog..."
                className="pl-9"
                value={prefs.search}
                onChange={(e) => updatePrefs({ search: e.target.value })}
              />
            </div>
          }
          organization={
            <OrgControls
              value={prefs}
              onChange={(patch) => updatePrefs(patch as Partial<BacklogPrefs>)}
              filterFields={filterFields}
              sortOptions={SORT_OPTIONS}
              groupOptions={GROUP_OPTIONS}
              onRefresh={() => void load()}
              onReset={resetPrefs}
            />
          }
        />
      </div>

      {loading ? (
        <LoadingState label="Carregando backlog…" variant="skeleton" rows={5} />
      ) : error ? (
        <ErrorState description={error} onRetry={() => void load()} />
      ) : totalItems === 0 ? (
        <EmptyState
          title="Nada por aqui ainda"
          description="Crie seu primeiro work item para começar."
        />
      ) : shownItems === 0 ? (
        <EmptyState
          title="Nenhum item corresponde aos filtros"
          description="Ajuste filtros, busca ou agrupamento para ver mais resultados."
        />
      ) : (
        <DndContext sensors={sensors} onDragEnd={onDragEnd}>
          <div className="space-y-6">
            {groups.map((group) => {
              const list = group.items;
              const dropId =
                prefs.groupBy === "status" ? `group:${group.key}` : `nogroup:${group.key}`;
              return (
                <section key={group.key} className="space-y-2">
                  {prefs.groupBy !== "none" && (
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-medium text-foreground">{group.label}</h3>
                      <span className="rounded-full bg-panel px-2 py-0.5 text-[11px] text-muted-foreground">
                        {list.length}
                      </span>
                    </div>
                  )}
                  <DropZone id={dropId} enabled={canDrag && prefs.groupBy === "status"}>
                    {list.length === 0 ? (
                      <div className="p-4 text-center text-xs text-muted-foreground">
                        {canDrag ? "Solte um item aqui." : "Sem itens."}
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
                            draggable={canDrag}
                          />
                        ))}
                      </div>
                    )}
                  </DropZone>
                </section>
              );
            })}
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
        onCreated={() => void load()}
      />
    </>
  );
}
