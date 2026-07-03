import { createFileRoute } from "@tanstack/react-router";
import { SprintsWorkspace } from "@/components/sprint/SprintsWorkspace";

export const Route = createFileRoute("/_workspace/sprints")({
  head: () => ({
    meta: [{ title: "Sprints · Altech Project" }],
  }),
  component: SprintsIndex,
});

function SprintsIndex() {
  return <SprintsWorkspace />;
}
