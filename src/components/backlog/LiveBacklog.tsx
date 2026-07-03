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
import { ArrowDown, ArrowUp, CalendarDays, Plus, Target, X } from "lucide-react";
import { supabase, type BoardRow, type WorkItem } from "@/lib/supabase";
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
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { WorkItemDetailsPanel } from "@/components/work-item/WorkItemDetailsPanel";

type Sprint = {
  id: string;
  board_id: string | null;
  name: string;
  goal: string | null;
  start_date: string | null;
  end_date: string | null;
  status: string | null;
};

type WorkItemLite = WorkItem & {
  sprint_id?: string | null;
  estimate?: number | null;
};

const PRIORITY_ORDER: Record<string, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};

function priorityWeight(p?: string | null) {
  if (!p) return 99;
  return PRIORITY_ORDER[p.toLowerCase()] ?? 99;
}

const PRIORITY_STYLES: Record<string, string> = {
  critical: "bg-destructive text-destructive-foreground",
  high: "bg-destructive/15 text-destructive",
  medium: "bg-warning/15 text-warning",
  low: "bg-muted text-muted-foreground",
};

function priorityBadge(p?: string | null) {
  const key = p?.toLowerCase() ?? "low";
  return PRIORITY_STYLES[key] ?? PRIORITY_STYLES.low;
}

type SortKey = "priority" | "key" | "title" | "estimate";

function sortItems(items: WorkItemLite[], key: SortKey, dir: "asc" | "desc") {
  const mult = dir === "asc" ? 1 : -1;
  const arr = [...items];
  arr.sort((a, b) => {
    let av: number | string = 0;
    let bv: number | string = 0;
    if (key === "priority") {
      av = priorityWeight(a.priority);
      bv = priorityWeight(b.priority);
    } else if (key === "estimate") {
      av = a.estimate ?? 0;
      bv = b.estimate ?? 0;
    } else if (key === "key") {
      av = a.item_key ?? "";
      bv = b.item_key ?? "";
    } else {
      av = a.title ?? "";
      bv = b.title ?? "";
    }
    if (av < bv) return -1 * mult;
    if (av > bv) return 1 * mult;
    return 0;
  });
  return arr;
}

function fmtDate(s?: string | null) {
  if (!s) return "—";
  try {
    return new Date(s).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
  } catch {
    return s;
  }
}

function ItemRow({
  item,
  action,
  onClick,
  draggable,
}: {
  item: WorkItemLite;
  action: { label: string; onClick: () => void; icon: React.ReactNode };
  onClick: () => void;
  draggable?: { id: string };
}) {
  const drag = useDraggable({ id: draggable?.id ?? item.id, disabled: !draggable });
  const style = drag.transform
    ? { transform: `translate3d(${drag.transform.x}px, ${drag.transform.y}px, 0)` }
    : undefined;

  return (
    <div
      ref={draggable ? drag.setNodeRef : undefined}
      style={style}
      {...(draggable ? drag.attributes : {})}
      {...(draggable ? drag.listeners : {})}
      className={cn(
        "group grid grid-cols-[6rem_1fr_5rem_5rem_5rem_auto] items-center gap-3 rounded-lg border border-border bg-panel px-3 py-2 text-sm shadow-sm hover:border-primary/40",
        draggable && "cursor-grab",
        drag.isDragging && "opacity-50",
      )}
    >
      <button
        onClick={onClick}
        className="text-left font-mono text-[11px] text-muted-foreground hover:text-primary"
      >
        {item.item_key ?? item.id.slice(0, 6)}
      </button>
      <button onClick={onClick} className="truncate text-left font-medium text-foreground hover:text-primary">
        {item.title}
      </button>
      {item.type ? (
        <Badge variant="outline" className="justify-self-start text-[10px] uppercase">
          {item.type}
        </Badge>
      ) : (
        <span className="text-xs text-muted-foreground">—</span>
      )}
      <span className={cn("justify-self-start rounded px-1.5 py-0.5 text-[10px] font-medium", priorityBadge(item.priority))}>
        {item.priority ?? "—"}
      </span>
      <span className="text-xs text-muted-foreground">
        {item.estimate != null ? `${item.estimate} pts` : "—"}
      </span>
      <Button
        size="sm"
        variant="outline"
        onClick={(e) => {
          e.stopPropagation();
          action.onClick();
        }}
        className="gap-1"
      >
        {action.icon}
        <span className="hidden sm:inline">{action.label}</span>
      </Button>
    </div>
  );
}

