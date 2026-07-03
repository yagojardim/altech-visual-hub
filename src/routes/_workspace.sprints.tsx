import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { CalendarRange, Plus, Trash2, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { LoadingState, EmptyState, ErrorState } from "@/components/states";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  createSprint,
  deleteSprint,
  isDoneStatus,
  listItemsBySprint,
  listSprints,
  listUnassignedItems,
  setItemSprint,
  SPRINT_STATUS,
  updateSprint,
  type SprintItemRow,
  type SprintRow,
} from "@/lib/sprints-api";
import { listProjects, type ProjectRow } from "@/lib/projects-api";
import { WorkItemDetailsPanel } from "@/components/work-item/WorkItemDetailsPanel";

export const Route = createFileRoute("/_workspace/sprints")({
  head: () => ({
    meta: [{ title: "Sprints · Altech Project" }],
  }),
  component: SprintsIndex,
});

function fmtDate(s: string | null) {
  if (!s) return "—";
  const d = new Date(s + "T00:00:00");
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

function SprintsIndex() {
  const [sprints, setSprints] = useState<SprintRow[]>([]);
  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [openSprintId, setOpenSprintId] = useState<string | null>(null);

  const projectsById = useMemo(() => {
    const m = new Map<string, ProjectRow>();
    for (const p of projects) m.set(p.id, p);
    return m;
  }, [projects]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [s, p] = await Promise.all([listSprints(), listProjects()]);
      setSprints(s);
      setProjects(p);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao carregar sprints");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl">Sprints</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Planeje ciclos de entrega e associe work items a cada sprint do Altech Project.
          </p>
        </div>
        <Button variant="cta" onClick={() => setCreating(true)}>
          <Plus className="mr-1 h-4 w-4" />
          Nova sprint
        </Button>
      </div>

      {loading ? (
        <LoadingState label="Carregando sprints…" variant="skeleton" rows={4} />
      ) : error ? (
        <ErrorState description={error} onRetry={() => void load()} />
      ) : sprints.length === 0 ? (
        <EmptyState
          icon={<CalendarRange className="h-5 w-5" />}
          title="Nada por aqui ainda"
          description="Crie sua primeira sprint para começar."
          action={
            <Button variant="cta" onClick={() => setCreating(true)}>
              <Plus className="mr-1 h-4 w-4" />
              Nova sprint
            </Button>
          }
        />
      ) : (
        <ul className="grid gap-3 md:grid-cols-2">
          {sprints.map((s) => (
            <SprintCard
              key={s.id}
              sprint={s}
              projectName={projectsById.get(s.project_id)?.nome ?? "Projeto"}
              onOpen={() => setOpenSprintId(s.id)}
            />
          ))}
        </ul>
      )}

      <CreateSprintDialog
        open={creating}
        onOpenChange={setCreating}
        projects={projects}
        onCreated={() => void load()}
      />

      <Sheet open={openSprintId !== null} onOpenChange={(o) => !o && setOpenSprintId(null)}>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-xl lg:max-w-3xl">
          <SheetHeader className="sr-only">
            <SheetTitle>Sprint</SheetTitle>
            <SheetDescription>Detalhes e itens da sprint</SheetDescription>
          </SheetHeader>
          {openSprintId && (
            <SprintDetails
              sprintId={openSprintId}
              projectsById={projectsById}
              onChange={() => void load()}
              onDeleted={() => {
                setOpenSprintId(null);
                void load();
              }}
            />
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function SprintCard({
  sprint,
  projectName,
  onOpen,
}: {
  sprint: SprintRow;
  projectName: string;
  onOpen: () => void;
}) {
  const [progress, setProgress] = useState<{ total: number; done: number } | null>(null);

  useEffect(() => {
    let alive = true;
    listItemsBySprint(sprint.id)
      .then((items) => {
        if (!alive) return;
        setProgress({
          total: items.length,
          done: items.filter((i) => isDoneStatus(i.status)).length,
        });
      })
      .catch(() => alive && setProgress({ total: 0, done: 0 }));
    return () => {
      alive = false;
    };
  }, [sprint.id]);

  const pct = progress && progress.total > 0 ? (progress.done / progress.total) * 100 : 0;

  return (
    <li>
      <button
        type="button"
        onClick={onOpen}
        className="group flex w-full flex-col gap-3 rounded-xl border border-border bg-panel p-4 text-left shadow-sm transition hover:border-primary/40 hover:bg-panel-elevated"
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="truncate text-base font-medium text-foreground">{sprint.nome}</h3>
            <p className="mt-0.5 text-xs text-muted-foreground">{projectName}</p>
          </div>
          <Badge variant="outline" className="text-[10px] uppercase">
            {sprint.status}
          </Badge>
        </div>
        {sprint.meta && (
          <p className="line-clamp-2 text-xs text-muted-foreground">{sprint.meta}</p>
        )}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            {fmtDate(sprint.data_inicio)} → {fmtDate(sprint.data_fim)}
          </span>
          <span className="flex items-center gap-1 text-foreground/70 group-hover:text-primary">
            Detalhes <ChevronRight className="h-3 w-3" />
          </span>
        </div>
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[11px] text-muted-foreground">
            <span>Progresso</span>
            <span className="font-medium text-foreground">
              {progress ? `${progress.done}/${progress.total}` : "—"}
            </span>
          </div>
          <Progress value={pct} />
        </div>
      </button>
    </li>
  );
}

function CreateSprintDialog({
  open,
  onOpenChange,
  projects,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  projects: ProjectRow[];
  onCreated: () => void;
}) {
  const [form, setForm] = useState({
    nome: "",
    project_id: "",
    meta: "",
    data_inicio: "",
    data_fim: "",
    status: "Planejada" as string,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setForm({
        nome: "",
        project_id: projects[0]?.id ?? "",
        meta: "",
        data_inicio: "",
        data_fim: "",
        status: "Planejada",
      });
    }
  }, [open, projects]);

  const submit = async () => {
    if (!form.nome.trim()) return toast.error("Informe o nome da sprint.");
    if (!form.project_id) return toast.error("Selecione um projeto.");
    setSaving(true);
    try {
      await createSprint({
        project_id: form.project_id,
        nome: form.nome,
        meta: form.meta,
        data_inicio: form.data_inicio || null,
        data_fim: form.data_fim || null,
        status: form.status,
      });
      toast.success("Sprint criada.");
      onCreated();
      onOpenChange(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao criar sprint.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nova sprint</DialogTitle>
          <DialogDescription>
            Defina o ciclo e a meta. Depois associe work items pela tela de detalhes.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="sp-name">Nome</Label>
            <Input
              id="sp-name"
              value={form.nome}
              onChange={(e) => setForm({ ...form, nome: e.target.value })}
              placeholder="Ex.: Sprint 12 — Onboarding"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Projeto</Label>
              <Select
                value={form.project_id}
                onValueChange={(v) => setForm({ ...form, project_id: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione…" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SPRINT_STATUS.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="sp-start">Início</Label>
              <Input
                id="sp-start"
                type="date"
                value={form.data_inicio}
                onChange={(e) => setForm({ ...form, data_inicio: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sp-end">Fim</Label>
              <Input
                id="sp-end"
                type="date"
                value={form.data_fim}
                onChange={(e) => setForm({ ...form, data_fim: e.target.value })}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="sp-goal">Meta</Label>
            <Textarea
              id="sp-goal"
              rows={3}
              value={form.meta}
              onChange={(e) => setForm({ ...form, meta: e.target.value })}
              placeholder="Objetivo principal desta sprint…"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button variant="cta" onClick={submit} disabled={saving}>
            {saving ? "Salvando…" : "Criar sprint"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function SprintDetails({
  sprintId,
  projectsById,
  onChange,
  onDeleted,
}: {
  sprintId: string;
  projectsById: Map<string, ProjectRow>;
  onChange: () => void;
  onDeleted: () => void;
}) {
  const [sprint, setSprint] = useState<SprintRow | null>(null);
  const [items, setItems] = useState<SprintItemRow[]>([]);
  const [available, setAvailable] = useState<SprintItemRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openItemId, setOpenItemId] = useState<string | null>(null);
  const [addingId, setAddingId] = useState<string>("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: e } = await import("@/lib/supabase").then(({ supabase }) =>
        supabase
          .from("sprints")
          .select("id, project_id, tenant_id, nome, meta, data_inicio, data_fim, status, created_at, updated_at")
          .eq("id", sprintId)
          .maybeSingle(),
      );
      if (e) throw e;
      const s = data as SprintRow | null;
      setSprint(s);
      if (s) {
        const [linked, unassigned] = await Promise.all([
          listItemsBySprint(sprintId),
          listUnassignedItems(s.project_id),
        ]);
        setItems(linked);
        setAvailable(unassigned);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar sprint");
    } finally {
      setLoading(false);
    }
  }, [sprintId]);

  useEffect(() => {
    void load();
  }, [load]);

  const patch = async (p: Partial<SprintRow>) => {
    if (!sprint) return;
    setSprint({ ...sprint, ...p });
    try {
      await updateSprint(sprint.id, p);
      onChange();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao salvar sprint.");
      void load();
    }
  };

  const addItem = async () => {
    if (!addingId) return;
    try {
      await setItemSprint(addingId, sprintId);
      setAddingId("");
      await load();
      onChange();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao associar item.");
    }
  };

  const removeItem = async (id: string) => {
    try {
      await setItemSprint(id, null);
      await load();
      onChange();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao remover item.");
    }
  };

  const doDelete = async () => {
    if (!sprint) return;
    if (!confirm(`Excluir sprint “${sprint.nome}”?`)) return;
    try {
      await deleteSprint(sprint.id);
      toast.success("Sprint excluída.");
      onDeleted();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao excluir sprint.");
    }
  };

  if (loading) return <LoadingState label="Carregando sprint…" variant="skeleton" rows={4} />;
  if (error) return <ErrorState description={error} onRetry={() => void load()} />;
  if (!sprint) return <EmptyState title="Sprint não encontrada" description="" />;

  const done = items.filter((i) => isDoneStatus(i.status)).length;
  const pct = items.length > 0 ? (done / items.length) * 100 : 0;
  const projectName = projectsById.get(sprint.project_id)?.nome ?? "Projeto";

  return (
    <div className="space-y-5 pb-8">
      <header className="space-y-2 border-b border-border pb-4">
        <p className="text-xs text-muted-foreground">{projectName}</p>
        <Input
          value={sprint.nome}
          onChange={(e) => setSprint({ ...sprint, nome: e.target.value })}
          onBlur={(e) => void patch({ nome: e.target.value })}
          className="text-lg font-medium"
        />
        <div className="flex flex-wrap gap-2">
          <Select value={sprint.status} onValueChange={(v) => void patch({ status: v })}>
            <SelectTrigger className="h-8 w-40 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SPRINT_STATUS.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            type="date"
            value={sprint.data_inicio ?? ""}
            onChange={(e) => setSprint({ ...sprint, data_inicio: e.target.value })}
            onBlur={(e) => void patch({ data_inicio: e.target.value || null })}
            className="h-8 w-40 text-xs"
          />
          <Input
            type="date"
            value={sprint.data_fim ?? ""}
            onChange={(e) => setSprint({ ...sprint, data_fim: e.target.value })}
            onBlur={(e) => void patch({ data_fim: e.target.value || null })}
            className="h-8 w-40 text-xs"
          />
        </div>
      </header>

      <section className="space-y-2">
        <Label>Meta</Label>
        <Textarea
          rows={3}
          value={sprint.meta ?? ""}
          onChange={(e) => setSprint({ ...sprint, meta: e.target.value })}
          onBlur={(e) => void patch({ meta: e.target.value || null })}
        />
      </section>

      <section className="space-y-2 rounded-xl border border-border bg-panel/60 p-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Progresso</span>
          <span className="font-medium">
            {done}/{items.length} concluídos
          </span>
        </div>
        <Progress value={pct} />
      </section>

      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium">Itens da sprint</h4>
          <span className="text-xs text-muted-foreground">{items.length}</span>
        </div>
        {items.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
            Nenhum work item associado. Use o seletor abaixo para adicionar.
          </p>
        ) : (
          <ul className="divide-y divide-border rounded-xl border border-border">
            {items.map((it) => (
              <li key={it.id} className="flex items-center gap-2 px-3 py-2 text-sm">
                <span className="font-mono text-[11px] text-muted-foreground">
                  {it.item_key ?? it.id.slice(0, 6)}
                </span>
                <button
                  type="button"
                  className="min-w-0 flex-1 truncate text-left hover:underline"
                  onClick={() => setOpenItemId(it.id)}
                >
                  {it.titulo}
                </button>
                <Badge variant="outline" className="text-[10px] uppercase">
                  {it.status}
                </Badge>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => void removeItem(it.id)}
                  title="Remover da sprint"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-2">
        <Label>Adicionar work item do projeto</Label>
        <div className="flex gap-2">
          <Select value={addingId} onValueChange={setAddingId}>
            <SelectTrigger className="flex-1">
              <SelectValue
                placeholder={
                  available.length === 0
                    ? "Nenhum item livre neste projeto"
                    : "Selecione um work item…"
                }
              />
            </SelectTrigger>
            <SelectContent>
              {available.map((it) => (
                <SelectItem key={it.id} value={it.id}>
                  {(it.item_key ?? it.id.slice(0, 6)) + " — " + it.titulo}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="cta" onClick={() => void addItem()} disabled={!addingId}>
            <Plus className="mr-1 h-4 w-4" /> Adicionar
          </Button>
        </div>
      </section>

      <div className="flex justify-end border-t border-border pt-4">
        <Button variant="ghost" className="text-destructive" onClick={() => void doDelete()}>
          <Trash2 className="mr-1 h-4 w-4" /> Excluir sprint
        </Button>
      </div>

      <Sheet open={openItemId !== null} onOpenChange={(o) => !o && setOpenItemId(null)}>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-xl lg:max-w-3xl">
          <SheetHeader className="sr-only">
            <SheetTitle>Work Item</SheetTitle>
            <SheetDescription>Detalhes do work item</SheetDescription>
          </SheetHeader>
          {openItemId && (
            <WorkItemDetailsPanel workItemId={openItemId} onChange={() => void load()} />
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
