import { CalendarClock, User2, Tag, FileText } from "lucide-react";
import { WidgetCard } from "@/components/dashboard/WidgetCard";
import { WidgetHeader } from "@/components/dashboard/WidgetHeader";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { WorkItemChecklist } from "./WorkItemChecklist";
import { WorkItemComments } from "./WorkItemComments";
import { WorkItemAttachments } from "./WorkItemAttachments";
import { WorkItemHistory } from "./WorkItemHistory";

export interface WorkItemContentProps {
  description?: string;
  owner?: string;
  dueDate?: string;
  type?: string;
  className?: string;
}

function Detail({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <li className="flex items-center justify-between gap-3">
      <span className="flex items-center gap-2 text-xs text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </span>
      <span className="text-sm">{value}</span>
    </li>
  );
}

export function WorkItemContent({
  description,
  owner = "—",
  dueDate = "—",
  type = "—",
  className,
}: WorkItemContentProps) {
  return (
    <div className={cn("grid gap-6 lg:grid-cols-[1fr_280px]", className)}>
      <article className="space-y-6">
        <section className="space-y-2">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            Descrição
          </h2>
          <div className="rounded-xl border border-border bg-panel p-5 text-sm leading-relaxed text-foreground/90">
            {description ? (
              <p>{description}</p>
            ) : (
              <p className="text-muted-foreground italic">
                Nenhuma descrição fornecida.
              </p>
            )}
          </div>
        </section>

        <Separator />
        <WorkItemChecklist />

        <Separator />
        <WorkItemComments />

        <Separator />
        <WorkItemAttachments />

        <Separator />
        <WorkItemHistory />
      </article>

      <aside className="space-y-3">
        <WidgetCard>
          <WidgetHeader title="Detalhes" icon={Tag} className="mb-3" />
          <ul className="space-y-3 text-sm">
            <Detail icon={User2} label="Owner" value={owner} />
            <Detail icon={CalendarClock} label="Prazo" value={dueDate} />
            <Detail icon={Tag} label="Tipo" value={type} />
          </ul>
        </WidgetCard>
      </aside>
    </div>
  );
}
