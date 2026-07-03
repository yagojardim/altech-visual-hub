import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  FormField,
  Input,
  Textarea,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  UserSelectorPlaceholder,
  DatePickerFieldPlaceholder,
} from "@/components/forms";

export interface CreateProjectModalProps {
  trigger?: React.ReactNode;
}

/**
 * Visual-only Create Project flow. Opens a side sheet with the Form Foundation
 * fields. Submitting navigates to a placeholder workspace to complete the
 * demo journey. No persistence.
 */
export function CreateProjectModal({ trigger }: CreateProjectModalProps) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const handleCreate = () => {
    setOpen(false);
    navigate({ to: "/projects/$projectId", params: { projectId: "novo-projeto" } });
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {trigger ?? (
          <Button size="sm">
            <Plus className="mr-1.5 h-4 w-4" />
            Novo Projeto
          </Button>
        )}
      </SheetTrigger>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 p-0 sm:max-w-xl lg:max-w-2xl"
      >
        <SheetHeader className="border-b border-border px-4 py-3 text-left">
          <SheetTitle>Novo Projeto</SheetTitle>
          <SheetDescription>
            Preencha os campos abaixo para registrar um novo projeto.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Nome" required htmlFor="proj-name" className="sm:col-span-2">
              <Input id="proj-name" placeholder="Ex.: Altech Project" disabled />
            </FormField>

            <FormField label="Cliente" htmlFor="proj-client">
              <Input id="proj-client" placeholder="Ex.: Altech" disabled />
            </FormField>

            <FormField label="Organização" htmlFor="proj-org">
              <Select disabled>
                <SelectTrigger id="proj-org">
                  <SelectValue placeholder="Selecione a organização" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="altech">Altech HQ</SelectItem>
                  <SelectItem value="labs">Altech Labs</SelectItem>
                </SelectContent>
              </Select>
            </FormField>

            <FormField label="Responsável">
              <UserSelectorPlaceholder placeholder="Atribuir a um responsável" disabled />
            </FormField>

            <FormField label="Metodologia" htmlFor="proj-method">
              <Select disabled>
                <SelectTrigger id="proj-method">
                  <SelectValue placeholder="Selecione a metodologia" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="scrum">Scrum</SelectItem>
                  <SelectItem value="kanban">Kanban</SelectItem>
                  <SelectItem value="waterfall">Waterfall</SelectItem>
                </SelectContent>
              </Select>
            </FormField>

            <FormField label="Data Inicial">
              <DatePickerFieldPlaceholder placeholder="Selecione a data inicial" disabled />
            </FormField>

            <FormField label="Data Final">
              <DatePickerFieldPlaceholder placeholder="Selecione a data final" disabled />
            </FormField>

            <FormField label="Descrição" htmlFor="proj-desc" className="sm:col-span-2">
              <Textarea
                id="proj-desc"
                placeholder="Descreva o objetivo do projeto…"
                rows={4}
                disabled
              />
            </FormField>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-border px-4 py-3">
          <Button variant="outline" size="sm" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button size="sm" onClick={handleCreate}>
            Criar Projeto
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
