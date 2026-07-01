import type { ReactNode } from "react";

export function ViewHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <header className="flex items-start justify-between gap-4 border-b border-border px-4 py-3">
      <div className="min-w-0">
        <h2 className="truncate text-sm font-semibold text-foreground">{title}</h2>
        {description && (
          <p className="mt-0.5 truncate text-xs text-muted-foreground">{description}</p>
        )}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </header>
  );
}
