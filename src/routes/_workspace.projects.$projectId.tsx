import { createFileRoute } from "@tanstack/react-router";
import { UnauthorizedState } from "@/components/states";
import { useCan } from "@/lib/auth";
import { ProjectWorkspacePage } from "@/components/project/ProjectWorkspacePage";

export const Route = createFileRoute("/_workspace/projects/$projectId")({
  head: ({ params }) => ({
    meta: [{ title: `${params.projectId} · Altech Project` }],
  }),
  component: ProjectWorkspaceRoute,
});

function ProjectWorkspaceRoute() {
  const canView = useCan("project.view");
  const { projectId } = Route.useParams();

  if (!canView) return <UnauthorizedState />;

  return <ProjectWorkspacePage slug={projectId} />;
}
