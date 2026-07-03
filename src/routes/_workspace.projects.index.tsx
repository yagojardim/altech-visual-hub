import { createFileRoute } from "@tanstack/react-router";
import { ProjectListPage } from "@/components/project/ProjectListPage";

export const Route = createFileRoute("/_workspace/projects/")({
  head: () => ({
    meta: [
      { title: "Projetos · Altech Project" },
      { name: "description", content: "Altech Project — consulte, filtre e crie projetos do workspace." },
      { property: "og:title", content: "Projetos · Altech Project" },
      { property: "og:description", content: "Altech Project — consulte, filtre e crie projetos do workspace." },
    ],
  }),
  component: ProjectListPage,
});
