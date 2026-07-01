import { CheckSquare, Archive, Trash2, X, Move, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface BulkActionBarProps {
  selectedCount?: number;
  className?: string;
}

/** Bulk selection action bar — visual placeholder for multi-select workflows. */
export function BulkActionBar({ selectedCount = 0, className }: BulkActionBarProps) {
  if (selectedCount === 0) return null;

  return (
    <div
      className={cn(
        "flex w-full flex-col gap-3 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2",
        "sm:w-auto sm:flex-row sm:items-center",
        className,
      )}
    >
      <div className="flex items-center gap-2">
        <Badge variant="default" className="h-6 px-2 text-xs">
          <CheckSquare className="mr-1 h-3 w-3" />
          {selectedCount} selecionado{selectedCount > 1 ? "s" : ""}
        </Badge>
        <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" disabled>
          <X className="mr-1 h-3.5 w-3.5" />
          Limpar
        </Button>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" size="sm" className="h-7 text-xs" disabled>
          <Copy className="mr-1 h-3.5 w-3.5" />
          Duplicar
        </Button>
        <Button variant="outline" size="sm" className="h-7 text-xs" disabled>
          <Move className="mr-1 h-3.5 w-3.5" />
          Mover
        </Button>
        <Button variant="outline" size="sm" className="h-7 text-xs" disabled>
          <Archive className="mr-1 h-3.5 w-3.5" />
          Arquivar
        </Button>
        <Button variant="outline" size="sm" className="h-7 text-xs" disabled>
          <Trash2 className="mr-1 h-3.5 w-3.5" />
          Excluir
        </Button>
      </div>
    </div>
  );
}
