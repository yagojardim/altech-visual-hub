import { cn } from "@/lib/utils";
import { useCan } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { ChevronRight, Plus, Pencil, Filter, Share2, RefreshCw } from "lucide-react";

export interface WorkItemHeaderProps {
  itemId: string;
  title: string;
  project?: string;
  status?: string;
  priority?: string;
  className?: string;
}

export function WorkItemHeader({
  itemId,
  title,
  project = "Altech Core",
  status = "Em progresso",
  priority = "Prioridade média",
  className,
}: WorkItemHeaderProps) {
  const canManage = useCan("workitem.manage");

  return (
    <header className={cn("space-y-2", className)}>
      <nav
        aria-label="Breadcrumb"
        className="flex items-center gap-1.5 text-xs uppercase tracking-wider text-muted-foreground"
      >
        <span>Projeto</span>
        <ChevronRight className="h-3 w-3" />
        <span>{project}</span>
        <ChevronRight className="h-3 w-3" />
        <span className="text-foreground">Work Item</span>
        <ChevronRight className="h-3 w-3" />
        <code className="rounded bg-panel px-1.5 py-0.5 font-mono text-primary">{itemId}</code>
      </nav>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0 space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">{title}</h1>
            <span className="inline-flex rounded-full border border-accent/30 bg-accent/15 px-2 py-0.5 text-[11px] text-accent">
              Work Item
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            Detalhes do work item selecionado.
          </p>
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="inline-flex rounded-full border border-accent/30 bg-accent/15 px-2 py-0.5 text-[11px] text-accent">
              {status}
            </span>
            <span className="inline-flex rounded-full border border-border bg-panel px-2 py-0.5 text-[11px] text-muted-foreground">
              {priority}
            </span>
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <Button size="sm" disabled={!canManage}>
            <Plus className="mr-1.5 h-4 w-4" /> Novo
          </Button>
          <Button variant="outline" size="sm" disabled={!canManage}>
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
  );
}
