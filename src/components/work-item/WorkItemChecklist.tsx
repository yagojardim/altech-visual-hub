import { CheckSquare, Plus } from "lucide-react";
import { WidgetHeader } from "@/components/dashboard/WidgetHeader";
import { EmptyState } from "@/components/states";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface WorkItemChecklistProps {
  loading?: boolean;
  className?: string;
}

export function WorkItemChecklist({ loading, className }: WorkItemChecklistProps) {
  return (
    <section className={cn("space-y-3", className)}>
      <div className="flex items-start justify-between gap-3">
        <WidgetHeader
          title="Checklist"
          icon={CheckSquare}
          description="Itens de acompanhamento"
        />
        <Button variant="outline" size="sm" disabled>
          <Plus className="h-3.5 w-3.5" />
          Adicionar item
        </Button>
      </div>
      {loading ? (
        <div className="h-24 animate-pulse rounded-xl border border-border bg-panel/40" />
      ) : (
        <EmptyState
          title="Sem itens de checklist"
          description="Os itens de checklist aparecerão aqui."
          icon={<CheckSquare className="h-5 w-5" />}
        />
      )}
    </section>
  );
}
