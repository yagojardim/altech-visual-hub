import { cn } from "@/lib/utils";

export interface WorkItemCardFooterProps {
  owner?: string;
  storyPoints?: string;
  status?: string;
  date?: string;
}

const STATUS_STYLES: Record<string, string> = {
  "Em progresso": "bg-accent/15 text-accent border-accent/30",
  Concluído: "bg-primary/15 text-primary border-primary/30",
  Aberto: "bg-warning/15 text-warning border-warning/30",
};

export function WorkItemCardFooter({
  owner = "Ana",
  storyPoints = "5",
  status = "Em progresso",
  date = "12/01/2026",
}: WorkItemCardFooterProps) {
  const initial = owner[0]?.toUpperCase() ?? "?";
  return (
    <footer className="flex items-center justify-between gap-2 pt-1">
      <div className="flex items-center gap-2 overflow-hidden">
        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full altech-gradient text-[10px] font-medium text-primary-foreground">
          {initial}
        </div>
        <span className="truncate text-xs text-muted-foreground">{owner}</span>
      </div>
      <div className="flex shrink-0 items-center gap-2 text-[10px] text-muted-foreground">
        <span className="inline-flex rounded-full border border-border bg-panel px-2 py-0.5">
          {storyPoints} SP
        </span>
        <span
          className={cn(
            "inline-flex rounded-full border px-2 py-0.5",
            STATUS_STYLES[status] ?? "border-border bg-panel",
          )}
        >
          {status}
        </span>
        <span className="hidden sm:inline">{date}</span>
      </div>
    </footer>
  );
}
