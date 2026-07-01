import { createFileRoute } from "@tanstack/react-router";
import { UnauthorizedState } from "@/components/states";
import { useCan } from "@/lib/auth";
import { ProjectPage } from "@/components/project/ProjectPage";

export const Route = createFileRoute("/_workspace/projects/$projectId")({
  head: ({ params }) => ({
    meta: [{ title: `${params.projectId} · Projeto Altech` }],
  }),
  component: ProjectPageRoute,
});

function ProjectPageRoute() {
  const canView = useCan("project.view");
  const { projectId } = Route.useParams();

  if (!canView) return <UnauthorizedState />;

  return <ProjectPage projectId={projectId} />;
}
