import { ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ReactNode } from "react";

export interface BacklogGroupProps {
  title?: string;
  count?: number;
  expanded?: boolean;
  children?: ReactNode;
}

export function BacklogGroup({
  title = "Grupo",
  count = 0,
  expanded = true,
  children,
}: BacklogGroupProps) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="h-6 w-6" disabled>
          {expanded ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </Button>
        <span className="text-sm font-medium text-foreground">{title}</span>
        <span className="text-xs text-muted-foreground">({count})</span>
      </div>
      {expanded && <div className="space-y-1">{children}</div>}
    </div>
  );
}
