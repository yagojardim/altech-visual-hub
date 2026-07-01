import { ProjectOverviewHeader } from "./ProjectOverviewHeader";
import { ProjectOverviewContent } from "./ProjectOverviewContent";

export function ProjectOverviewPage({ projectId }: { projectId?: string } = {}) {
  return (
    <div className="space-y-4">
      <ProjectOverviewHeader projectId={projectId} />
      <ProjectOverviewContent />
    </div>
  );
}
