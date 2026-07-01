import type { ReactNode } from "react";
import { Filter, ArrowUpDown, Group, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface WorkItemToolbarProps {
  actions?: ReactNode;
  organization?: ReactNode;
  selection?: ReactNode;
  className?: string;
}

/** Reusable action bar for Work Item management across Backlog, Board, Search and Dashboard. */
export function WorkItemToolbar({
  actions,
  organization,
  selection,
  className,
}: WorkItemToolbarProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-xl border border-border bg-panel p-3 shadow-sm",
        "sm:flex-row sm:items-center sm:justify-between",
        className,
      )}
    >
      <div className="flex flex-wrap items-center gap-2">{actions}</div>
      <div className="flex flex-wrap items-center gap-2">{organization}</div>
      {selection && (
        <div className="flex w-full items-center justify-between gap-2 border-t border-border pt-3 sm:w-auto sm:border-t-0 sm:pt-0">
          {selection}
        </div>
      )}
    </div>
  );
}

export interface WorkItemOrganizationProps {
  className?: string;
}

/** Organization controls for the Work Item toolbar — visual placeholders. */
export function WorkItemOrganization({ className }: WorkItemOrganizationProps) {
  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      <Button variant="ghost" size="sm" className="h-8 px-2 text-xs" disabled>
        <Filter className="mr-1 h-3.5 w-3.5" />
        Filtro
      </Button>
      <Button variant="ghost" size="sm" className="h-8 px-2 text-xs" disabled>
        <ArrowUpDown className="mr-1 h-3.5 w-3.5" />
        Ordenação
      </Button>
      <Button variant="ghost" size="sm" className="h-8 px-2 text-xs" disabled>
        <Group className="mr-1 h-3.5 w-3.5" />
        Agrupamento
      </Button>
      <Button variant="ghost" size="sm" className="h-8 px-2 text-xs" disabled>
        <RefreshCw className="mr-1 h-3.5 w-3.5" />
        Atualizar
      </Button>
    </div>
  );
}
