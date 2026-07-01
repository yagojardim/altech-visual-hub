import {
  Activity,
  Building2,
  User,
  Calendar,
  ListTodo,
  Play,
  CheckCircle2,
  Timer,
  AlertCircle,
  Clock,
  History,
  Flag,
} from "lucide-react";
import { WidgetCard } from "@/components/dashboard/WidgetCard";
import { WidgetGrid } from "@/components/dashboard/WidgetGrid";
import { WidgetHeader } from "@/components/dashboard/WidgetHeader";

const SUMMARY = [
  { title: "Status", description: "Estado atual do projeto", icon: Activity, value: "Em progresso" },
  { title: "Cliente", description: "Organização contratante", icon: Building2, value: "Altech" },
  { title: "Responsável", description: "Gestor do projeto", icon: User, value: "Ana Silva" },
  { title: "Datas", description: "Prazo do projeto", icon: Calendar, value: "01/01 – 31/03/2026" },
];

const INDICATORS = [
  { title: "Total de Work Items", description: "Todos os itens do projeto", icon: ListTodo },
  { title: "Itens em andamento", description: "Ativamente trabalhados", icon: Play },
  { title: "Itens concluídos", description: "Finalizados até o momento", icon: CheckCircle2 },
  { title: "Sprint Atual", description: "Sprint em execução", icon: Timer },
  { title: "Pendências", description: "Itens ainda não iniciados", icon: AlertCircle },
  { title: "Última atualização", description: "Data da última modificação", icon: Clock },
];

function PlaceholderBox() {
  return (
    <div className="mt-4 flex h-24 items-center justify-center rounded-lg border border-dashed border-border bg-background/40 text-xs text-muted-foreground">
      Placeholder
    </div>
  );
}

export function ProjectOverviewGrid() {
  return (
    <div className="space-y-6">
      <WidgetGrid columns={4}>
        {SUMMARY.map((item) => (
          <WidgetCard key={item.title}>
            <WidgetHeader
              title={item.title}
              description={item.description}
              icon={item.icon}
              action={<span className="text-sm font-medium text-foreground">{item.value}</span>}
            />
          </WidgetCard>
        ))}
      </WidgetGrid>

      <WidgetGrid columns={3}>
        {INDICATORS.map((item) => {
          const Icon = item.icon;
          return (
            <WidgetCard key={item.title}>
              <WidgetHeader title={item.title} description={item.description} icon={Icon} />
              <PlaceholderBox />
            </WidgetCard>
          );
        })}
      </WidgetGrid>

      <WidgetGrid columns={2}>
        <WidgetCard>
          <WidgetHeader title="Atividade recente" description="Últimos eventos do projeto" icon={History} />
          <PlaceholderBox />
        </WidgetCard>
        <WidgetCard>
          <WidgetHeader title="Próximas entregas" description="Marcos futuros planejados" icon={Flag} />
          <PlaceholderBox />
        </WidgetCard>
      </WidgetGrid>
    </div>
  );
}
