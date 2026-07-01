import {
  Plus,
  Pencil,
  Copy,
  Move,
  Archive,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface WorkItemActionsProps {
  className?: string;
}

/** Primary action buttons for a single Work Item. All actions are visual placeholders. */
export function WorkItemActions({ className }: WorkItemActionsProps) {
  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      <Button size="sm" disabled>
        <Plus className="mr-1.5 h-4 w-4" />
        Novo item
      </Button>
      <Button variant="outline" size="sm" disabled>
        <Pencil className="mr-1.5 h-4 w-4" />
        Editar
      </Button>
      <Button variant="outline" size="sm" disabled>
        <Copy className="mr-1.5 h-4 w-4" />
        Duplicar
      </Button>
      <Button variant="outline" size="sm" disabled>
        <Move className="mr-1.5 h-4 w-4" />
        Mover
      </Button>
      <Button variant="outline" size="sm" disabled>
        <Archive className="mr-1.5 h-4 w-4" />
        Arquivar
      </Button>
      <Button variant="outline" size="sm" disabled>
        <Trash2 className="mr-1.5 h-4 w-4" />
        Excluir
      </Button>
    </div>
  );
}
