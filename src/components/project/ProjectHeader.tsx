import { Activity, Building2, User, Calendar, Settings } from "lucide-react";
import { WidgetCard } from "@/components/dashboard/WidgetCard";
import { WidgetGrid } from "@/components/dashboard/WidgetGrid";
import { WidgetHeader } from "@/components/dashboard/WidgetHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function ProjectHeader({ projectId }: { projectId: string }) {
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
          <span>Projeto</span>
          <span>·</span>
          <code className="rounded bg-panel px-1.5 py-0.5 font-mono text-primary">{projectId}</code>
        </div>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Altech Core</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Projeto principal da plataforma. Estrutura visual preparada para o MVP.
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Button variant="outline" size="sm">
              <Settings className="mr-1.5 h-4 w-4" />
              Configurar
            </Button>
          </div>
        </div>
      </div>

      <WidgetGrid columns={4}>
        <WidgetCard>
          <WidgetHeader
            title="Status"
            description="Estado atual do projeto"
            icon={Activity}
            action={<Badge>Em progresso</Badge>}
          />
        </WidgetCard>
        <WidgetCard>
          <WidgetHeader
            title="Cliente"
            description="Organização contratante"
            icon={Building2}
            action={<span className="text-sm font-medium text-foreground">Altech</span>}
          />
        </WidgetCard>
        <WidgetCard>
          <WidgetHeader
            title="Responsável"
            description="Gestor do projeto"
            icon={User}
            action={<span className="text-sm font-medium text-foreground">Ana Silva</span>}
          />
        </WidgetCard>
        <WidgetCard>
          <WidgetHeader
            title="Datas"
            description="Prazo do projeto"
            icon={Calendar}
            action={<span className="text-sm font-medium text-foreground">01/01 – 31/03/2026</span>}
          />
        </WidgetCard>
      </WidgetGrid>
    </div>
  );
}
