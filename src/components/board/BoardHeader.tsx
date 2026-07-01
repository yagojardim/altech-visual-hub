import type { ReactNode } from "react";
import { ChevronRight, Plus, Pencil, Filter, Share2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export function BoardHeader({
  title,
  description,
  actions,
  projectId,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  projectId?: string;
}) {
  return (
    <header className="space-y-2">
      <nav
        aria-label="Breadcrumb"
        className="flex items-center gap-1.5 text-xs uppercase tracking-wider text-muted-foreground"
      >
        <span>Projeto</span>
        {projectId && (
          <>
            <ChevronRight className="h-3 w-3" />
            <code className="rounded bg-panel px-1.5 py-0.5 font-mono text-primary">{projectId}</code>
          </>
        )}
        <ChevronRight className="h-3 w-3" />
        <span className="text-foreground">Board</span>
      </nav>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0 space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">{title}</h1>
            <span className="inline-flex rounded-full border border-accent/30 bg-accent/15 px-2 py-0.5 text-[11px] text-accent">
              Board
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            {description ?? "Fluxo Kanban do projeto."}
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {actions ?? (
            <>
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
            </>
          )}
        </div>
      </div>
    </header>
  );
}
