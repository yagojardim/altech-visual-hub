import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { FormField } from "@/components/forms";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  createProject,
  updateProject,
  type ProjectRow,
} from "@/lib/projects-api";

const STATUSES = ["Planejamento", "Em progresso", "Pausado", "Concluído"];

export interface ProjectFormSheetProps {
  trigger?: React.ReactNode;
  mode?: "create" | "edit";
  project?: ProjectRow | null;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSaved?: (project: ProjectRow) => void;
}

const emptyState = {
  nome: "",
  slug: "",
  cliente: "",
  responsavel: "",
  status: "Planejamento",
  data_inicio: "",
  data_fim: "",
  descricao: "",
};

export function CreateProjectModal({
  trigger,
  mode = "create",
  project,
  open: openProp,
  onOpenChange,
  onSaved,
}: ProjectFormSheetProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = openProp ?? internalOpen;
  const setOpen = (v: boolean) => {
    onOpenChange?.(v);
    if (openProp === undefined) setInternalOpen(v);
  };

  const [form, setForm] = useState(emptyState);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (mode === "edit" && project) {
      setForm({
        nome: project.nome ?? "",
        slug: project.slug ?? "",
        cliente: project.cliente ?? "",
        responsavel: project.responsavel ?? "",
        status: project.status ?? "Planejamento",
        data_inicio: project.data_inicio ?? "",
        data_fim: project.data_fim ?? "",
        descricao: project.descricao ?? "",
      });
    } else if (mode === "create") {
      setForm(emptyState);
    }
  }, [open, mode, project]);

  const set = (k: keyof typeof form) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async () => {
    if (!form.nome.trim()) {
      toast.error("Informe o nome do projeto.");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        nome: form.nome.trim(),
        slug: form.slug.trim() || form.nome.trim(),
        cliente: form.cliente.trim() || null,
        responsavel: form.responsavel.trim() || null,
        status: form.status,
        data_inicio: form.data_inicio || null,
        data_fim: form.data_fim || null,
        descricao: form.descricao.trim() || null,
      };
      const saved =
        mode === "edit" && project
          ? await updateProject(project.id, payload)
          : await createProject(payload);
      toast.success(mode === "edit" ? "Projeto atualizado." : "Projeto criado.");
      onSaved?.(saved);
      setOpen(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao salvar projeto.";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const title = mode === "edit" ? "Editar Projeto" : "Novo Projeto";

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      {trigger !== null && (
        <SheetTrigger asChild>
          {trigger ?? (
            <Button size="sm" variant="cta">
              <Plus className="mr-1.5 h-4 w-4" />
              Novo Projeto
            </Button>
          )}
        </SheetTrigger>
      )}
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 p-0 sm:max-w-xl lg:max-w-2xl"
      >
        <SheetHeader className="border-b border-border px-4 py-3 text-left">
          <SheetTitle>{title}</SheetTitle>
          <SheetDescription>
            {mode === "edit"
              ? "Atualize os dados do projeto. As alterações são salvas no banco."
              : "Preencha os campos abaixo para registrar um novo projeto."}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Nome" required htmlFor="proj-name" className="sm:col-span-2">
              <Input
                id="proj-name"
                placeholder="Ex.: Altech Core"
                value={form.nome}
                onChange={set("nome")}
              />
            </FormField>

            <FormField label="Slug" htmlFor="proj-slug">
              <Input
                id="proj-slug"
                placeholder="altech-core"
                value={form.slug}
                onChange={set("slug")}
                disabled={mode === "edit"}
              />
            </FormField>

            <FormField label="Status" htmlFor="proj-status">
              <Select
                value={form.status}
                onValueChange={(v) => setForm((f) => ({ ...f, status: v }))}
              >
                <SelectTrigger id="proj-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>

            <FormField label="Cliente" htmlFor="proj-client">
              <Input
                id="proj-client"
                placeholder="Ex.: Altech"
                value={form.cliente}
                onChange={set("cliente")}
              />
            </FormField>

            <FormField label="Responsável" htmlFor="proj-owner">
              <Input
                id="proj-owner"
                placeholder="Nome do responsável"
                value={form.responsavel}
                onChange={set("responsavel")}
              />
            </FormField>

            <FormField label="Data Inicial" htmlFor="proj-start">
              <Input
                id="proj-start"
                type="date"
                value={form.data_inicio}
                onChange={set("data_inicio")}
              />
            </FormField>

            <FormField label="Data Final" htmlFor="proj-end">
              <Input
                id="proj-end"
                type="date"
                value={form.data_fim}
                onChange={set("data_fim")}
              />
            </FormField>

            <FormField label="Descrição" htmlFor="proj-desc" className="sm:col-span-2">
              <Textarea
                id="proj-desc"
                placeholder="Descreva o objetivo do projeto…"
                rows={4}
                value={form.descricao}
                onChange={set("descricao")}
              />
            </FormField>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-border px-4 py-3">
          <Button variant="outline" size="sm" onClick={() => setOpen(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button size="sm" variant="cta" onClick={handleSubmit} disabled={saving}>
            {saving ? "Salvando..." : mode === "edit" ? "Salvar alterações" : "Criar Projeto"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
