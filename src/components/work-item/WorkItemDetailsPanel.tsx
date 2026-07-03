import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { LoadingState, ErrorState, EmptyState } from "@/components/states";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { WorkItemAttachmentsLive } from "./WorkItemAttachmentsLive";
import { WorkItemCommentsLive } from "./WorkItemCommentsLive";
import {
  getWorkItem,
  updateWorkItem,
  deleteWorkItem,
  STATUS_COLUMNS,
  TIPO_OPTIONS,
  PRIORIDADE_OPTIONS,
} from "@/lib/work-items-api";
import { qk } from "@/lib/query-keys";
import {
  toWorkItem,
  toWorkItemPatch,
  type WorkItem,
  type WorkItemPatch,
} from "@/lib/work-item-map";

export function WorkItemDetailsPanel({
  workItemId,
  onChange,
}: {
  workItemId: string;
  onChange?: () => void;
}) {
  const queryClient = useQueryClient();
  const detailKey = qk.workItem(workItemId);

  const {
    data: row,
    isLoading: loading,
    error: queryError,
    refetch,
  } = useQuery({
    queryKey: detailKey,
    queryFn: () => getWorkItem(workItemId),
  });
  const error = queryError instanceof Error ? queryError.message : queryError ? String(queryError) : null;

  const [item, setItem] = useState<WorkItem | null>(null);

  useEffect(() => {
    setItem(row ? toWorkItem(row) : null);
  }, [row]);

  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: qk.workItems() });
    await queryClient.invalidateQueries({ queryKey: detailKey });
  };

  const patch = async (delta: WorkItemPatch) => {
    if (!item) return;
    const prev = item;
    const next: WorkItem = { ...item, ...delta };
    setItem(next);
    try {
      const saved = await updateWorkItem(item.id, toWorkItemPatch(delta));
      setItem(toWorkItem(saved));
      await invalidate();
      onChange?.();
    } catch (err) {
      setItem(prev);
      toast.error(err instanceof Error ? err.message : "Erro ao salvar");
    }
  };

  const handleDelete = async () => {
    if (!item) return;
    if (!confirm(`Excluir “${item.title}”?`)) return;
    try {
      await deleteWorkItem(item.id);
      await invalidate();
      toast.success("Work item excluído.");
      onChange?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao excluir");
    }
  };

  if (loading) return <LoadingState label="Carregando work item…" />;
  if (error) return <ErrorState description={error} onRetry={() => void refetch()} />;
  if (!item) return <EmptyState title="Nada por aqui ainda" description="Work item não encontrado." />;

  return (
    <div className="grid gap-6 pt-4 lg:grid-cols-[1fr_260px]">
      <div className="space-y-6">
        <header className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="rounded bg-muted px-2 py-0.5 text-xs font-mono text-muted-foreground">
              {item.itemKey ?? item.id.slice(0, 6)}
            </span>
            <Badge variant="outline">{item.type}</Badge>
          </div>
          <Input
            className="text-lg font-semibold"
            value={item.title}
            onChange={(e) => setItem({ ...item, title: e.target.value })}
            onBlur={(e) => {
              const v = e.target.value.trim();
              if (v && v !== item.title) void patch({ title: v });
            }}
          />
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Tipo</span>
              <Select value={item.type} onValueChange={(v) => void patch({ type: v })}>
                <SelectTrigger className="h-8 w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIPO_OPTIONS.map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Status</span>
              <Select value={item.status} onValueChange={(v) => void patch({ status: v })}>
                <SelectTrigger className="h-8 w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_COLUMNS.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Prioridade</span>
              <Select
                value={item.priority}
                onValueChange={(v) => void patch({ priority: v })}
              >
                <SelectTrigger className="h-8 w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIORIDADE_OPTIONS.map((p) => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </header>

        <section className="space-y-2">
          <h3 className="text-sm font-medium">Descrição</h3>
          <Textarea
            rows={5}
            value={item.description ?? ""}
            onChange={(e) => setItem({ ...item, description: e.target.value })}
            onBlur={(e) => void patch({ description: e.target.value || null })}
            placeholder="Descreva o work item…"
          />
        </section>

        <WorkItemCommentsLive workItemId={item.id} />
        <WorkItemAttachmentsLive workItemId={item.id} />
      </div>

      <aside className="space-y-3 rounded-xl border border-border bg-panel/40 p-4 text-sm">
        <h3 className="text-sm font-medium">Metadados</h3>
        <div className="space-y-1.5">
          <label className="text-xs text-muted-foreground">Responsável</label>
          <Input
            className="h-8"
            placeholder="Nome do responsável"
            value={item.assignee ?? ""}
            onChange={(e) => setItem({ ...item, assignee: e.target.value })}
            onBlur={(e) => void patch({ assignee: e.target.value.trim() || null })}
          />
        </div>
        <MetaRow label="Ordem" value={String(item.order)} />
        <MetaRow
          label="Criado em"
          value={item.createdAt ? new Date(item.createdAt).toLocaleString() : "—"}
        />
        <MetaRow
          label="Atualizado"
          value={item.updatedAt ? new Date(item.updatedAt).toLocaleString() : "—"}
        />
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

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-2 border-b border-border/50 py-1 last:border-0">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="truncate text-xs text-foreground">{value}</span>
    </div>
  );
}
