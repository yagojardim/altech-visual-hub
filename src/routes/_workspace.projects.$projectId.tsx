import { createFileRoute } from "@tanstack/react-router";
import { UnauthorizedState } from "@/components/states";
import { useCan } from "@/lib/auth";
import { ProjectPage } from "@/components/project/ProjectPage";

const VALID_TABS = ["overview", "dashboard", "backlog", "board", "sprints"] as const;
export type ProjectTab = (typeof VALID_TABS)[number];

export const Route = createFileRoute("/_workspace/projects/$projectId")({
  validateSearch: (search: Record<string, unknown>): { tab: ProjectTab } => {
    const raw = typeof search.tab === "string" ? search.tab : "overview";
    const tab = (VALID_TABS as readonly string[]).includes(raw) ? (raw as ProjectTab) : "overview";
    return { tab };
  },
  head: ({ params }) => ({
    meta: [{ title: `${params.projectId} · Altech Project` }],
  }),
  component: ProjectPageRoute,
});

function ProjectPageRoute() {
  const canView = useCan("project.view");
  const { projectId } = Route.useParams();

  if (!canView) return <UnauthorizedState />;

  return <ProjectPage key={projectId} projectId={projectId} />;
}
