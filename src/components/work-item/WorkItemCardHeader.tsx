import { ConceptIcon, CONCEPT_COLORS, conceptFromType } from "@/components/icons/ConceptIcon";
import { Chip } from "@/components/ui/chip";
import { priorityMeta } from "@/lib/work-item-type-style";

export interface WorkItemCardHeaderProps {
  itemId?: string;
  type?: string;
  priority?: string;
}

export function WorkItemCardHeader({
  itemId = "WI-000",
  type = "História",
  priority = "Média",
}: WorkItemCardHeaderProps) {
  const concept = conceptFromType(type);
  const color = CONCEPT_COLORS[concept];
  const prio = priorityMeta(priority);
  return (
    <header className="flex items-center justify-between gap-2">
      <div className="flex items-center gap-2 overflow-hidden">
        <Chip
          label={type}
          variant="custom"
          color={color}
          size="xs"
          icon={<ConceptIcon name={concept} size={12} />}
          className="uppercase tracking-wide"
        />
        <code className="truncate rounded bg-panel px-1.5 py-0.5 font-mono text-[10px] text-primary">
          {itemId}
        </code>
      </div>
      {prio ? <Chip label={prio.label} variant="custom" color={prio.color} size="xs" /> : null}
    </header>
  );
}
