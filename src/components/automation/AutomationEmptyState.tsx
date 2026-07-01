import { Zap, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Can } from "@/components/Can";
import { EmptyState } from "@/components/states";

export interface AutomationEmptyStateProps {
  onNewRule?: () => void;
}

export function AutomationEmptyState({ onNewRule }: AutomationEmptyStateProps) {
  return (
    <EmptyState
      title="Nenhuma regra de automação"
      description="Crie regras para automatizar gatilhos, condições e ações no workspace."
      icon={<Zap className="h-5 w-5" />}
      action={
        <Can permission="admin.access">
          <Button size="sm" onClick={onNewRule}>
            <Plus className="mr-1.5 h-4 w-4" /> Nova Regra
          </Button>
        </Can>
      }
    />
  );
}
