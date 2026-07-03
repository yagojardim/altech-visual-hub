import { useNavigate } from "@tanstack/react-router";
import { BacklogPage } from "@/components/backlog/BacklogPage";
import { BoardPage } from "@/components/board/BoardPage";
import { SprintsWorkspace } from "@/components/sprint/SprintsWorkspace";
import { ProjectDashboardPage } from "./ProjectDashboardPage";
import { ProjectHeader } from "./ProjectHeader";
import { ProjectNavigation } from "./ProjectNavigation";
import { ProjectOverviewPage } from "./ProjectOverviewPage";
import { ViewContainer } from "@/components/views/ViewContainer";
import { Route as ProjectRoute } from "@/routes/_workspace.projects.$projectId";


const TAB_LABELS: Record<string, string> = {
  backlog: "Backlog",
  board: "Board",
  sprints: "Sprints",
  dashboard: "Dashboard",
  settings: "Configurações",
};

export function ProjectPage({ projectId }: { projectId: string }) {
  const { tab: activeTab } = ProjectRoute.useSearch();
  const navigate = useNavigate({ from: ProjectRoute.fullPath });

  const setActiveTab = (next: string) => {
    navigate({
      search: { tab: next as typeof activeTab },
      replace: false,
      resetScroll: false,
    });
  };

  return (
    <div className="space-y-6">
      <ProjectHeader projectId={projectId} />

      <ViewContainer header={<ProjectNavigation value={activeTab} onChange={setActiveTab} />}>
        {activeTab === "overview" && <ProjectOverviewPage projectId={projectId} />}
        {activeTab === "backlog" && <BacklogPage projectId={projectId} />}
        {activeTab === "board" && <BoardPage projectId={projectId} />}
        {activeTab === "sprints" && <SprintsWorkspace projectSlug={projectId} hideHeader />}
        {activeTab === "dashboard" && <ProjectDashboardPage projectId={projectId} />}
        {activeTab !== "overview" &&
          activeTab !== "backlog" &&
          activeTab !== "board" &&
          activeTab !== "sprints" &&
          activeTab !== "dashboard" && (
            <div className="flex h-64 items-center justify-center rounded-lg border border-dashed border-border bg-panel/40">
              <p className="text-sm text-muted-foreground">{TAB_LABELS[activeTab]} em construção</p>
            </div>
          )}
      </ViewContainer>
    </div>
  );
}
