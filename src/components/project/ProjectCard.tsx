import { Link } from "@tanstack/react-router";
import { Building2, Calendar, User, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { WidgetCard } from "@/components/dashboard/WidgetCard";
import { cn } from "@/lib/utils";

export interface ProjectCardProps {
  projectId: string;
  name: string;
  client?: string;
  owner?: string;
  status?: string;
  dueDate?: string;
  description?: string;
  className?: string;
}

/**
 * Reusable card representing a project entry. Navigates to the project's
 * workspace on click. Visual-only.
 */
export function ProjectCard({
  projectId,
  name,
  client = "Altech",
  owner = "Ana Silva",
  status = "Em progresso",
  dueDate = "31/03/2026",
  description = "Projeto placeholder para o Altech Project.",
  className,
}: ProjectCardProps) {
  return (
    <Link to="/projects/$projectId" params={{ projectId }} className="block focus:outline-none">
      <WidgetCard
        hover
        className={cn(
          "flex h-full flex-col gap-3 focus-visible:ring-1 focus-visible:ring-ring",
          className,
        )}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 space-y-1">
            <code className="rounded bg-panel-elevated px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-primary">
              {projectId}
            </code>
            <h3 className="truncate text-base font-semibold text-foreground">{name}</h3>
          </div>
          <Badge variant="secondary" className="shrink-0">
            {status}
          </Badge>
        </div>

        <p className="line-clamp-2 text-sm text-muted-foreground">{description}</p>

        <dl className="mt-auto grid grid-cols-1 gap-1.5 pt-2 text-xs text-muted-foreground sm:grid-cols-3">
          <div className="flex items-center gap-1.5">
            <Building2 className="h-3.5 w-3.5" />
            <span className="truncate">{client}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <User className="h-3.5 w-3.5" />
            <span className="truncate">{owner}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5" />
            <span className="truncate">{dueDate}</span>
          </div>
        </dl>

        <div className="flex items-center justify-end text-xs font-medium text-primary">
          Abrir workspace <ChevronRight className="ml-0.5 h-3.5 w-3.5" />
        </div>
      </WidgetCard>
    </Link>
  );
}
