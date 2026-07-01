import { Gauge, ListPlus, Layers } from "lucide-react";
import { WidgetCard } from "@/components/dashboard/WidgetCard";
import { WidgetHeader } from "@/components/dashboard/WidgetHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { WorkItemCard } from "@/components/work-item/WorkItemCard";

const BACKLOG_CANDIDATES = [
  { itemId: "WI-101", title: "Refinar história de onboarding", type: "História" },
  { itemId: "WI-102", title: "Ajustar filtros do backlog", type: "Task" },
  { itemId: "WI-103", title: "Corrigir contraste em cards", type: "Bug" },
  { itemId: "WI-104", title: "Documentar Design System", type: "Task" },
];

const PLANNED_ITEMS = [
  { itemId: "WI-091", title: "Consolidar navegação do Projeto", type: "História" },
  { itemId: "WI-092", title: "Padronizar Context Header", type: "Task" },
  { itemId: "WI-093", title: "Criar visão da Sprint", type: "História" },
];

/**
 * Visual-only sprint planning panel. Lets the user "see" candidate items from
 * the backlog alongside the already planned ones and a capacity summary.
 * No state or persistence.
 */
export function SprintPlanningPanel() {
  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_1fr_18rem]">
      <WidgetCard className="flex flex-col gap-3">
        <WidgetHeader
          title="Backlog"
          description="Itens disponíveis para planejar"
          icon={Layers}
          action={<Badge variant="secondary">{BACKLOG_CANDIDATES.length}</Badge>}
        />
        <div className="flex flex-col gap-2">
          {BACKLOG_CANDIDATES.map((item) => (
            <WorkItemCard
              key={item.itemId}
              itemId={item.itemId}
              title={item.title}
              type={item.type}
              status="Backlog"
            />
          ))}
        </div>
      </WidgetCard>

      <WidgetCard className="flex flex-col gap-3">
        <WidgetHeader
          title="Sprint 3"
          description="Itens planejados"
          icon={ListPlus}
          action={<Badge>{PLANNED_ITEMS.length}</Badge>}
        />
        <div className="flex flex-col gap-2">
          {PLANNED_ITEMS.map((item) => (
            <WorkItemCard
              key={item.itemId}
              itemId={item.itemId}
              title={item.title}
              type={item.type}
              status="Planejado"
            />
          ))}
        </div>
      </WidgetCard>

      <WidgetCard className="flex h-fit flex-col gap-4">
        <WidgetHeader
          title="Capacidade"
          description="Story points da sprint"
          icon={Gauge}
        />
        <div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-semibold text-foreground">32</span>
            <span className="text-xs text-muted-foreground">de 40 pts</span>
          </div>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-panel-elevated">
            <div className="h-full w-[80%] rounded-full bg-primary" />
          </div>
        </div>
        <dl className="space-y-1.5 text-xs text-muted-foreground">
          <div className="flex items-center justify-between">
            <span>Histórias</span>
            <span className="tabular-nums text-foreground">2</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Tasks</span>
            <span className="tabular-nums text-foreground">1</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Bugs</span>
            <span className="tabular-nums text-foreground">0</span>
          </div>
        </dl>
        <Button size="sm" disabled>
          Confirmar planejamento
        </Button>
      </WidgetCard>
    </div>
  );
}
