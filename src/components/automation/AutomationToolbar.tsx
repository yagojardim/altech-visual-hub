import { Plus, Filter, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Can } from "@/components/Can";

export interface AutomationToolbarProps {
  onNewRule?: () => void;
}

export function AutomationToolbar({ onNewRule }: AutomationToolbarProps) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Button variant="ghost" size="sm" className="h-7 px-2 text-xs">
          <Filter className="mr-1 h-3.5 w-3.5" /> Filtros
        </Button>
        <Button variant="ghost" size="sm" className="h-7 px-2 text-xs">
          <SlidersHorizontal className="mr-1 h-3.5 w-3.5" /> Agrupar
        </Button>
      </div>
      <Can permission="admin.access">
        <Button size="sm" onClick={onNewRule}>
          <Plus className="mr-1.5 h-4 w-4" /> Nova Regra
        </Button>
      </Can>
    </div>
  );
}
