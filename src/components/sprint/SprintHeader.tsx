import {
  Timer,
  Calendar,
  Target,
  Gauge,
  Layers,
  ChevronRight,
  Plus,
  Filter,
  Share2,
  RefreshCw,
} from "lucide-react";
import { WidgetCard } from "@/components/dashboard/WidgetCard";
import { WidgetGrid } from "@/components/dashboard/WidgetGrid";
import { WidgetHeader } from "@/components/dashboard/WidgetHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getProjectById } from "@/lib/mock-projects";
import { getSprintStatusColor, getSprintStatusLabel } from "@/lib/sprint-status";

export function SprintHeader({ projectId }: { projectId?: string }) {
  const project = getProjectById(projectId);
  const sprint = project.sprint;
  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-1.5 text-xs uppercase tracking-wider text-muted-foreground"
        >
          <span>Projeto</span>
          <ChevronRight className="h-3 w-3" />
          {projectId && (
            <>
              <code className="rounded bg-panel px-1.5 py-0.5 font-mono text-primary">
                {projectId}
              </code>
              <ChevronRight className="h-3 w-3" />
            </>
          )}
          <span className="text-foreground">Sprints</span>
        </nav>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0 space-y-1">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">{sprint.name}</h1>
              <span className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] ${getSprintStatusColor(sprint.status)}`}>
                {getSprintStatusLabel(sprint.status)}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              Planejamento e acompanhamento da sprint corrente.
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <Button size="sm" disabled>
              <Plus className="mr-1.5 h-4 w-4" /> Nova Sprint
            </Button>
            <Button variant="outline" size="sm" disabled>
              <Filter className="mr-1.5 h-4 w-4" /> Filtrar
            </Button>
            <Button variant="outline" size="sm" disabled>
              <Share2 className="mr-1.5 h-4 w-4" /> Compartilhar
            </Button>
            <Button variant="ghost" size="sm" disabled>
              <RefreshCw className="mr-1.5 h-4 w-4" /> Atualizar
            </Button>
          </div>
        </div>
      </header>

      <WidgetGrid columns={4}>
        <WidgetCard>
          <WidgetHeader
            title="Objetivo"
            description="Meta da sprint"
            icon={Target}
            action={<Badge variant="secondary">{sprint.objective}</Badge>}
          />
        </WidgetCard>
        <WidgetCard>
          <WidgetHeader
            title="Capacidade"
            description="Story points"
            icon={Gauge}
            action={<span className="text-sm font-medium text-foreground">{sprint.capacity}</span>}
          />
        </WidgetCard>
        <WidgetCard>
          <WidgetHeader
            title="Itens"
            description="Total planejado"
            icon={Layers}
            action={<span className="text-sm font-medium text-foreground">{sprint.itemsTotal}</span>}
          />
        </WidgetCard>
        <WidgetCard>
          <WidgetHeader
            title="Datas"
            description="Duração da sprint"
            icon={Calendar}
            action={
              <span className="text-sm font-medium text-foreground">{sprint.dates}</span>
            }
          />

        </WidgetCard>
      </WidgetGrid>
    </div>
  );
}

export function SprintHeaderCompact() {
  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <Timer className="h-4 w-4 text-primary" />
      <span className="font-medium text-foreground">Sprint 3</span>
      <span>· 15/01 – 29/01/2026</span>
    </div>
  );
}
