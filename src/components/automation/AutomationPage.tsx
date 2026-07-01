import { useState, useEffect } from "react";
import { Zap } from "lucide-react";
import { BoardHeader } from "@/components/board/BoardHeader";
import { ViewContainer } from "@/components/views/ViewContainer";
import { ViewHeader } from "@/components/views/ViewHeader";
import { WidgetGrid } from "@/components/dashboard/WidgetGrid";
import { LoadingState } from "@/components/states";
import { AutomationRuleCard } from "./AutomationRuleCard";
import { AutomationToolbar } from "./AutomationToolbar";
import { AutomationEmptyState } from "./AutomationEmptyState";

export interface AutomationRule {
  id: string;
  title: string;
  status: "Ativa" | "Inativa";
}

const MOCK_RULES: AutomationRule[] = [
  { id: "rule-1", title: "Notificar quando item mudar para 'Concluído'", status: "Ativa" },
  { id: "rule-2", title: "Criar tarefa ao detectar status crítico", status: "Inativa" },
];

export function AutomationPage() {
  const [status, setStatus] = useState<"loading" | "ready">("loading");

  useEffect(() => {
    const timer = setTimeout(() => setStatus("ready"), 600);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="space-y-6">
      <BoardHeader
        title="Automações"
        description="Configure regras automáticas do workspace."
      />
      <ViewContainer
        header={
          <ViewHeader
            title="Regras ativas"
            description="Estrutura preparada para gatilhos, condições e ações."
            actions={<Zap className="h-4 w-4 text-muted-foreground" />}
          />
        }
        toolbar={<AutomationToolbar onNewRule={() => {}} />}
        empty={<AutomationEmptyState onNewRule={() => {}} />}
      >
        {status === "loading" ? (
          <LoadingState label="Carregando regras…" />
        ) : MOCK_RULES.length > 0 ? (
          <WidgetGrid columns={2}>
            {MOCK_RULES.map((rule) => (
              <AutomationRuleCard key={rule.id} title={rule.title} status={rule.status} />
            ))}
          </WidgetGrid>
        ) : null}
      </ViewContainer>
    </div>
  );
}
