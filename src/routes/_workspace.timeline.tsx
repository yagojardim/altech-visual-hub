import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, ChevronDown, Search, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { WidgetCard } from "@/components/dashboard/WidgetCard";
import { LoadingState, EmptyState, ErrorState } from "@/components/states";
import { Chip } from "@/components/ui/chip";
import { WorkItemDetailsPanel } from "@/components/work-item/WorkItemDetailsPanel";
import { typeMeta } from "@/lib/work-item-type-style";
import { formatSupabaseError } from "@/lib/supabase-errors";
import { listProjects } from "@/lib/projects-api";
import { epicColor, listEpics, type EpicRow } from "@/lib/epics-api";
import { listSprintsByProject, type SprintRow } from "@/lib/sprints-api";
import {
  listTimelineWorkItems,
  updateWorkItemDates,
  type TimelineWorkItem,
} from "@/lib/work-items-api";
import {
  listRelationsForItems,
  type WorkItemRelationRow,
} from "@/lib/work-item-relations-api";

export const Route = createFileRoute("/_workspace/timeline")({
  head: () => ({
    meta: [
      { title: "Timeline — Altech Project" },
      {
        name: "description",
        content:
          "Grid temporal de 30 dias com work items agrupados por épico, barras arrastáveis, dependências e progresso no Altech Project.",
      },
      { property: "og:title", content: "Timeline — Altech Project" },
      {
        property: "og:description",
        content:
          "Planeje datas de início e entrega arrastando barras, com dependências e réguas de sprint.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: TimelinePage,
});

/* ------------------------------------------------------------------ */
/* Constantes de layout                                                 */
/* ------------------------------------------------------------------ */

const DAYS = 30;
const DAY_W = 40;
const ROW_H = 38;
const GROUP_H = 30;
const LABEL_W = 280;
const GRID_W = DAYS * DAY_W;
const DAY_MS = 86_400_000;

const WEEKDAYS = ["D", "S", "T", "Q", "Q", "S", "S"];

/* ------------------------------------------------------------------ */
/* Datas                                                                */
/* ------------------------------------------------------------------ */

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function parseDate(iso: string | null | undefined): Date | null {
  if (!iso) return null;
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

function toIso(d: Date): string {
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}

function addDays(d: Date, n: number): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
}

function dayIndex(origin: Date, d: Date): number {
  return Math.round((startOfDay(d).getTime() - origin.getTime()) / DAY_MS);
}

/* ------------------------------------------------------------------ */
/* Filtro multi-select com busca                                        */
/* ------------------------------------------------------------------ */

interface FacetOption {
  value: string;
  label: string;
  color?: string;
}

function FacetFilter({
  label,
  options,
  selected,
  onChange,
}: {
  label: string;
  options: FacetOption[];
  selected: string[];
  onChange: (next: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const [term, setTerm] = useState("");

  const filtered = useMemo(() => {
    const t = term.trim().toLowerCase();
    return t ? options.filter((o) => o.label.toLowerCase().includes(t)) : options;
  }, [options, term]);

  const toggle = (value: string) => {
    onChange(
      selected.includes(value)
        ? selected.filter((v) => v !== value)
        : [...selected, value],
    );
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="h-9 gap-2">
          <span className="text-sm">{label}</span>
          {selected.length > 0 ? (
            <span className="rounded-full bg-primary/15 px-2 text-xs text-primary">
              {selected.length}
            </span>
          ) : null}
          <ChevronDown size={14} className="opacity-60" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-64 p-0">
        <div className="flex items-center gap-2 border-b border-border px-3 py-2">
          <Search size={14} className="opacity-60" />
          <Input
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder={`Buscar ${label.toLowerCase()}…`}
            className="h-7 border-0 px-0 shadow-none focus-visible:ring-0"
          />
        </div>
        <div className="max-h-64 overflow-y-auto py-1">
          {filtered.length === 0 ? (
            <p className="px-3 py-4 text-center text-xs text-muted-foreground">
              Nada encontrado.
            </p>
          ) : (
            filtered.map((o) => {
              const active = selected.includes(o.value);
              return (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => toggle(o.value)}
                  className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm hover:bg-accent/40"
                >
                  <span
                    className={cn(
                      "flex h-4 w-4 items-center justify-center rounded border border-border",
                      active && "border-primary bg-primary text-primary-foreground",
                    )}
                  >
                    {active ? <Check size={11} /> : null}
                  </span>
                  {o.color ? (
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ background: o.color }}
                    />
                  ) : null}
                  <span className="truncate">{o.label}</span>
                </button>
              );
            })
          )}
        </div>
        {selected.length > 0 ? (
          <div className="border-t border-border p-2">
            <Button
              variant="ghost"
              size="sm"
              className="w-full"
              onClick={() => onChange([])}
            >
              Limpar seleção
            </Button>
          </div>
        ) : null}
      </PopoverContent>
    </Popover>
  );
}

/* ------------------------------------------------------------------ */
/* Página                                                               */
/* ------------------------------------------------------------------ */

type DragMode = "move" | "start" | "end";

interface DragState {
  id: string;
  mode: DragMode;
  originX: number;
  deltaDays: number;
}

interface Bar {
  item: TimelineWorkItem;
  startIdx: number;
  endIdx: number;
}

interface Group {
  key: string;
  label: string;
  color: string;
  bars: Bar[];
}

interface RowLayout {
  y: number;
  bar: Bar;
}

function TimelinePage() {
  const qc = useQueryClient();
  const [projectId, setProjectId] = useState<string>("");
  const [epicFilter, setEpicFilter] = useState<string[]>([]);
  const [sprintFilter, setSprintFilter] = useState<string[]>([]);
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [drag, setDrag] = useState<DragState | null>(null);

  const origin = useMemo(() => addDays(startOfDay(new Date()), -7), []);
  const days = useMemo(
    () => Array.from({ length: DAYS }, (_, i) => addDays(origin, i)),
    [origin],
  );
  const todayIdx = dayIndex(origin, new Date());

  const projectsQ = useQuery({ queryKey: ["projects", "timeline"], queryFn: listProjects });
  const projects = projectsQ.data ?? [];
  const activeProject = projectId || projects[0]?.id || "";
  const activeSlug =
    projects.find((p) => p.id === activeProject)?.slug ?? activeProject;

  const itemsQ = useQuery({
    queryKey: ["timeline", activeProject, "items"],
    queryFn: () => listTimelineWorkItems(activeProject),
    enabled: Boolean(activeProject),
    retry: false,
  });
  const epicsQ = useQuery({
    queryKey: ["timeline", activeProject, "epics"],
    queryFn: () => listEpics(activeProject),
    enabled: Boolean(activeProject),
  });
  const sprintsQ = useQuery({
    queryKey: ["timeline", activeSlug, "sprints"],
    queryFn: () => listSprintsByProject(activeSlug),
    enabled: Boolean(activeSlug),
  });

  const items = itemsQ.data ?? [];
  const epics: EpicRow[] = epicsQ.data ?? [];
  const sprints: SprintRow[] = sprintsQ.data ?? [];

  const itemIds = useMemo(() => items.map((i) => i.id), [items]);
  const relationsQ = useQuery({
    queryKey: ["timeline", activeProject, "relations", itemIds.length],
    queryFn: () => listRelationsForItems(itemIds, "blocks"),
    enabled: itemIds.length > 0,
  });
  const relations: WorkItemRelationRow[] = relationsQ.data ?? [];

  /* ---------------- filtros (AND) ---------------- */

  const filtered = useMemo(
    () =>
      items.filter((i) => {
        if (epicFilter.length > 0 && !epicFilter.includes(i.epic_id ?? "__none__"))
          return false;
        if (
          sprintFilter.length > 0 &&
          !sprintFilter.includes(i.sprint_id ?? "__none__")
        )
          return false;
        return true;
      }),
    [items, epicFilter, sprintFilter],
  );

  const missingDates = filtered.filter((i) => !i.start_date || !i.due_date);

  /* ---------------- barras e grupos ---------------- */

  const groups = useMemo<Group[]>(() => {
    const epicById = new Map(epics.map((e) => [e.id, e]));
    const buckets = new Map<string, Group>();

    for (const item of filtered) {
      const start = parseDate(item.start_date);
      const due = parseDate(item.due_date);
      if (!start || !due) continue;

      const startIdx = dayIndex(origin, start);
      const endIdx = Math.max(startIdx, dayIndex(origin, due));
      if (endIdx < 0 || startIdx > DAYS - 1) continue; // fora da janela de 30 dias

      const epic = item.epic_id ? epicById.get(item.epic_id) : undefined;
      const key = epic?.id ?? "__none__";
      let group = buckets.get(key);
      if (!group) {
        group = {
          key,
          label: epic ? `${epic.key} · ${epic.label}` : "Sem épico",
          color: epic ? epicColor(epic.color) : "var(--muted-foreground)",
          bars: [],
        };
        buckets.set(key, group);
      }
      group.bars.push({ item, startIdx, endIdx });
    }

    const list = [...buckets.values()];
    list.sort((a, b) => (a.key === "__none__" ? 1 : b.key === "__none__" ? -1 : a.label.localeCompare(b.label)));
    for (const g of list) g.bars.sort((a, b) => a.startIdx - b.startIdx);
    return list;
  }, [filtered, epics, origin]);

  /** posição vertical de cada barra, compartilhada por linhas e curvas SVG */
  const layout = useMemo(() => {
    const rows = new Map<string, RowLayout>();
    let y = 0;
    for (const g of groups) {
      y += GROUP_H;
      for (const bar of g.bars) {
        rows.set(bar.item.id, { y, bar });
        y += ROW_H;
      }
    }
    return { rows, height: y };
  }, [groups]);

  /* ---------------- drag & resize ---------------- */

  const saveMutation = useMutation({
    mutationFn: (vars: { id: string; start_date: string; due_date: string }) =>
      updateWorkItemDates(vars.id, {
        start_date: vars.start_date,
        due_date: vars.due_date,
      }),
    onSuccess: () => {
      toast.success("Datas atualizadas.");
      void qc.invalidateQueries({ queryKey: ["timeline", activeProject, "items"] });
    },
    onError: (err) => toast.error(formatSupabaseError(err)),
  });

  const dragRef = useRef<DragState | null>(null);
  dragRef.current = drag;

  const commitDrag = useCallback(() => {
    const current = dragRef.current;
    setDrag(null);
    if (!current || current.deltaDays === 0) return;
    const row = layout.rows.get(current.id);
    if (!row) return;
    const { item } = row.bar;
    const start = parseDate(item.start_date);
    const due = parseDate(item.due_date);
    if (!start || !due) return;

    let nextStart = start;
    let nextDue = due;
    if (current.mode === "move") {
      nextStart = addDays(start, current.deltaDays);
      nextDue = addDays(due, current.deltaDays);
    } else if (current.mode === "start") {
      nextStart = addDays(start, current.deltaDays);
      if (nextStart > nextDue) nextStart = nextDue;
    } else {
      nextDue = addDays(due, current.deltaDays);
      if (nextDue < nextStart) nextDue = nextStart;
    }
    saveMutation.mutate({
      id: item.id,
      start_date: toIso(nextStart),
      due_date: toIso(nextDue),
    });
  }, [layout, saveMutation]);

  useEffect(() => {
    if (!drag) return;
    const onMove = (e: PointerEvent) => {
      setDrag((cur) =>
        cur
          ? { ...cur, deltaDays: Math.round((e.clientX - cur.originX) / DAY_W) }
          : cur,
      );
    };
    const onUp = () => commitDrag();
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [drag, commitDrag]);

  const beginDrag = (e: React.PointerEvent, id: string, mode: DragMode) => {
    e.preventDefault();
    e.stopPropagation();
    setDrag({ id, mode, originX: e.clientX, deltaDays: 0 });
  };

  /** geometria da barra já com o offset do arraste em curso */
  const barGeometry = (bar: Bar) => {
    let s = bar.startIdx;
    let e = bar.endIdx;
    if (drag && drag.id === bar.item.id) {
      if (drag.mode === "move") {
        s += drag.deltaDays;
        e += drag.deltaDays;
      } else if (drag.mode === "start") {
        s = Math.min(s + drag.deltaDays, e);
      } else {
        e = Math.max(e + drag.deltaDays, s);
      }
    }
    const left = s * DAY_W;
    const width = (e - s + 1) * DAY_W;
    return { left, width, startIdx: s, endIdx: e };
  };

  /* ---------------- réguas ---------------- */

  const sprintBands = useMemo(() => {
    return sprints
      .map((s) => {
        const start = parseDate(s.data_inicio);
        const end = parseDate(s.data_fim);
        if (!start || !end) return null;
        const a = dayIndex(origin, start);
        const b = dayIndex(origin, end);
        if (b < 0 || a > DAYS - 1) return null;
        const from = Math.max(0, a);
        const to = Math.min(DAYS - 1, b);
        return { id: s.id, name: s.nome, left: from * DAY_W, width: (to - from + 1) * DAY_W };
      })
      .filter(Boolean) as { id: string; name: string; left: number; width: number }[];
  }, [sprints, origin]);

  const loading =
    projectsQ.isLoading || itemsQ.isLoading || epicsQ.isLoading || sprintsQ.isLoading;
  const error = projectsQ.error ?? itemsQ.error ?? epicsQ.error;

  const epicOptions: FacetOption[] = [
    ...epics.map((e) => ({ value: e.id, label: `${e.key} · ${e.label}`, color: epicColor(e.color) })),
    { value: "__none__", label: "Sem épico" },
  ];
  const sprintOptions: FacetOption[] = [
    ...sprints.map((s) => ({ value: s.id, label: s.nome })),
    { value: "__none__", label: "Sem sprint" },
  ];

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Timeline</h1>
          <p className="text-sm text-muted-foreground">
            Janela de 30 dias com work items por épico. Arraste para mover, use as
            bordas para redimensionar.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={activeProject} onValueChange={setProjectId}>
            <SelectTrigger className="w-52">
              <SelectValue placeholder="Projeto" />
            </SelectTrigger>
            <SelectContent>
              {projects.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FacetFilter
            label="Épico"
            options={epicOptions}
            selected={epicFilter}
            onChange={setEpicFilter}
          />
          <FacetFilter
            label="Sprint"
            options={sprintOptions}
            selected={sprintFilter}
            onChange={setSprintFilter}
          />
        </div>
      </header>

      <div
        className={cn(
          "grid gap-6",
          selectedItem ? "grid-cols-1 xl:grid-cols-[1fr_440px]" : "grid-cols-1",
        )}
      >
        <div className="min-w-0 space-y-3">
          {missingDates.length > 0 ? (
            <p className="text-xs text-[var(--warning)]">
              {missingDates.length} item(ns) sem start_date e/ou due_date preenchidos —
              não aparecem na timeline.
            </p>
          ) : null}

          {error ? (
            <ErrorState
              description={formatSupabaseError(error)}
              onRetry={() => {
                void itemsQ.refetch();
                void epicsQ.refetch();
              }}
            />
          ) : loading ? (
            <LoadingState label="Carregando timeline…" />
                    ) : groups.length === 0 ? (
            <EmptyState
              title="Nada para exibir nesta janela"
              description="Nenhum work item com start_date e due_date dentro dos próximos 30 dias para os filtros atuais."
            />
          ) : (
            <WidgetCard className="overflow-hidden p-0">
              <div className="flex">
                {/* Coluna de rótulos */}
                <div
                  className="shrink-0 border-r border-border"
                  style={{ width: LABEL_W }}
                >
                  <div className="h-[52px] border-b border-border px-3 py-2 text-xs font-medium text-muted-foreground">
                    Work item
                  </div>
                  {groups.map((g) => (
                    <div key={g.key}>
                      <div
                        className="flex items-center gap-2 bg-[var(--bg-surface-2)] px-3 text-xs font-semibold text-foreground"
                        style={{ height: GROUP_H }}
                      >
                        <span
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ background: g.color }}
                        />
                        <span className="truncate">{g.label}</span>
                        <span className="text-muted-foreground">({g.bars.length})</span>
                      </div>
                      {g.bars.map(({ item }) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setSelectedItem(item.id)}
                          className={cn(
                            "flex w-full items-center gap-2 border-b border-border/60 px-3 text-left text-sm hover:bg-accent/30",
                            selectedItem === item.id && "bg-accent/40",
                          )}
                          style={{ height: ROW_H }}
                        >
                          <Chip
                            label={typeMeta(item.type).label}
                            variant="custom"
                            color={typeMeta(item.type).color}
                            size="xs"
                          />
                          <span className="truncate">{item.title}</span>
                        </button>
                      ))}
                    </div>
                  ))}
                </div>

                {/* Grid temporal */}
                <div className="min-w-0 flex-1 overflow-x-auto">
                  <div style={{ width: GRID_W }}>
                    {/* cabeçalho: sprints + dias */}
                    <div className="relative h-[52px] border-b border-border">
                      <div className="relative h-5">
                        {sprintBands.map((b) => (
                          <div
                            key={b.id}
                            className="absolute top-1 flex h-4 items-center overflow-hidden rounded-sm bg-primary/15 px-2 text-[10px] text-primary"
                            style={{ left: b.left, width: b.width }}
                          >
                            <span className="truncate">{b.name}</span>
                          </div>
                        ))}
                      </div>
                      <div className="flex">
                        {days.map((d, i) => {
                          const weekend = d.getDay() === 0 || d.getDay() === 6;
                          const isToday = i === todayIdx;
                          return (
                            <div
                              key={i}
                              className={cn(
                                "flex flex-col items-center justify-center border-l border-border/50 text-[10px]",
                                weekend ? "text-muted-foreground/60" : "text-muted-foreground",
                                isToday && "font-semibold text-primary",
                              )}
                              style={{ width: DAY_W, height: 32 }}
                            >
                              <span>{WEEKDAYS[d.getDay()]}</span>
                              <span>{d.getDate()}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* corpo */}
                    <div className="relative" style={{ height: layout.height }}>
                      {/* colunas de fundo */}
                      <div className="absolute inset-0 flex">
                        {days.map((d, i) => (
                          <div
                            key={i}
                            className={cn(
                              "border-l border-border/40",
                              (d.getDay() === 0 || d.getDay() === 6) && "bg-muted/20",
                            )}
                            style={{ width: DAY_W }}
                          />
                        ))}
                      </div>
                      {/* marcador de hoje */}
                      {todayIdx >= 0 && todayIdx < DAYS ? (
                        <div
                          className="absolute top-0 bottom-0 w-px bg-primary"
                          style={{ left: todayIdx * DAY_W + DAY_W / 2 }}
                        />
                      ) : null}

                      {/* curvas de dependência ('blocks') */}
                      <svg
                        className="pointer-events-none absolute inset-0"
                        width={GRID_W}
                        height={layout.height}
                      >
                        {relations.map((rel) => {
                          const from = layout.rows.get(rel.source_id);
                          const to = layout.rows.get(rel.target_id);
                          if (!from || !to) return null;
                          const g1 = barGeometry(from.bar);
                          const g2 = barGeometry(to.bar);
                          const x1 = g1.left + g1.width;
                          const y1 = from.y + ROW_H / 2;
                          const x2 = g2.left;
                          const y2 = to.y + ROW_H / 2;
                          const dx = Math.max(24, Math.abs(x2 - x1) / 2);
                          return (
                            <path
                              key={rel.id}
                              d={`M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`}
                              fill="none"
                              stroke="var(--blocked)"
                              strokeWidth={1.5}
                              strokeDasharray="4 3"
                            />
                          );
                        })}
                      </svg>

                      {/* linhas + barras */}
                      {groups.map((g) => (
                        <div key={g.key} className="relative">
                          <div
                            className="relative bg-[var(--bg-surface-2)]"
                            style={{ height: GROUP_H }}
                          />
                          {g.bars.map((bar) => {
                            const geo = barGeometry(bar);
                            const progress = Math.max(
                              0,
                              Math.min(100, bar.item.progress ?? 0),
                            );
                            const dragging = drag?.id === bar.item.id;
                            return (
                              <div
                                key={bar.item.id}
                                className="relative border-b border-border/60"
                                style={{ height: ROW_H }}
                              >
                                <div
                                  role="button"
                                  tabIndex={0}
                                  onPointerDown={(e) => beginDrag(e, bar.item.id, "move")}
                                  onClick={() => setSelectedItem(bar.item.id)}
                                  title={`${bar.item.title} — ${bar.item.start_date} → ${bar.item.due_date} (${progress}%)`}
                                  className={cn(
                                    "absolute top-1.5 flex h-[26px] cursor-grab items-center overflow-hidden rounded-md border text-[11px] select-none",
                                    dragging && "cursor-grabbing ring-2 ring-primary",
                                  )}
                                  style={{
                                    left: geo.left,
                                    width: geo.width,
                                    background: `color-mix(in srgb, ${g.color} 22%, transparent)`,
                                    borderColor: g.color,
                                  }}
                                >
                                  <div
                                    className="absolute inset-y-0 left-0"
                                    style={{
                                      width: `${progress}%`,
                                      background: `color-mix(in srgb, ${g.color} 45%, transparent)`,
                                    }}
                                  />
                                  <span
                                    onPointerDown={(e) => beginDrag(e, bar.item.id, "start")}
                                    className="absolute inset-y-0 left-0 z-10 w-2 cursor-ew-resize"
                                  />
                                  <span className="relative z-[5] truncate px-2 text-foreground">
                                    {bar.item.title}
                                    {progress > 0 ? ` · ${progress}%` : ""}
                                  </span>
                                  <span
                                    onPointerDown={(e) => beginDrag(e, bar.item.id, "end")}
                                    className="absolute inset-y-0 right-0 z-10 w-2 cursor-ew-resize"
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </WidgetCard>
          )}
        </div>

        {selectedItem ? (
          <WidgetCard className="h-fit xl:sticky xl:top-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-foreground">
                Detalhes do work item
              </h2>
              <Button variant="ghost" size="icon" onClick={() => setSelectedItem(null)}>
                <X size={16} />
              </Button>
            </div>
            <WorkItemDetailsPanel
              workItemId={selectedItem}
              originPath="/timeline"
              onChange={() =>
                void qc.invalidateQueries({
                  queryKey: ["timeline", activeProject, "items"],
                })
              }
            />
          </WidgetCard>
        ) : null}
      </div>
    </div>
  );
}
