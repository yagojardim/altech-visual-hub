import {
  Activity,
  Building2,
  User,
  Calendar,
  ChevronRight,
  Plus,
  Pencil,
  Filter,
  Share2,
  RefreshCw,
} from "lucide-react";
import { WidgetCard } from "@/components/dashboard/WidgetCard";
import { WidgetGrid } from "@/components/dashboard/WidgetGrid";
import { WidgetHeader } from "@/components/dashboard/WidgetHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function ProjectHeader({ projectId }: { projectId: string }) {
  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-1.5 text-xs uppercase tracking-wider text-muted-foreground"
        >
          <span>Projeto</span>
          <ChevronRight className="h-3 w-3" />
          <code className="rounded bg-panel px-1.5 py-0.5 font-mono text-primary">{projectId}</code>
        </nav>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0 space-y-1">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">Altech Core</h1>
              <span className="inline-flex rounded-full border border-accent/30 bg-accent/15 px-2 py-0.5 text-[11px] text-accent">
                Projeto
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              Projeto principal da plataforma. Estrutura visual preparada para o MVP.
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <Button size="sm" disabled>
              <Plus className="mr-1.5 h-4 w-4" /> Novo
            </Button>
            <Button variant="outline" size="sm" disabled>
              <Pencil className="mr-1.5 h-4 w-4" /> Editar
            </Button>
            <Button variant="outline" size="sm" disabled>
              <Filter className="mr-1.5 h-4 w-4" /> Filtrar
            </Button>
            <Button variant="outline" size="sm" disabled>
              <Share2 className="mr-1.5 h-4 w-4" /> Compartilhar
            </Button>
            <Button variant="ghost" size="sm" disabled>
              <RefreshCw className="mr-1.5 h-4 w-4" /> Atualizar
            </Button>
          </div>
        </div>
      </header>

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
