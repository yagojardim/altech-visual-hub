import { cn } from "@/lib/utils";
import { useCan } from "@/lib/auth";
import { Can } from "@/components/Can";
import { Button } from "@/components/ui/button";

export interface WorkItemHeaderProps {
  itemId: string;
  title: string;
  project?: string;
  status?: string;
  priority?: string;
  className?: string;
}

export function WorkItemHeader({
  itemId,
  title,
  project = "Altech Core",
  status = "Em progresso",
  priority = "Prioridade média",
  className,
}: WorkItemHeaderProps) {
  const canManage = useCan("workitem.manage");

  return (
    <header className={cn("space-y-3", className)}>
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <code className="rounded bg-panel px-1.5 py-0.5 font-mono text-primary">{itemId}</code>
        <span>·</span>
        <span>{project}</span>
      </div>

      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex rounded-full border border-accent/30 bg-accent/15 px-2 py-0.5 text-[11px] text-accent">
            {status}
          </span>
          <span className="inline-flex rounded-full border border-border bg-panel px-2 py-0.5 text-[11px] text-muted-foreground">
            {priority}
          </span>
        </div>
      </div>

      <Can permission="workitem.manage">
        {canManage && (
          <div className="flex flex-wrap gap-2">
            <Button size="sm">Atualizar status</Button>
            <Button variant="outline" size="sm">
              Adicionar comentário
            </Button>
          </div>
        )}
      </Can>
    </header>
  );
}
