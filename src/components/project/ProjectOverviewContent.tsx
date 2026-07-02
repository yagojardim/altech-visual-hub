import { ProjectOverviewGrid } from "./ProjectOverviewGrid";

export function ProjectOverviewContent({ projectId }: { projectId?: string } = {}) {
  return (
    <div className="space-y-6">
      <ProjectOverviewGrid projectId={projectId} />
    </div>
  );
}
