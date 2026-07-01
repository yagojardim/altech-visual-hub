import { useState } from "react";
import { LayoutDashboard, ClipboardList, KanbanSquare } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { SprintHeader } from "./SprintHeader";
import { SprintToolbar } from "./SprintToolbar";
import { SprintOverview } from "./SprintOverview";
import { SprintPlanningPanel } from "./SprintPlanningPanel";
import { SprintBoard } from "./SprintBoard";

const SPRINT_TABS = [
  { key: "overview", label: "Visão Geral", icon: LayoutDashboard },
  { key: "planning", label: "Planejamento", icon: ClipboardList },
  { key: "board", label: "Sprint Board", icon: KanbanSquare },
] as const;

/**
 * Sprint Workspace — orchestrates the Sprint experience within a project.
 * Reuses ProjectHeader-style header, WorkItemToolbar action bar and Tabs.
 */
export function SprintPage({ projectId }: { projectId?: string } = {}) {
  const [tab, setTab] = useState<(typeof SPRINT_TABS)[number]["key"]>("overview");

  return (
    <div className="space-y-6">
      <SprintHeader projectId={projectId} />

      <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
        <TabsList className="h-auto w-full justify-start overflow-x-auto rounded-none border-b border-border bg-transparent p-0">
          {SPRINT_TABS.map((t) => {
            const Icon = t.icon;
            const active = t.key === tab;
            return (
              <TabsTrigger
                key={t.key}
                value={t.key}
                className={cn(
                  "gap-2 rounded-none border-b-2 border-transparent px-3 py-2.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring data-[state=active]:bg-transparent data-[state=active]:shadow-none",
                  active
                    ? "border-primary text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{t.label}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>
      </Tabs>

      <SprintToolbar />

      {tab === "overview" && <SprintOverview />}
      {tab === "planning" && <SprintPlanningPanel />}
      {tab === "board" && <SprintBoard />}
    </div>
  );
}
