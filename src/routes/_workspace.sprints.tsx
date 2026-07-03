import { createFileRoute } from "@tanstack/react-router";
import { EmptyState } from "@/components/states";
import { CalendarRange } from "lucide-react";

export const Route = createFileRoute("/_workspace/sprints")({
  component: SprintsIndex,
});

function SprintsIndex() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl">Sprints</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Visão consolidada de sprints ativas no workspace Altech Project.
        </p>
      </div>
      <EmptyState
        icon={<CalendarRange className="h-5 w-5" />}
        title="Sprints por projeto"
        description="Acesse a aba Sprints dentro de cada projeto para ver planejamento, board e capacidade."
      />
    </div>
  );
}
