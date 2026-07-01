import { BarChart3, ListTodo, Users } from "lucide-react";
import { WidgetCard } from "@/components/dashboard/WidgetCard";
import { WidgetGrid } from "@/components/dashboard/WidgetGrid";
import { WidgetHeader } from "@/components/dashboard/WidgetHeader";
import { EmptyState } from "@/components/states";

export function ProjectOverview() {
  return (
    <div className="space-y-6">
      <WidgetGrid columns={3}>
        <WidgetCard>
          <WidgetHeader title="Progresso" description="Indicadores de progresso" icon={BarChart3} />
          <div className="mt-4 h-24 rounded-lg border border-dashed border-border bg-panel/40" />
        </WidgetCard>
        <WidgetCard>
          <WidgetHeader title="Work Items" description="Resumo de work items" icon={ListTodo} />
          <div className="mt-4 h-24 rounded-lg border border-dashed border-border bg-panel/40" />
        </WidgetCard>
        <WidgetCard>
          <WidgetHeader title="Equipe" description="Colaboradores do projeto" icon={Users} />
          <div className="mt-4 h-24 rounded-lg border border-dashed border-border bg-panel/40" />
        </WidgetCard>
      </WidgetGrid>

      <EmptyState
        title="Visão Geral em construção"
        description="Esta seção exibirá métricas e informações consolidadas do projeto quando as funcionalidades forem implementadas."
      />
    </div>
  );
}
