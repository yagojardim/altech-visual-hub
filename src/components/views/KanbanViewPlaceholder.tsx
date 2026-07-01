import { KanbanSquare } from "lucide-react";

const COLUMNS = ["Backlog", "To Do", "In Progress", "Review", "Done"];

export function KanbanViewPlaceholder() {
  return (
    <div className="flex gap-3 overflow-x-auto pb-2">
      {COLUMNS.map((col) => (
        <div
          key={col}
          className="flex w-64 shrink-0 flex-col rounded-lg border border-dashed border-border bg-panel-elevated/30"
        >
          <div className="flex items-center justify-between border-b border-border/60 px-3 py-2">
            <span className="text-xs font-medium text-foreground">{col}</span>
            <span className="text-[10px] text-muted-foreground">0</span>
          </div>
          <div className="flex flex-1 flex-col items-center justify-center gap-2 p-6 text-center">
            <KanbanSquare className="h-5 w-5 text-muted-foreground/60" />
            <p className="text-[11px] text-muted-foreground">
              Placeholder da coluna.<br />Kanban funcional virá em breve.
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
