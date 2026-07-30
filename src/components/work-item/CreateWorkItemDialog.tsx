import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  createWorkItem,
  STATUS_COLUMNS,
  TIPO_OPTIONS,
  type WorkItemRow,
} from "@/lib/work-items-api";
import { qk } from "@/lib/query-keys";

export interface CreateWorkItemDialogProps {
  projectId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultStatus?: string;
  defaultTipo?: string;
  onCreated?: (item: WorkItemRow) => void;
}

const empty = (defaultStatus?: string, defaultTipo?: string) => ({
  title: "",
  type: defaultTipo ?? "task",
  status: defaultStatus ?? "A Fazer",
  description: "",
});

export function CreateWorkItemDialog({
  projectId,
  open,
  onOpenChange,
  defaultStatus,
  defaultTipo,
  onCreated,
}: CreateWorkItemDialogProps) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(empty(defaultStatus, defaultTipo));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) setForm(empty(defaultStatus, defaultTipo));
  }, [open, defaultStatus, defaultTipo]);

  const submit = async () => {
    if (!form.title.trim()) {
      toast.error("Informe o título do work item.");
      return;
    }
    setSaving(true);
    try {
      const created = await createWorkItem({
        project_id: projectId,
        title: form.title,
        type: form.type,
        status: form.status,
        description: form.description.trim() || null,
      });
      await queryClient.invalidateQueries({ queryKey: qk.workItemsByProject(projectId) });
      await queryClient.invalidateQueries({ queryKey: qk.workItems() });
      toast.success("Work item criado.");
      onCreated?.(created);
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao criar work item.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Novo work item</DialogTitle>
          <DialogDescription>
            Registre um novo item — ele é gravado no banco imediatamente.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="wi-title">Título</Label>
            <Input
              id="wi-title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Ex.: Ajustar cabeçalho da sprint"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Tipo</Label>
              <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIPO_OPTIONS.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
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
                  {STATUS_COLUMNS.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="wi-desc">Descrição</Label>
            <Textarea
              id="wi-desc"
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Descreva o objetivo do item…"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button variant="cta" onClick={submit} disabled={saving}>
            {saving ? "Salvando…" : "Criar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
