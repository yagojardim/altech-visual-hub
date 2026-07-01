import { ProjectDashboardHeader } from "./ProjectDashboardHeader";
import { ProjectDashboardContent } from "./ProjectDashboardContent";

export function ProjectDashboardPage({ projectId }: { projectId?: string } = {}) {
  return (
    <div className="space-y-4">
      <ProjectDashboardHeader projectId={projectId} />
      <ProjectDashboardContent />
    </div>
  );
}
