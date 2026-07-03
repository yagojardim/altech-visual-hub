import { createFileRoute } from "@tanstack/react-router";
import { EmptyState } from "@/components/states";
import { ListTodo } from "lucide-react";

export const Route = createFileRoute("/_workspace/backlog")({
  component: BacklogIndex,
});

function BacklogIndex() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl">Backlog</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Fila de trabalho priorizada no workspace Altech.
        </p>
      </div>
      <EmptyState
        icon={<ListTodo className="h-5 w-5" />}
        title="Nada por aqui ainda"
        description="Abra um projeto e acesse a aba Backlog para criar seu primeiro work item."
      />
    </div>
  );
}
