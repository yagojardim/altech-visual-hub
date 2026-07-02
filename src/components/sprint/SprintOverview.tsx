import { Activity, ListChecks, Target } from "lucide-react";
import { WidgetCard } from "@/components/dashboard/WidgetCard";
import { WidgetGrid } from "@/components/dashboard/WidgetGrid";
import { WidgetHeader } from "@/components/dashboard/WidgetHeader";
import { Badge } from "@/components/ui/badge";
import { getProjectById } from "@/lib/mock-projects";

/**
 * Visual summary of the current sprint. Reuses WidgetCard/Grid/Header.
 * All values are placeholders.
 */
export function SprintOverview({ projectId }: { projectId?: string } = {}) {
  const project = getProjectById(projectId);
  return (
    <div className="space-y-6">
      <WidgetGrid columns={3}>
        <WidgetCard>
          <WidgetHeader
            title="Progresso"
            description="Itens concluídos"
            icon={Activity}
            action={<span className="text-sm font-medium text-foreground">5 / 12</span>}
          />
          <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-panel-elevated">
            <div className="h-full w-[42%] rounded-full bg-primary" />
          </div>
        </WidgetCard>
        <WidgetCard>
          <WidgetHeader
            title="Objetivo da Sprint"
            description="Meta principal"
            icon={Target}
          />
          <p className="mt-3 text-sm text-muted-foreground">
            {project.sprint.objective} — foco atual da {project.sprint.name} do projeto {project.name}.
          </p>
        </WidgetCard>
        <WidgetCard>
          <WidgetHeader
            title="Distribuição"
            description="Itens por status"
            icon={ListChecks}
          />
          <div className="mt-3 space-y-1.5 text-xs text-muted-foreground">
            <div className="flex items-center justify-between">
              <span>A Fazer</span>
              <Badge variant="secondary">4</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Em Desenvolvimento</span>
              <Badge variant="secondary">3</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Em Validação</span>
              <Badge variant="secondary">2</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Concluído</span>
              <Badge variant="secondary">3</Badge>
            </div>
          </div>
        </WidgetCard>
      </WidgetGrid>
    </div>
  );
}
