import {
  Activity,
  ListTodo,
  Timer,
  History,
  Flag,
  BarChart3,
} from "lucide-react";
import { WidgetCard } from "@/components/dashboard/WidgetCard";
import { WidgetGrid } from "@/components/dashboard/WidgetGrid";
import { WidgetHeader } from "@/components/dashboard/WidgetHeader";

const WIDGETS = [
  { title: "Progresso do Projeto", description: "Percentual concluído.", icon: Activity },
  { title: "Itens por Status", description: "Distribuição por estado.", icon: ListTodo },
  { title: "Sprint Atual", description: "Andamento da sprint.", icon: Timer },
  { title: "Atividades Recentes", description: "Últimos eventos.", icon: History },
  { title: "Próximos Marcos", description: "Marcos planejados.", icon: Flag },
  { title: "Indicadores Gerais", description: "KPIs consolidados.", icon: BarChart3 },
];

export function ProjectDashboardGrid() {
  return (
    <WidgetGrid columns={3}>
      {WIDGETS.map((w) => {
        const Icon = w.icon;
        return (
          <WidgetCard key={w.title}>
            <WidgetHeader title={w.title} description={w.description} icon={Icon} />
            <div className="mt-4 flex h-32 items-center justify-center rounded-lg border border-dashed border-border bg-background/40 text-xs text-muted-foreground">
              Placeholder
            </div>
          </WidgetCard>
        );
      })}
    </WidgetGrid>
  );
}
