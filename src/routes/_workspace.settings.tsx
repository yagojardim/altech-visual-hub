import { createFileRoute } from "@tanstack/react-router";
import { EmptyState } from "@/components/states";
import { Settings as SettingsIcon } from "lucide-react";

export const Route = createFileRoute("/_workspace/settings")({
  component: SettingsIndex,
});

function SettingsIndex() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl">Configurações</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Preferências do workspace, membros, integrações e cobrança.
        </p>
      </div>
      <EmptyState
        icon={<SettingsIcon className="h-5 w-5" />}
        title="Em construção"
        description="As telas de configuração serão habilitadas nos próximos batches."
      />
    </div>
  );
}
