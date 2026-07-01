import { cn } from "@/lib/utils";
import { Target, Puzzle, BookOpen, CheckSquare, Bug } from "lucide-react";
import type { ReactNode } from "react";

export interface BacklogItemContainerProps {
  type?: string;
  level?: number;
  selected?: boolean;
  active?: boolean;
  children: ReactNode;
}

const TYPE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Épico: Target,
  Feature: Puzzle,
  História: BookOpen,
  Task: CheckSquare,
  Bug: Bug,
};

const LEVEL_INDENT = ["pl-0", "pl-6", "pl-12", "pl-18", "pl-24"];

export function BacklogItemContainer({
  type = "História",
  level = 0,
  selected,
  active,
  children,
}: BacklogItemContainerProps) {
  const Icon = TYPE_ICONS[type] ?? BookOpen;
  const indent = LEVEL_INDENT[Math.min(level, LEVEL_INDENT.length - 1)];

  return (
    <div
      className={cn(
        "flex items-start gap-2 rounded-lg transition-colors",
        indent,
        active && "bg-primary/5 ring-1 ring-primary/20",
        selected && !active && "bg-accent/5",
      )}
    >
      <Icon className="mt-3 h-4 w-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
