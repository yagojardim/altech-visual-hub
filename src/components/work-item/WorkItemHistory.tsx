import { History } from "lucide-react";
import { WidgetHeader } from "@/components/dashboard/WidgetHeader";
import { EmptyState } from "@/components/states";
import { cn } from "@/lib/utils";

export interface WorkItemHistoryProps {
  loading?: boolean;
  className?: string;
}

export function WorkItemHistory({ loading, className }: WorkItemHistoryProps) {
  return (
    <section className={cn("space-y-3", className)}>
      <WidgetHeader
        title="Histórico"
        icon={History}
        description="Alterações realizadas neste work item"
      />
      {loading ? (
        <div className="h-24 animate-pulse rounded-xl border border-border bg-panel/40" />
      ) : (
        <EmptyState
          title="Sem histórico"
          description="As alterações aparecerão aqui."
          icon={<History className="h-5 w-5" />}
        />
      )}
    </section>
  );
}
