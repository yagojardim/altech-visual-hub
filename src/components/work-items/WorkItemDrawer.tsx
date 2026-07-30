import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Calendar, FolderKanban, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { formatSupabaseError, logSupabaseError } from "@/lib/supabase-errors";
import {
  STATUS_COLUMNS,
  typeLabel,
  priorityLabel,
  TIPO_OPTIONS,
  PRIORIDADE_OPTIONS,
  type WorkItemRow,
} from "@/lib/work-items-api";
import { listProjects, type ProjectRow } from "@/lib/projects-api";
import { listTeamMembers } from "@/lib/team-members-api";
import { qk } from "@/lib/query-keys";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { LoadingState, ErrorState } from "@/components/states";

const SELECT =
  "id, board_id, column_id, project_id, title, description, type, priority, assignee_id, status, position, created_at";

async function getWorkItem(id: string): Promise<WorkItemRow | null> {
  const { data, error } = await supabase
    .from("work_items")
    .select(SELECT)
    .eq("id", id)
    .maybeSingle();
  if (error) { logSupabaseError("work_items:get", error); throw error; }
  return (data as WorkItemRow | null) ?? null;
}

function fmtDateTime(s?: string | null): string {
  if (!s) return "—";
  try {
    return new Date(s).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
  } catch { return s; }
}

interface FormState {
  title: string;
  type: string;
  priority: string;
  status: string;
  assignee_id: string;
  description: string;
  project_id: string;
}

const NO_ASSIGNEE = "__none__";

function emptyForm(defaultProjectId: string): FormState {
  return {
    title: "",
    type: "story",
    priority: "media",
    status: STATUS_COLUMNS[0],
    assignee_id: NO_ASSIGNEE,
    description: "",
    project_id: defaultProjectId,
  };
}

function fromRow(row: WorkItemRow): FormState {
  return {
    title: row.title ?? "",
    type: row.type ?? "story",
    priority: row.priority ?? "media",
    status: row.status ?? STATUS_COLUMNS[0],
    assignee_id: row.assignee_id ?? NO_ASSIGNEE,
    description: row.description ?? "",
    project_id: row.project_id,
  };
}

export interface WorkItemDrawerProps {
  itemId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** When true and itemId is null, drawer opens in create mode. */
  createMode?: boolean;
  /** Preselected project for create mode. */
  defaultProjectId?: string | null;
  /** Called after any successful save/create/delete so parent can refetch. */
  onChanged?: () => void;
}

