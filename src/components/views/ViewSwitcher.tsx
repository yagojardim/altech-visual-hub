import type { ComponentType } from "react";
import { KanbanSquare, List, Calendar, LayoutGrid } from "lucide-react";
import { cn } from "@/lib/utils";

export type ViewKey = "kanban" | "list" | "timeline" | "board";

export type ViewOption = {
  key: ViewKey;
  label: string;
  icon: ComponentType<{ className?: string }>;
  disabled?: boolean;
};

export const DEFAULT_VIEWS: ViewOption[] = [
  { key: "kanban", label: "Kanban", icon: KanbanSquare },
  { key: "list", label: "Lista", icon: List, disabled: true },
  { key: "timeline", label: "Timeline", icon: Calendar, disabled: true },
  { key: "board", label: "Board", icon: LayoutGrid, disabled: true },
];

export function ViewSwitcher({
  value,
  onChange,
  views = DEFAULT_VIEWS,
}: {
  value: ViewKey;
  onChange: (v: ViewKey) => void;
  views?: ViewOption[];
}) {
  return (
    <div
      role="tablist"
      aria-label="Selecionar view"
      className="inline-flex items-center gap-0.5 rounded-md border border-border bg-panel-elevated/40 p-0.5"
    >
      {views.map((v) => {
        const Icon = v.icon;
        const active = v.key === value;
        return (
          <button
            key={v.key}
            role="tab"
            aria-selected={active}
            disabled={v.disabled}
            onClick={() => !v.disabled && onChange(v.key)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-medium transition-colors",
              active
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
              v.disabled && "cursor-not-allowed opacity-40 hover:text-muted-foreground",
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            {v.label}
          </button>
        );
      })}
    </div>
  );
}
