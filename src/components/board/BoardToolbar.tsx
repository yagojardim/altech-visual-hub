import type { ReactNode } from "react";
import { WorkItemToolbar, WorkItemOrganization } from "@/components/work-item/WorkItemToolbar";
import { WorkItemActions } from "@/components/work-item/WorkItemActions";

export interface BoardToolbarProps {
  right?: ReactNode;
  actions?: ReactNode;
  organization?: ReactNode;
}

export function BoardToolbar({ right, actions, organization }: BoardToolbarProps) {
  return (
    <WorkItemToolbar
      actions={actions ?? <WorkItemActions />}
      organization={
        organization ?? (
          <div className="flex flex-wrap items-center gap-2">
            <WorkItemOrganization />
            {right}
          </div>
        )
      }
    />
  );
}