export function WorkItemDrawer({
  itemId,
  open,
  onOpenChange,
  createMode = false,
  defaultProjectId = null,
  onChanged,
}: WorkItemDrawerProps) {
  const isCreate = createMode && !itemId;
  const queryClient = useQueryClient();

  const itemQ = useQuery({
    queryKey: itemId ? qk.workItem(itemId) : ["work_items", "detail", "__none__"],
    queryFn: () => getWorkItem(itemId as string),
    enabled: !!itemId && open,
  });
  const projectsQ = useQuery({
    queryKey: qk.projects(),
    queryFn: listProjects,
    enabled: open,
  });
  const membersQ = useQuery({
    queryKey: ["team_members"],
    queryFn: listTeamMembers,
    enabled: open,
  });

  const [form, setForm] = useState<FormState>(() => emptyForm(defaultProjectId ?? ""));
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Sync form when the drawer opens or the loaded row changes.
  useEffect(() => {
    if (!open) return;
    if (isCreate) {
      const projects = projectsQ.data ?? [];
      const fallbackId = defaultProjectId ?? projects[0]?.id ?? "";
      setForm(emptyForm(fallbackId));
    } else if (itemQ.data) {
      setForm(fromRow(itemQ.data));
    }
  }, [open, isCreate, itemQ.data, projectsQ.data, defaultProjectId]);

  const item = itemQ.data ?? null;
  const project: ProjectRow | undefined = item
    ? (projectsQ.data ?? []).find((p) => p.id === item.project_id)
    : (projectsQ.data ?? []).find((p) => p.id === form.project_id);

  const patch = (p: Partial<FormState>) => setForm((s) => ({ ...s, ...p }));

  async function handleSave() {
    const title = form.title.trim();
    if (!title) { toast.error("Informe um título."); return; }
    if (isCreate && !form.project_id) { toast.error("Selecione um projeto."); return; }
    setSaving(true);
    try {
      if (isCreate) {
        const { data: last } = await supabase
          .from("work_items")
          .select("position")
          .eq("project_id", form.project_id)
          .order("position", { ascending: false })
          .limit(1);
        const nextPosition = ((last?.[0]?.position as number | undefined) ?? 0) + 1;
        const { error } = await supabase.from("work_items").insert({
          project_id: form.project_id,
          title,
          type: form.type,
          priority: form.priority,
          status: form.status,
          assignee_id: form.assignee_id === NO_ASSIGNEE ? null : form.assignee_id,
          description: form.description.trim() || null,
          position: nextPosition,
        });
        if (error) throw error;
        toast.success("Work item criado.");
      } else if (itemId) {
        const { error } = await supabase.from("work_items").update({
          title,
          type: form.type,
          priority: form.priority,
          status: form.status,
          assignee_id: form.assignee_id === NO_ASSIGNEE ? null : form.assignee_id,
          description: form.description.trim() || null,
        }).eq("id", itemId);
        if (error) throw error;
        toast.success("Work item atualizado.");
      }
      await queryClient.invalidateQueries({ queryKey: qk.workItems() });
      if (itemId) {
        await queryClient.invalidateQueries({ queryKey: qk.workItem(itemId) });
      }
      onChanged?.();
      onOpenChange(false);
    } catch (err) {
      logSupabaseError("work_items:save", err);
      toast.error(formatSupabaseError(err, "Não foi possível salvar."));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!itemId) return;
    setDeleting(true);
    try {
      const { error } = await supabase.from("work_items").delete().eq("id", itemId);
      if (error) throw error;
      toast.success("Work item excluído.");
      await queryClient.invalidateQueries({ queryKey: qk.workItems() });
      onChanged?.();
      setConfirmDelete(false);
      onOpenChange(false);
    } catch (err) {
      logSupabaseError("work_items:delete", err);
      toast.error(formatSupabaseError(err, "Não foi possível excluir."));
    } finally {
      setDeleting(false);
    }
  }

  const loading = !isCreate && itemQ.isLoading;
  const notFound = !isCreate && !itemQ.isLoading && !itemQ.error && !item;

  return (
    <Sheet open={open} onOpenChange={(o) => { if (!saving && !deleting) onOpenChange(o); }}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        {loading ? (
          <div className="space-y-4 pt-6">
            <LoadingState variant="skeleton" rows={4} />
          </div>
        ) : itemQ.error && !isCreate ? (
          <div className="pt-6">
            <ErrorState
              title="Não foi possível carregar o work item"
              description={formatSupabaseError(itemQ.error, "Erro ao carregar o item.")}
              onRetry={() => void itemQ.refetch()}
            />
          </div>
        ) : notFound ? (
          <div className="pt-6">
            <SheetHeader>
              <SheetTitle>Item não encontrado</SheetTitle>
              <SheetDescription>O work item pode ter sido removido.</SheetDescription>
            </SheetHeader>
          </div>
        ) : (
          <div className="space-y-6">
            <SheetHeader className="space-y-2 text-left">
              <SheetTitle className="text-lg font-semibold leading-tight">
                {isCreate ? "Novo work item" : "Editar work item"}
              </SheetTitle>
              <SheetDescription className="text-xs uppercase tracking-wider text-muted-foreground">
                Altech Project · Work Item
              </SheetDescription>
              {!isCreate && item ? (
                <div className="flex flex-wrap gap-2 pt-1">
                  <Badge variant="outline" className="text-[10px] uppercase">{typeLabel(form.type)}</Badge>
                  <Badge variant="outline" className="text-[10px] uppercase">{priorityLabel(form.priority)}</Badge>
                  <Badge variant="outline" className="text-[10px] uppercase">{form.status}</Badge>
                </div>
              ) : null}
            </SheetHeader>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="wi-titulo">Título</Label>
                <Input
                  id="wi-titulo"
                  value={form.title}
                  onChange={(e) => patch({ title: e.target.value })}
                  maxLength={200}
                  placeholder="Título do work item"
                  disabled={saving}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Tipo</Label>
                  <Select value={form.type} onValueChange={(v) => patch({ type: v })} disabled={saving}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {TIPO_OPTIONS.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Prioridade</Label>
                  <Select value={form.priority} onValueChange={(v) => patch({ priority: v })} disabled={saving}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {PRIORIDADE_OPTIONS.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Status</Label>
                  <Select value={form.status} onValueChange={(v) => patch({ status: v })} disabled={saving}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {STATUS_COLUMNS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Responsável</Label>
                  <Select value={form.assignee_id} onValueChange={(v) => patch({ assignee_id: v })} disabled={saving}>
                    <SelectTrigger><SelectValue placeholder="Sem responsável" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NO_ASSIGNEE}>Sem responsável</SelectItem>
                      {(membersQ.data ?? []).map((m) => (
                        <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {isCreate ? (
                <div className="space-y-1.5">
                  <Label>Projeto</Label>
                  <Select value={form.project_id} onValueChange={(v) => patch({ project_id: v })} disabled={saving}>
                    <SelectTrigger><SelectValue placeholder="Selecione um projeto" /></SelectTrigger>
                    <SelectContent>
                      {(projectsQ.data ?? []).map((p) => (
                        <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <div className="flex items-center justify-between rounded-md border border-border/60 bg-panel/40 px-3 py-2 text-sm">
                  <span className="inline-flex items-center gap-1.5 text-xs uppercase tracking-wider text-muted-foreground">
                    <FolderKanban className="h-3.5 w-3.5" /> Projeto
                  </span>
                  <span className="text-foreground">{project?.nome ?? "—"}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="wi-desc">Descrição</Label>
                <Textarea
                  id="wi-desc"
                  value={form.description}
                  onChange={(e) => patch({ description: e.target.value })}
                  maxLength={5000}
                  rows={5}
                  placeholder="Descreva o trabalho a ser feito..."
                  disabled={saving}
                />
              </div>

              {!isCreate && item ? (
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5" /> Criado em
                  </span>
                  <span>{fmtDateTime(item.created_at)}</span>
                </div>
              ) : null}
            </div>

            <SheetFooter className="flex-row justify-between gap-2 sm:justify-between">
              {!isCreate && itemId ? (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setConfirmDelete(true)}
                  disabled={saving || deleting}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="mr-1 h-4 w-4" /> Excluir
                </Button>
              ) : <span />}
              <div className="flex items-center gap-2">
                <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={saving || deleting}>
                  Cancelar
                </Button>
                <Button type="button" onClick={() => void handleSave()} disabled={saving || deleting}>
                  {saving ? "Salvando..." : isCreate ? "Criar" : "Salvar"}
                </Button>
              </div>
            </SheetFooter>
          </div>
        )}
      </SheetContent>

      <AlertDialog open={confirmDelete} onOpenChange={(o) => { if (!deleting) setConfirmDelete(o); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir work item?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O item será removido do Altech Project.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); void handleDelete(); }}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Sheet>
  );
}
