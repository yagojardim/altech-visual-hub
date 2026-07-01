import type { ReactNode } from "react";
import { Filter, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";

export function BoardToolbar({ right }: { right?: ReactNode }) {
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
      {right}
    </div>
  );
}
