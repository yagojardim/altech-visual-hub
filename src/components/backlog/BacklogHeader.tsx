import { ChevronRight } from "lucide-react";

export function BacklogHeader({ projectId }: { projectId?: string } = {}) {
  return (
    <div className="space-y-2">
      {projectId && (
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-1.5 text-xs uppercase tracking-wider text-muted-foreground"
        >
          <span>Projeto</span>
          <code className="rounded bg-panel px-1.5 py-0.5 font-mono text-primary">{projectId}</code>
          <ChevronRight className="h-3 w-3" />
          <span className="text-foreground">Backlog</span>
        </nav>
      )}
      <div className="space-y-1">
        <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">Backlog</h2>
        <p className="text-sm text-muted-foreground">
          Itens de trabalho planejados para o projeto.
        </p>
      </div>
    </div>
  );
}
