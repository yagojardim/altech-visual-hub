import { WorkItemCard } from "@/components/work-item/WorkItemCard";

export interface BacklogRowProps {
  type?: string;
  title?: string;
  selected?: boolean;
  active?: boolean;
  onClick?: () => void;
  className?: string;
}

export function BacklogRow({
  type = "História",
  title = "Título do work item",
  selected,
  active,
  onClick,
  className,
}: BacklogRowProps) {
  return (
    <WorkItemCard
      type={type}
      title={title}
      selected={selected}
      onClick={onClick}
      className={className}
    />
  );
}
