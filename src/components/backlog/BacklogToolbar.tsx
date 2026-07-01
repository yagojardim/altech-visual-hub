import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { WorkItemToolbar, WorkItemOrganization } from "@/components/work-item/WorkItemToolbar";
import { WorkItemActions } from "@/components/work-item/WorkItemActions";
import { CreateWorkItemModal } from "@/components/work-item/CreateWorkItemModal";

export function BacklogToolbar() {
  return (
    <WorkItemToolbar
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <CreateWorkItemModal />
          <WorkItemActions />
        </div>
      }
      organization={
        <div className="flex flex-wrap items-center gap-2">
          <WorkItemOrganization />
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input type="text" placeholder="Pesquisar..." className="pl-9" disabled />
          </div>
        </div>
      }
    />
  );
}
