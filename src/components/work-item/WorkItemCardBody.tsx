import { Badge } from "@/components/ui/badge";

export interface WorkItemCardBodyProps {
  title?: string;
  summary?: string;
  tags?: string[];
}

export function WorkItemCardBody({
  title = "Título do work item",
  summary = "Resumo do item",
  tags = [],
}: WorkItemCardBodyProps) {
  return (
    <div className="min-w-0 space-y-2">
      <h3 className="line-clamp-2 text-sm font-medium leading-snug text-foreground">
        {title}
      </h3>
      <p className="line-clamp-2 text-xs text-muted-foreground">
        {summary}
      </p>
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="text-[10px]">
              {tag}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
