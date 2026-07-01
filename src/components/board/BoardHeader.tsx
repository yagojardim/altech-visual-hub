import type { ReactNode } from "react";
import { ChevronRight } from "lucide-react";

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
      {projectId && (
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-1.5 text-xs uppercase tracking-wider text-muted-foreground"
        >
          <span>Projeto</span>
          <code className="rounded bg-panel px-1.5 py-0.5 font-mono text-primary">{projectId}</code>
          <ChevronRight className="h-3 w-3" />
          <span className="text-foreground">Board</span>
        </nav>
      )}
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          {description && (
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          )}
        </div>
        {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
      </div>
    </header>
  );
}
