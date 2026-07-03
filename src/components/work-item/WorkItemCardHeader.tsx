import { cn } from "@/lib/utils";
import { ConceptIcon, CONCEPT_COLORS, conceptFromType } from "@/components/icons/ConceptIcon";

export interface WorkItemCardHeaderProps {
  itemId?: string;
  type?: string;
  priority?: string;
}

const PRIORITY_STYLES: Record<string, string> = {
  Alta: "bg-destructive/10 text-destructive border-destructive/20",
  Média: "bg-warning/10 text-warning border-warning/20",
  Baixa: "bg-primary/10 text-primary border-primary/20",
};

export function WorkItemCardHeader({
  itemId = "WI-000",
  type = "História",
  priority = "Média",
}: WorkItemCardHeaderProps) {
  const concept = conceptFromType(type);
  const color = CONCEPT_COLORS[concept];
  return (
    <header className="flex items-center justify-between gap-2">
      <div className="flex items-center gap-2 overflow-hidden">
        <span
          className="keep-radius inline-flex shrink-0 items-center gap-1.5 px-1.5 py-0.5"
          style={{
            color,
            background: `color-mix(in srgb, ${color} 12%, transparent)`,
            borderRadius: 4,
            fontFamily: "'JetBrains Mono',monospace",
            fontSize: 10,
            fontWeight: 500,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
          }}
        >
          <ConceptIcon name={concept} size={12} />
          {type}
        </span>
        <code className="truncate rounded bg-panel px-1.5 py-0.5 font-mono text-[10px] text-primary">
          {itemId}
        </code>
      </div>
      <span
        className={cn(
          "shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-medium",
          PRIORITY_STYLES[priority] ?? PRIORITY_STYLES["Média"],
        )}
      >
        {priority}
      </span>
    </header>
  );
}

