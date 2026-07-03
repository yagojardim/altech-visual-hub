import { createFileRoute, Link } from "@tanstack/react-router";
import { Users, Settings as SettingsIcon } from "lucide-react";

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
      <div className="grid gap-3 sm:grid-cols-2">
        <Link
          to="/settings/members"
          className="altech-card flex items-start gap-3 p-4 transition hover:border-primary/50"
        >
          <div className="rounded-md bg-primary/10 p-2 text-primary">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm font-semibold">Membros</h2>
            <p className="text-xs text-muted-foreground">Perfis do workspace (somente leitura).</p>
          </div>
        </Link>
        <div className="altech-card flex items-start gap-3 p-4 opacity-60">
          <div className="rounded-md bg-muted p-2 text-muted-foreground">
            <SettingsIcon className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm font-semibold">Outras preferências</h2>
            <p className="text-xs text-muted-foreground">Em breve.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
