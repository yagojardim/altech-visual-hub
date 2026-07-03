import type { ReactNode } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { WorkItemToolbar } from "@/components/work-item/WorkItemToolbar";
import { OrgControls, type OrgControlsValue } from "@/components/work-item/OrgControls";
import type { OrgFilterField, OrgOption } from "@/components/work-item/OrgControls";

export interface ProjectToolbarProps {
  action?: ReactNode;
  search: string;
  onSearchChange: (v: string) => void;
  org: OrgControlsValue;
  onOrgChange: (patch: Partial<OrgControlsValue>) => void;
  onRefresh: () => void;
  onReset: () => void;
  filterFields: OrgFilterField[];
  sortOptions: OrgOption[];
  groupOptions: OrgOption[];
}

/**
 * Action bar for the projects list. Filter / Sort / Group / Search are live
 * and persisted via useOrgPrefs.
 */
export function ProjectToolbar({
  action,
  search,
  onSearchChange,
  org,
  onOrgChange,
  onRefresh,
  onReset,
  filterFields,
  sortOptions,
  groupOptions,
}: ProjectToolbarProps) {
  return (
    <WorkItemToolbar
      actions={<div className="flex flex-wrap items-center gap-2">{action}</div>}
      organization={
        <div className="flex flex-wrap items-center gap-2">
          <OrgControls
            value={org}
            onChange={onOrgChange}
            filterFields={filterFields}
            sortOptions={sortOptions}
            groupOptions={groupOptions}
            onRefresh={onRefresh}
            onReset={onReset}
          />
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Buscar por nome ou slug..."
              className="pl-9"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>
        </div>
      }
    />
  );
}
