import { useCallback, useEffect, useState } from "react";
import { LoadingState, ErrorState } from "@/components/states";
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
  type WorkItemRow,
} from "@/lib/work-items-api";

export function WorkItemDetailsPanel({
  workItemId,
  onChange,
}: {
  workItemId: string;
  onChange?: () => void;
}) {
  const [item, setItem] = useState<WorkItemRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const row = await getWorkItem(workItemId);
      if (!row) throw new Error("Work item não encontrado");
      setItem(row);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao carregar");
    } finally {
      setLoading(false);
    }
  }, [workItemId]);

  useEffect(() => {
    void load();
  }, [load]);

  const patch = async (delta: Partial<WorkItemRow>) => {
    if (!item) return;
    const prev = item;
    const next = { ...item, ...delta };
    setItem(next);
    try {
      const saved = await updateWorkItem(item.id, delta);
      setItem(saved);
      onChange?.();
    } catch (err) {
      setItem(prev);
      toast.error(err instanceof Error ? err.message : "Erro ao salvar");
    }
  };

  const handleDelete = async () => {
    if (!item) return;
    if (!confirm(`Excluir “${item.titulo}”?`)) return;
    try {
      await deleteWorkItem(item.id);
      toast.success("Work item excluído.");
      onChange?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao excluir");
    }
  };

  if (loading) return <LoadingState label="Carregando work item…" />;
  if (error) return <ErrorState description={error} onRetry={() => void load()} />;
  if (!item) return <ErrorState description="Work item não encontrado" />;

  return (
    <div className="grid gap-6 pt-4 lg:grid-cols-[1fr_260px]">
      <div className="space-y-6">
        <header className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="rounded bg-muted px-2 py-0.5 text-xs font-mono text-muted-foreground">
              {item.item_key ?? item.id.slice(0, 6)}
            </span>
            <Badge variant="outline">{item.tipo}</Badge>
          </div>
          <Input
            className="text-lg font-semibold"
            value={item.titulo}
            onChange={(e) => setItem({ ...item, titulo: e.target.value })}
            onBlur={(e) => {
              const v = e.target.value.trim();
              if (v && v !== item.titulo) void patch({ titulo: v });
            }}
          />
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Tipo</span>
              <Select value={item.tipo} onValueChange={(v) => void patch({ tipo: v })}>
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
                value={item.prioridade}
                onValueChange={(v) => void patch({ prioridade: v })}
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
            value={item.descricao ?? ""}
            onChange={(e) => setItem({ ...item, descricao: e.target.value })}
            onBlur={(e) => void patch({ descricao: e.target.value || null })}
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
            value={item.responsavel ?? ""}
            onChange={(e) => setItem({ ...item, responsavel: e.target.value })}
            onBlur={(e) => void patch({ responsavel: e.target.value.trim() || null })}
          />
        </div>
        <MetaRow label="Ordem" value={String(item.ordem)} />
        <MetaRow
          label="Criado em"
          value={item.created_at ? new Date(item.created_at).toLocaleString() : "—"}
        />
        <MetaRow
          label="Atualizado"
          value={item.updated_at ? new Date(item.updated_at).toLocaleString() : "—"}
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
