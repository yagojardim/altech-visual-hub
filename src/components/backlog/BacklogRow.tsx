import { WorkItemCard } from "@/components/work-item/WorkItemCard";

export interface BacklogRowProps {
  type?: string;
  title?: string;
  selected?: boolean;
  active?: boolean;
  className?: string;
}

export function BacklogRow({
  type = "História",
  title = "Título do work item",
  selected,
  active,
  className,
}: BacklogRowProps) {
  return (
    <WorkItemCard
      type={type}
      title={title}
      selected={selected}
      className={className}
    />
  );
}
