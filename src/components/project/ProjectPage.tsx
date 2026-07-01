import { useState } from "react";
import { BacklogPage } from "@/components/backlog/BacklogPage";
import { BoardPage } from "@/components/board/BoardPage";
import { ProjectHeader } from "./ProjectHeader";
import { ProjectNavigation } from "./ProjectNavigation";
import { ProjectOverview } from "./ProjectOverview";
import { ViewContainer } from "@/components/views/ViewContainer";

const TAB_LABELS: Record<string, string> = {
  backlog: "Backlog",
  board: "Board",
  sprints: "Sprints",
  dashboard: "Dashboard",
  settings: "Configurações",
};

export function ProjectPage({ projectId }: { projectId: string }) {
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <div className="space-y-6">
      <ProjectHeader projectId={projectId} />

      <ViewContainer header={<ProjectNavigation value={activeTab} onChange={setActiveTab} />}>
        {activeTab === "overview" && <ProjectOverview />}
        {activeTab === "backlog" && <BacklogPage projectId={projectId} />}
        {activeTab === "board" && <BoardPage projectId={projectId} />}
        {activeTab !== "overview" && activeTab !== "backlog" && activeTab !== "board" && (
          <div className="flex h-64 items-center justify-center rounded-lg border border-dashed border-border bg-panel/40">
            <p className="text-sm text-muted-foreground">{TAB_LABELS[activeTab]} em construção</p>
          </div>
        )}
      </ViewContainer>
    </div>
  );
}