function DropZone({ id, children, active }: { id: string; children: React.ReactNode; active?: boolean }) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div
      ref={setNodeRef}
      className={cn(
        "rounded-xl border border-dashed border-border/70 p-2 transition-colors",
        (isOver || active) && "border-primary/60 bg-primary/5",
      )}
    >
      {children}
    </div>
  );
}

export function LiveBacklog({ projectId }: { projectId: string }) {
  const [board, setBoard] = useState<BoardRow | null>(null);
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [items, setItems] = useState<WorkItemLite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openItemId, setOpenItemId] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>("priority");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: "", goal: "", start_date: "", end_date: "" });
  const [saving, setSaving] = useState(false);

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
        setSprints([]);
        setItems([]);
        return;
      }
      setBoard(b);

      const [sprintsRes, itemsRes] = await Promise.all([
        supabase
          .from("sprints")
          .select("id, board_id, name, goal, start_date, end_date, status")
          .eq("board_id", b.id)
          .order("start_date", { ascending: false }),
        supabase
          .from("work_items")
          .select("id, board_id, column_id, item_key, title, type, priority, status, assignee, sprint_id, estimate")
          .eq("board_id", b.id),
      ]);
      if (sprintsRes.error) throw sprintsRes.error;
      if (itemsRes.error) throw itemsRes.error;
      setSprints((sprintsRes.data ?? []) as Sprint[]);
      setItems((itemsRes.data ?? []) as WorkItemLite[]);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erro ao carregar backlog");
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    void load();
  }, [load]);

  const activeSprint = useMemo(
    () => sprints.find((s) => (s.status ?? "").toLowerCase() === "active") ?? null,
    [sprints],
  );

  const sprintItems = useMemo(
    () => (activeSprint ? items.filter((i) => i.sprint_id === activeSprint.id) : []),
    [items, activeSprint],
  );
  const backlogItems = useMemo(
    () => sortItems(items.filter((i) => !i.sprint_id), sortKey, sortDir),
    [items, sortKey, sortDir],
  );

  const moveToSprint = async (itemId: string, sprintId: string | null) => {
    const prev = items;
    setItems((cur) => cur.map((i) => (i.id === itemId ? { ...i, sprint_id: sprintId } : i)));
    const { error: uErr } = await supabase
      .from("work_items")
      .update({ sprint_id: sprintId })
      .eq("id", itemId);
    if (uErr) {
      setItems(prev);
      setError(uErr.message);
    }
  };

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const onDragEnd = (e: DragEndEvent) => {
    const overId = e.over ? String(e.over.id) : null;
    const itemId = String(e.active.id).replace(/^drag:/, "");
    if (!overId) return;
    if (overId === "drop:sprint" && activeSprint) {
      void moveToSprint(itemId, activeSprint.id);
    } else if (overId === "drop:backlog") {
      void moveToSprint(itemId, null);
    }
  };

  const createSprint = async () => {
    if (!board || !form.name.trim()) return;
    setSaving(true);
    const payload = {
      board_id: board.id,
      name: form.name.trim(),
      goal: form.goal.trim() || null,
      start_date: form.start_date || null,
      end_date: form.end_date || null,
      status: activeSprint ? "planned" : "active",
    };
    const { error: iErr } = await supabase.from("sprints").insert(payload);
    setSaving(false);
    if (iErr) {
      setError(iErr.message);
      return;
    }
    setCreating(false);
    setForm({ name: "", goal: "", start_date: "", end_date: "" });
    void load();
  };

  if (loading) return <LoadingState label="Carregando backlog…" variant="skeleton" rows={5} />;
  if (error) return <ErrorState description={error} onRetry={() => void load()} />;
  if (!board) {
    return (
      <EmptyState
        title="Nenhum board"
        description="Este projeto ainda não possui um board configurado."
      />
    );
  }

  return (
    <>
      <DndContext sensors={sensors} onDragEnd={onDragEnd}>
        <div className="space-y-6">
          {/* Active Sprint */}
          <section className="space-y-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Badge className="bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500/20">Sprint ativa</Badge>
                  <h2 className="text-lg font-semibold text-foreground">
                    {activeSprint ? activeSprint.name : "Nenhuma sprint ativa"}
                  </h2>
                </div>
                {activeSprint && (
                  <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                    {activeSprint.goal && (
                      <span className="flex items-center gap-1.5">
                        <Target className="h-3.5 w-3.5" />
                        {activeSprint.goal}
                      </span>
                    )}
                    <span className="flex items-center gap-1.5">
                      <CalendarDays className="h-3.5 w-3.5" />
                      {fmtDate(activeSprint.start_date)} → {fmtDate(activeSprint.end_date)}
                    </span>
                    <span>{sprintItems.length} itens</span>
                  </div>
                )}
              </div>
              <Button variant="cta" size="sm" onClick={() => setCreating(true)} className="gap-1.5">
                <Plus className="h-4 w-4" />
                Criar sprint
              </Button>
            </div>

            <DropZone id="drop:sprint">
              {activeSprint ? (
                sprintItems.length === 0 ? (
                  <div className="p-6 text-center text-sm text-muted-foreground">
                    Arraste itens do backlog ou clique em “+” para adicionar à sprint.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {sprintItems.map((item) => (
                      <ItemRow
                        key={item.id}
                        item={item}
                        onClick={() => setOpenItemId(item.id)}
                        draggable={{ id: item.id }}
                        action={{
                          label: "Remover",
                          icon: <X className="h-3.5 w-3.5" />,
                          onClick: () => void moveToSprint(item.id, null),
                        }}
                      />
                    ))}
                  </div>
                )
              ) : (
                <div className="p-6 text-center text-sm text-muted-foreground">
                  Nenhuma sprint ativa. Crie uma sprint para começar a planejar.
                </div>
              )}
            </DropZone>
          </section>

          {/* Backlog */}
          <section className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-foreground">Backlog</h2>
                <p className="text-xs text-muted-foreground">
                  {backlogItems.length} itens sem sprint
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="text-muted-foreground">Ordenar por</span>
                <select
                  value={sortKey}
                  onChange={(e) => setSortKey(e.target.value as SortKey)}
                  className="h-8 rounded-md border border-border bg-panel px-2 text-xs"
                >
                  <option value="priority">Prioridade</option>
                  <option value="key">Key</option>
                  <option value="title">Título</option>
                  <option value="estimate">Estimate</option>
                </select>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setSortDir((d) => (d === "asc" ? "desc" : "asc"))}
                  className="h-8 gap-1"
                >
                  {sortDir === "asc" ? <ArrowUp className="h-3.5 w-3.5" /> : <ArrowDown className="h-3.5 w-3.5" />}
                  {sortDir === "asc" ? "Asc" : "Desc"}
                </Button>
              </div>
            </div>

            <DropZone id="drop:backlog">
              {backlogItems.length === 0 ? (
                <div className="p-6 text-center text-sm text-muted-foreground">
                  Nenhum item no backlog.
                </div>
              ) : (
                <div className="space-y-2">
                  {backlogItems.map((item) => (
                    <ItemRow
                      key={item.id}
                      item={item}
                      onClick={() => setOpenItemId(item.id)}
                      draggable={{ id: item.id }}
                      action={{
                        label: activeSprint ? "Para sprint" : "Sem sprint",
                        icon: <Plus className="h-3.5 w-3.5" />,
                        onClick: () =>
                          activeSprint ? void moveToSprint(item.id, activeSprint.id) : undefined,
                      }}
                    />
                  ))}
                </div>
              )}
            </DropZone>
          </section>
        </div>
      </DndContext>

      <Sheet open={openItemId !== null} onOpenChange={(o) => !o && setOpenItemId(null)}>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-xl lg:max-w-3xl">
          <SheetHeader className="sr-only">
            <SheetTitle>Work Item</SheetTitle>
            <SheetDescription>Detalhes do work item selecionado</SheetDescription>
          </SheetHeader>
          {openItemId && <WorkItemDetailsPanel workItemId={openItemId} />}
        </SheetContent>
      </Sheet>

      <Dialog open={creating} onOpenChange={setCreating}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar sprint</DialogTitle>
            <DialogDescription>
              Defina nome, objetivo e período para a nova sprint.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="sprint-name">Nome</Label>
              <Input
                id="sprint-name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Sprint 12"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sprint-goal">Objetivo (goal)</Label>
              <Textarea
                id="sprint-goal"
                value={form.goal}
                onChange={(e) => setForm({ ...form, goal: e.target.value })}
                placeholder="O que queremos entregar nesta sprint?"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="sprint-start">Início</Label>
                <Input
                  id="sprint-start"
                  type="date"
                  value={form.start_date}
                  onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="sprint-end">Fim</Label>
                <Input
                  id="sprint-end"
                  type="date"
                  value={form.end_date}
                  onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreating(false)}>
              Cancelar
            </Button>
            <Button variant="cta" onClick={() => void createSprint()} disabled={saving || !form.name.trim()}>
              {saving ? "Criando…" : "Criar sprint"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
