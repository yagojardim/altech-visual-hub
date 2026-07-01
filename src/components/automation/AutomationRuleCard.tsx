import { Zap, Filter, Play } from "lucide-react";
import { WidgetCard } from "@/components/dashboard/WidgetCard";
import { Badge } from "@/components/ui/badge";

export interface AutomationRuleCardProps {
  title: string;
  status: "Ativa" | "Inativa";
}

export function AutomationRuleCard({ title, status }: AutomationRuleCardProps) {
  const isActive = status === "Ativa";

  return (
    <WidgetCard className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <h3 className="text-sm font-medium">{title}</h3>
        <Badge variant={isActive ? "default" : "secondary"}>{status}</Badge>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Section icon={Zap} label="Gatilho" placeholder="Quando acontecer…" />
        <Section icon={Filter} label="Condição" placeholder="Se condição for…" />
        <Section icon={Play} label="Ação" placeholder="Então execute…" />
      </div>
    </WidgetCard>
  );
}

function Section({
  icon: Icon,
  label,
  placeholder,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  placeholder: string;
}) {
  return (
    <div className="space-y-2 rounded-lg border border-dashed border-border bg-panel/40 p-3">
      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      <p className="text-xs text-muted-foreground">{placeholder}</p>
    </div>
  );
}
