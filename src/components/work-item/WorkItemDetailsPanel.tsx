import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { LoadingState, ErrorState, EmptyState } from "@/components/states";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Trash2, GitBranch, Link2, History, Users, ExternalLink } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { qk } from "@/lib/query-keys";
import { auditLog } from "@/lib/audit-log";
import { useAuth } from "@/lib/auth";
import { pickAvatarColor } from "@/lib/team-members-api";
import {
  fetchWorkItem,
  patchWorkItem,
  listChildren,
  listProjectItems,
  listProjectAssignees,
  listRelations,
  addRelation,
  removeRelation,
  listItemHistory,
  typeMeta,
  WORK_ITEM_TYPES,
  RELATION_TYPES,
  RELATION_LABEL,
  type WorkItemFull,
  type WorkItemType,
  type RelationType,
} from "@/lib/work-item-behavior-api";
import { WorkItemCommentsLive } from "./WorkItemCommentsLive";
import { WorkItemAttachmentsLive } from "./WorkItemAttachmentsLive";

const STATUS_OPTIONS = ["Backlog", "A Fazer", "Em Progresso", "Em Revisão", "Concluído"];
const PRIORITY_OPTIONS = [
  { value: "baixa", label: "Baixa" },
  { value: "media", label: "Média" },
  { value: "alta", label: "Alta" },
  { value: "critica", label: "Crítica" },
];

function initials(name?: string | null) {
  if (!name) return "?";
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("") || "?";
}

