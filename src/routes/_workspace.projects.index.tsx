import { createFileRoute } from "@tanstack/react-router";
import { ProjectListPage } from "@/components/project/ProjectListPage";

export const Route = createFileRoute("/_workspace/projects/")({
  head: () => ({
    meta: [{ title: "Projetos · Altech Project" }],
  }),
  component: ProjectListPage,
});
