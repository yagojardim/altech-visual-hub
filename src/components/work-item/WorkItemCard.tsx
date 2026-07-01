import { cn } from "@/lib/utils";
import { WorkItemCardHeader } from "./WorkItemCardHeader";
import { WorkItemCardBody } from "./WorkItemCardBody";
import { WorkItemCardFooter } from "./WorkItemCardFooter";

export interface WorkItemCardProps {
  itemId?: string;
  title?: string;
  summary?: string;
  type?: string;
  priority?: string;
  owner?: string;
  storyPoints?: string;
  status?: string;
  date?: string;
  tags?: string[];
  selected?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  className?: string;
}

export function WorkItemCard({
  itemId = "WI-000",
  title = "Título do work item",
  summary = "Resumo do item",
  type = "História",
  priority = "Média",
  owner = "Ana",
  storyPoints = "5",
  status = "Em progresso",
  date = "12/01/2026",
  tags = [],
  selected = false,
  disabled = false,
  onClick,
  className,
}: WorkItemCardProps) {
  return (
    <article
      onClick={disabled ? undefined : onClick}
      className={cn(
        "group relative flex flex-col gap-3 rounded-xl border bg-panel p-4 shadow-sm transition-colors",
        "border-border",
        !disabled && "hover:border-primary/40 hover:bg-panel-elevated",
        selected && "border-primary ring-1 ring-primary/30",
        disabled && "cursor-not-allowed opacity-60",
        className,
      )}
    >
      <WorkItemCardHeader itemId={itemId} type={type} priority={priority} />
      <WorkItemCardBody title={title} summary={summary} tags={tags} />
      <WorkItemCardFooter owner={owner} storyPoints={storyPoints} status={status} date={date} />
    </article>
  );
}
