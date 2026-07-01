import {
  FormField,
  Input,
  Textarea,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  MultiSelectPlaceholder,
  UserSelectorPlaceholder,
} from "@/components/forms";
import { LoadingState } from "@/components/states";
import { cn } from "@/lib/utils";

export interface WorkItemFormProps {
  loading?: boolean;
  showErrors?: boolean;
  className?: string;
}

/** Visual-only form for creating a Work Item. No validation or submission. */
export function WorkItemForm({ loading, showErrors, className }: WorkItemFormProps) {
  if (loading) return <LoadingState label="Carregando formulário…" />;

  return (
    <div className={cn("grid gap-4 sm:grid-cols-2", className)}>
      <FormField label="Tipo do Item" required htmlFor="wi-type">
        <Select disabled>
          <SelectTrigger id="wi-type">
            <SelectValue placeholder="Selecione o tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="story">História</SelectItem>
            <SelectItem value="task">Tarefa</SelectItem>
            <SelectItem value="bug">Bug</SelectItem>
          </SelectContent>
        </Select>
      </FormField>

      <FormField
        label="Título"
        required
        htmlFor="wi-title"
        error={showErrors ? "O título é obrigatório." : undefined}
      >
        <Input id="wi-title" placeholder="Ex.: Configurar pipeline de deploy" disabled />
      </FormField>

      <FormField label="Descrição" htmlFor="wi-description" className="sm:col-span-2">
        <Textarea
          id="wi-description"
          placeholder="Descreva o contexto e o objetivo do item…"
          rows={4}
          disabled
        />
      </FormField>

      <FormField label="Prioridade" htmlFor="wi-priority">
        <Select disabled>
          <SelectTrigger id="wi-priority">
            <SelectValue placeholder="Selecione a prioridade" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="low">Baixa</SelectItem>
            <SelectItem value="medium">Média</SelectItem>
            <SelectItem value="high">Alta</SelectItem>
          </SelectContent>
        </Select>
      </FormField>

      <FormField label="Responsável">
        <UserSelectorPlaceholder placeholder="Atribuir a um usuário" disabled />
      </FormField>

      <FormField label="Sprint" htmlFor="wi-sprint">
        <Select disabled>
          <SelectTrigger id="wi-sprint">
            <SelectValue placeholder="Selecione a sprint" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="s1">Sprint 1</SelectItem>
            <SelectItem value="s2">Sprint 2</SelectItem>
          </SelectContent>
        </Select>
      </FormField>

      <FormField
        label="Story Points"
        htmlFor="wi-points"
        error={showErrors ? "Informe um valor numérico." : undefined}
      >
        <Input id="wi-points" type="number" placeholder="Ex.: 5" disabled />
      </FormField>

      <FormField label="Labels" className="sm:col-span-2">
        <MultiSelectPlaceholder placeholder="Selecione uma ou mais labels…" disabled />
      </FormField>

      <FormField label="Critérios de Aceite" htmlFor="wi-acceptance" className="sm:col-span-2">
        <Textarea
          id="wi-acceptance"
          placeholder="Liste os critérios de aceite…"
          rows={4}
          disabled
        />
      </FormField>
    </div>
  );
}
