import type { ReactNode } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  WorkItemToolbar,
  WorkItemOrganization,
} from "@/components/work-item/WorkItemToolbar";

export interface ProjectToolbarProps {
  action?: ReactNode;
}

/**
 * Action bar for the projects list. Reuses the shared WorkItemToolbar shell
 * so Projects, Backlog and Board share the same look-and-feel. All controls
 * are placeholders.
 */
export function ProjectToolbar({ action }: ProjectToolbarProps) {
  return (
    <WorkItemToolbar
      actions={<div className="flex flex-wrap items-center gap-2">{action}</div>}
      organization={
        <div className="flex flex-wrap items-center gap-2">
          <WorkItemOrganization />
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Pesquisar projetos..."
              className="pl-9"
              disabled
            />
          </div>
        </div>
      }
    />
  );
}