export function WorkItemDetailsPanel({
  workItemId,
  onChange,
  originPath,
}: {
  workItemId: string;
  onChange?: () => void;
  /** Rota (com search) que originou a abertura — Backlog/Board/Sprint.
   *  Propagada nos links internos para que o botão Voltar do detalhe
   *  retorne à origem, sem trocar de projeto. */
  originPath?: string;
}) {
  const qc = useQueryClient();
  const { user } = useAuth();
  const key = qk.workItem(workItemId);

  const { data: row, isLoading, error, refetch } = useQuery({
    queryKey: key,
    queryFn: () => fetchWorkItem(workItemId),
  });

  const [item, setItem] = useState<WorkItemFull | null>(null);
  useEffect(() => {
    setItem(row ?? null);
  }, [row]);

  const projectId = item?.project_id ?? "";

  const { data: assignees = [] } = useQuery({
    queryKey: ["project_assignees", projectId],
    queryFn: () => listProjectAssignees(projectId),
    enabled: !!projectId,
  });

  const { data: children = [] } = useQuery({
    queryKey: ["work_item_children", workItemId],
    queryFn: () => listChildren(workItemId),
  });

  const { data: siblings = [] } = useQuery({
    queryKey: ["work_item_project_items", projectId, workItemId],
    queryFn: () => listProjectItems(projectId, workItemId),
    enabled: !!projectId,
  });

  const { data: relations = [], refetch: refetchRel } = useQuery({
    queryKey: ["work_item_relations", workItemId],
    queryFn: () => listRelations(workItemId),
  });

  const { data: history = [], refetch: refetchHist } = useQuery({
    queryKey: ["work_item_history", workItemId],
    queryFn: () => listItemHistory(workItemId),
  });

  const parent = useMemo(
    () => siblings.find((s) => s.id === item?.parent_id) ?? null,
    [siblings, item?.parent_id],
  );

  const assigneeById = useMemo(() => {
    const m = new Map(assignees.map((a) => [a.id, a]));
    return m;
  }, [assignees]);

  async function invalidateLists() {
    await qc.invalidateQueries({ queryKey: qk.workItems() });
    await qc.invalidateQueries({ queryKey: key });
    onChange?.();
  }

  async function save(delta: Partial<WorkItemFull>) {
    if (!item) return;
    const before = { ...item };
    const optimistic: WorkItemFull = { ...item, ...delta };
    setItem(optimistic);
    try {
      const saved = await patchWorkItem(item.id, delta);
      setItem(saved);
      await invalidateLists();

      // Audit — categorized events
      const events: string[] = ["work_item.updated"];
      if (delta.status !== undefined && delta.status !== before.status)
        events.push("work_item.status.changed");
      if (delta.assignee_id !== undefined && delta.assignee_id !== before.assignee_id)
        events.push("work_item.assignee.changed");
      if (delta.priority !== undefined && delta.priority !== before.priority)
        events.push("work_item.priority.changed");
      for (const ev of events) {
        void auditLog({
          event: ev,
          actor_id: user?.id ?? null,
          actor_name: user?.name ?? null,
          entity_type: "work_item",
          entity_id: item.id,
          before,
          after: saved,
        });
      }
      void refetchHist();
    } catch (err) {
      setItem(before);
      toast.error(err instanceof Error ? err.message : "Erro ao salvar");
    }
  }

  async function handleDelete() {
    if (!item) return;
    if (!confirm(`Excluir “${item.title}”?`)) return;
    const { error: e } = await supabase.from("work_items").delete().eq("id", item.id);
    if (e) return toast.error(e.message);
    void auditLog({
      event: "work_item.deleted",
      actor_id: user?.id ?? null,
      actor_name: user?.name ?? null,
      entity_type: "work_item",
      entity_id: item.id,
      before: item,
    });
    toast.success("Work item excluído.");
    await invalidateLists();
  }

  if (isLoading) return <LoadingState label="Carregando work item…" />;
  if (error)
    return (
      <ErrorState
        description={error instanceof Error ? error.message : String(error)}
        onRetry={() => void refetch()}
      />
    );
  if (!item)
    return <EmptyState title="Nada por aqui ainda" description="Work item não encontrado." />;

  const t = typeMeta(item.type);
  const assignee = item.assignee_id ? assigneeById.get(item.assignee_id) : null;

  return (
    <div className="grid gap-6 pt-4 lg:grid-cols-[1fr_280px]">
      <div className="space-y-6">
        {/* Header */}
        <header className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className={t.badge}>{t.label}</Badge>
            <span className="rounded bg-muted px-2 py-0.5 text-xs font-mono text-muted-foreground">
              {item.id.slice(0, 6)}
            </span>
            {assignee && (
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Avatar className="h-5 w-5">
                  <AvatarFallback
                    style={{ backgroundColor: assignee.avatar_color ?? pickAvatarColor(assignee.name), color: "white", fontSize: 10 }}
                  >
                    {initials(assignee.name)}
                  </AvatarFallback>
                </Avatar>
                {assignee.name}
              </span>
            )}
          </div>
          <Input
            className="text-lg font-semibold"
            value={item.title}
            onChange={(e) => setItem({ ...item, title: e.target.value })}
            onBlur={(e) => {
              const v = e.target.value.trim();
              if (v && v !== row?.title) void save({ title: v });
            }}
          />

          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <FieldRow label="Tipo">
              <Select value={item.type} onValueChange={(v) => void save({ type: v as WorkItemType })}>
                <SelectTrigger className="h-8 w-40"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {WORK_ITEM_TYPES.map((tt) => (
                    <SelectItem key={tt} value={tt}>{typeMeta(tt).label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FieldRow>
            <FieldRow label="Status">
              <Select value={item.status ?? ""} onValueChange={(v) => void save({ status: v })}>
                <SelectTrigger className="h-8 w-44"><SelectValue placeholder="—" /></SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </FieldRow>
            <FieldRow label="Prioridade">
              <Select value={item.priority} onValueChange={(v) => void save({ priority: v })}>
                <SelectTrigger className="h-8 w-32"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PRIORITY_OPTIONS.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </FieldRow>
            <FieldRow label="Responsável">
              <Select
                value={item.assignee_id ?? "__none"}
                onValueChange={(v) => void save({ assignee_id: v === "__none" ? null : v })}
              >
                <SelectTrigger className="h-8 w-52"><SelectValue placeholder="—" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none">Sem responsável</SelectItem>
                  {assignees.map((a) => (
                    <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FieldRow>
          </div>
        </header>

        {/* Description */}
        <section className="space-y-2">
          <h3 className="text-sm font-medium">Descrição</h3>
          <Textarea
            rows={5}
            value={item.description ?? ""}
            onChange={(e) => setItem({ ...item, description: e.target.value })}
            onBlur={(e) => {
              const v = e.target.value;
              if ((v || null) !== (row?.description ?? null)) void save({ description: v || null });
            }}
            placeholder="Descreva o work item…"
          />
        </section>

        {/* Conditional fields by type */}
        <ConditionalFields item={item} onChange={setItem} onSave={save} />

        {/* Hierarchy */}
        <HierarchySection
          item={item}
          parent={parent}
          children={children}
          siblings={siblings}
          onSaveParent={(pid) => void save({ parent_id: pid })}
        />

        {/* Relations */}
        <RelationsSection
          itemId={item.id}
          relations={relations}
          siblings={siblings}
          onChanged={() => void refetchRel()}
        />

        <WorkItemCommentsLive workItemId={item.id} />
        <WorkItemAttachmentsLive workItemId={item.id} />

        {/* History */}
        <HistorySection history={history} />
      </div>

      {/* Sidebar */}
      <aside className="space-y-3 rounded-xl border border-border bg-panel/40 p-4 text-sm">
        <h3 className="text-sm font-medium">Metadados</h3>
        <MetaRow label="Projeto" value={item.project_id} />
        <MetaRow label="ID" value={item.id.slice(0, 8)} />
        <MetaRow
          label="Criado em"
          value={item.created_at ? new Date(item.created_at).toLocaleString() : "—"}
        />
        <MetaRow label="Filhos" value={String(children.length)} />
        <MetaRow label="Relações" value={String(relations.length)} />
        <div className="pt-3">
          <Button
            variant="outline"
            size="sm"
            className="w-full text-destructive"
            onClick={() => void handleDelete()}
          >
            <Trash2 className="mr-1.5 h-3.5 w-3.5" />
            Excluir work item
          </Button>
        </div>
      </aside>
    </div>
  );
}

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground">{label}</span>
      {children}
    </div>
  );
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-2 border-b border-border/50 py-1 last:border-0">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="truncate text-xs text-foreground">{value}</span>
    </div>
  );
}

/* ---------------- Conditional fields ---------------- */

function ConditionalFields({
  item,
  onChange,
  onSave,
}: {
  item: WorkItemFull;
  onChange: (i: WorkItemFull) => void;
  onSave: (delta: Partial<WorkItemFull>) => void;
}) {
  if (item.type === "story") {
    return (
      <section className="space-y-2">
        <h3 className="text-sm font-medium">Critérios de aceite</h3>
        <Textarea
          rows={4}
          placeholder="Um critério por linha…"
          value={item.acceptance_criteria ?? ""}
          onChange={(e) => onChange({ ...item, acceptance_criteria: e.target.value })}
          onBlur={(e) => onSave({ acceptance_criteria: e.target.value || null })}
        />
      </section>
    );
  }
  if (item.type === "task" || item.type === "subtask") {
    return (
      <section className="space-y-2">
        <h3 className="text-sm font-medium">Prazo</h3>
        <Input
          type="date"
          className="w-52"
          value={item.due_date ?? ""}
          onChange={(e) => onChange({ ...item, due_date: e.target.value || null })}
          onBlur={(e) => onSave({ due_date: e.target.value || null })}
        />
      </section>
    );
  }
  if (item.type === "epic" || item.type === "feature") {
    return (
      <section className="space-y-2">
        <h3 className="text-sm font-medium">Progresso</h3>
        <div className="flex items-center gap-3">
          <Input
            type="number"
            min={0}
            max={100}
            className="w-24"
            value={item.progress ?? 0}
            onChange={(e) =>
              onChange({ ...item, progress: Number(e.target.value) })
            }
            onBlur={(e) => {
              const n = Math.max(0, Math.min(100, Number(e.target.value) || 0));
              onSave({ progress: n });
            }}
          />
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full bg-primary transition-all"
              style={{ width: `${Math.max(0, Math.min(100, item.progress ?? 0))}%` }}
            />
          </div>
        </div>
      </section>
    );
  }
  if (item.type === "bug") {
    return (
      <section className="space-y-2">
        <h3 className="text-sm font-medium">Severidade</h3>
        <Select
          value={item.severity ?? ""}
          onValueChange={(v) => onSave({ severity: v })}
        >
          <SelectTrigger className="h-8 w-52">
            <SelectValue placeholder="Selecionar…" />
          </SelectTrigger>
          <SelectContent>
            {["trivial", "menor", "maior", "critica", "bloqueante"].map((s) => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </section>
    );
  }
  if (item.type === "risk") {
    return (
      <section className="grid gap-3 md:grid-cols-2">
        <div className="space-y-1">
          <h4 className="text-sm font-medium">Probabilidade</h4>
          <Select
            value={item.probability ?? ""}
            onValueChange={(v) => onSave({ probability: v })}
          >
            <SelectTrigger className="h-8"><SelectValue placeholder="—" /></SelectTrigger>
            <SelectContent>
              {["baixa", "media", "alta"].map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <h4 className="text-sm font-medium">Impacto</h4>
          <Select
            value={item.impact ?? ""}
            onValueChange={(v) => onSave({ impact: v })}
          >
            <SelectTrigger className="h-8"><SelectValue placeholder="—" /></SelectTrigger>
            <SelectContent>
              {["baixo", "medio", "alto"].map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1 md:col-span-2">
          <h4 className="text-sm font-medium">Plano de mitigação</h4>
          <Textarea
            rows={4}
            value={item.mitigation_plan ?? ""}
            onChange={(e) => onChange({ ...item, mitigation_plan: e.target.value })}
            onBlur={(e) => onSave({ mitigation_plan: e.target.value || null })}
          />
        </div>
      </section>
    );
  }
  return null;
}

/* ---------------- Hierarchy ---------------- */

function HierarchySection({
  item,
  parent,
  children,
  siblings,
  onSaveParent,
}: {
  item: WorkItemFull;
  parent: WorkItemFull | Pick<WorkItemFull, "id" | "title" | "type"> | null;
  children: WorkItemFull[];
  siblings: Pick<WorkItemFull, "id" | "title" | "type">[];
  onSaveParent: (parentId: string | null) => void;
}) {
  const isEpic = item.type === "epic";
  const isSubtask = item.type === "subtask";

  // Valid parent types by current item type
  const validParentTypes: Record<WorkItemType, WorkItemType[]> = {
    epic: [],
    feature: ["epic"],
    story: ["epic", "feature"],
    task: ["story", "feature", "epic"],
    subtask: ["task"],
    bug: ["epic", "feature", "story", "task"],
    risk: ["epic", "feature", "story"],
  };
  const allowed = validParentTypes[item.type as WorkItemType] ?? [];
  const parentOptions = siblings.filter((s) =>
    allowed.includes(s.type as WorkItemType),
  );

  // Group children by type
  const grouped = useMemo(() => {
    const map = new Map<WorkItemType, WorkItemFull[]>();
    children.forEach((c) => {
      const k = (c.type as WorkItemType) ?? "task";
      if (!map.has(k)) map.set(k, []);
      map.get(k)!.push(c);
    });
    return Array.from(map.entries()).sort(([a], [b]) =>
      WORK_ITEM_TYPES.indexOf(a) - WORK_ITEM_TYPES.indexOf(b),
    );
  }, [children]);

  function handleParentChange(v: string) {
    if (v === "__none") {
      if (isSubtask) {
        toast.error("Subtarefa exige um item pai.");
        return;
      }
      onSaveParent(null);
    } else {
      onSaveParent(v);
    }
  }

  return (
    <section className="space-y-3">
      <h3 className="flex items-center gap-2 text-sm font-medium">
        <GitBranch className="h-4 w-4" /> Hierarquia
      </h3>
      <div className="grid gap-3 rounded-xl border border-border bg-panel/40 p-3 text-sm">
        <div className="flex flex-wrap items-center gap-2">
          <span className="w-20 text-xs text-muted-foreground">
            Pai{isSubtask ? " *" : ""}
          </span>
          {isEpic ? (
            <span className="text-xs text-muted-foreground">
              Épicos não possuem pai.
            </span>
          ) : (
            <>
              <Select
                value={item.parent_id ?? "__none"}
                onValueChange={handleParentChange}
              >
                <SelectTrigger className="h-8 flex-1 min-w-52">
                  <SelectValue placeholder="—" />
                </SelectTrigger>
                <SelectContent>
                  {!isSubtask && <SelectItem value="__none">Sem pai</SelectItem>}
                  {parentOptions.length === 0 ? (
                    <div className="px-2 py-1.5 text-xs text-muted-foreground">
                      Nenhum item elegível
                    </div>
                  ) : (
                    parentOptions.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        [{typeMeta(s.type).label}] {s.title}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {parent && (
                <Link
                  to="/work-items/$itemId"
                  params={{ itemId: parent.id }}
                  className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-2 py-1 text-xs hover:bg-accent/40 transition-colors"
                >
                  <Badge variant="outline" className={typeMeta(parent.type).badge}>
                    {typeMeta(parent.type).label}
                  </Badge>
                  <span className="max-w-[220px] truncate">{parent.title}</span>
                  <ExternalLink className="h-3 w-3 text-muted-foreground" />
                </Link>
              )}
            </>
          )}
        </div>

        <div>
          <div className="mb-1 text-xs text-muted-foreground">
            Filhos ({children.length})
          </div>
          {children.length === 0 ? (
            <p className="text-xs text-muted-foreground">Nenhum item filho.</p>
          ) : (
            <div className="space-y-2">
              {grouped.map(([tp, list]) => (
                <div key={tp} className="space-y-1">
                  <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
                    {typeMeta(tp).label} ({list.length})
                  </div>
                  <ul className="space-y-1">
                    {list.map((c) => (
                      <li key={c.id}>
                        <Link
                          to="/work-items/$itemId"
                          params={{ itemId: c.id }}
                          className="flex items-center gap-2 rounded-md px-2 py-1 text-sm hover:bg-accent/40 transition-colors"
                        >
                          <Badge variant="outline" className={typeMeta(c.type).badge}>
                            {typeMeta(c.type).label}
                          </Badge>
                          <span className="flex-1 truncate">{c.title}</span>
                          <ExternalLink className="h-3 w-3 text-muted-foreground" />
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

/* ---------------- Relations ---------------- */

function RelationsSection({
  itemId,
  relations,
  siblings,
  onChanged,
}: {
  itemId: string;
  relations: Awaited<ReturnType<typeof listRelations>>;
  siblings: Pick<WorkItemFull, "id" | "title" | "type">[];
  onChanged: () => void;
}) {
  const [type, setType] = useState<RelationType>("relates_to");
  const [targetId, setTargetId] = useState<string>("");

  async function handleAdd() {
    if (!targetId) return;
    try {
      await addRelation(itemId, targetId, type);
      setTargetId("");
      onChanged();
      toast.success("Relação adicionada.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao vincular");
    }
  }

  async function handleRemove(id: string) {
    try {
      await removeRelation(id);
      onChanged();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao remover");
    }
  }

  return (
    <section className="space-y-3">
      <h3 className="flex items-center gap-2 text-sm font-medium">
        <Link2 className="h-4 w-4" /> Relações
      </h3>
      <div className="rounded-xl border border-border bg-panel/40 p-3 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Select value={type} onValueChange={(v) => setType(v as RelationType)}>
            <SelectTrigger className="h-8 w-44"><SelectValue /></SelectTrigger>
            <SelectContent>
              {RELATION_TYPES.map((r) => (
                <SelectItem key={r} value={r}>{RELATION_LABEL[r]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={targetId} onValueChange={setTargetId}>
            <SelectTrigger className="h-8 flex-1 min-w-52"><SelectValue placeholder="Selecionar item…" /></SelectTrigger>
            <SelectContent>
              {siblings.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  [{typeMeta(s.type).label}] {s.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button size="sm" onClick={() => void handleAdd()} disabled={!targetId}>
            Vincular
          </Button>
        </div>
        {relations.length === 0 ? (
          <p className="text-xs text-muted-foreground">Nenhuma relação.</p>
        ) : (
          <ul className="space-y-1">
            {relations.map((r) => (
              <li key={r.id} className="flex items-center gap-2 text-sm">
                <Badge variant="outline">{RELATION_LABEL[r.relation_type]}</Badge>
                {r.target ? (
                  <Link
                    to="/work-items/$itemId"
                    params={{ itemId: r.target.id }}
                    className="flex flex-1 items-center gap-2 rounded-md px-1.5 py-0.5 hover:bg-accent/40 transition-colors"
                  >
                    <Badge variant="outline" className={typeMeta(r.target.type).badge}>
                      {typeMeta(r.target.type).label}
                    </Badge>
                    <span className="truncate">{r.target.title}</span>
                    <ExternalLink className="h-3 w-3 text-muted-foreground" />
                  </Link>
                ) : (
                  <span className="text-muted-foreground">(alvo removido)</span>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  className="ml-auto"
                  onClick={() => void handleRemove(r.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

/* ---------------- History ---------------- */

function HistorySection({
  history,
}: {
  history: Awaited<ReturnType<typeof listItemHistory>>;
}) {
  return (
    <section className="space-y-2">
      <h3 className="flex items-center gap-2 text-sm font-medium">
        <History className="h-4 w-4" /> Histórico
      </h3>
      {history.length === 0 ? (
        <p className="text-xs text-muted-foreground">Sem eventos registrados.</p>
      ) : (
        <ul className="space-y-1 rounded-xl border border-border bg-panel/40 p-3 text-xs">
          {history.map((h) => (
            <li key={h.id} className="flex items-center gap-2">
              <span className="font-mono text-muted-foreground">
                {new Date(h.created_at).toLocaleString()}
              </span>
              <Badge variant="outline">{h.event}</Badge>
              <span className="truncate text-muted-foreground">
                <Users className="mr-1 inline h-3 w-3" />
                {h.actor_name ?? "sistema"}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
