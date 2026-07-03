import { ChevronRight, FolderKanban } from "lucide-react";
import { useCan } from "@/lib/auth";
import { UnauthorizedState, EmptyState } from "@/components/states";
import { ProjectCard } from "./ProjectCard";
import { ProjectToolbar } from "./ProjectToolbar";
import { CreateProjectModal } from "./CreateProjectModal";
import { MOCK_PROJECTS } from "@/lib/mock-projects";

export function ProjectListPage() {
  const canView = useCan("project.view");

  if (!canView) return <UnauthorizedState />;

  const projects = MOCK_PROJECTS;

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-1.5 text-xs uppercase tracking-wider text-muted-foreground"
        >
          <span>Workspace</span>
          <ChevronRight className="h-3 w-3" />
          <span className="text-foreground">Projetos</span>
        </nav>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0 space-y-1">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">Projetos</h1>
              <span className="inline-flex rounded-full border border-accent/30 bg-accent/15 px-2 py-0.5 text-[11px] text-accent">
                {projects.length} ativos
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              Consulte, filtre e crie novos projetos da Altech Project.
            </p>
          </div>
        </div>
      </header>

      <ProjectToolbar action={<CreateProjectModal />} />

      {projects.length === 0 ? (
        <EmptyState
          icon={<FolderKanban className="h-5 w-5" />}
          title="Nenhum projeto encontrado"
          description="Crie o primeiro projeto para começar a organizar o trabalho."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {projects.map((project) => (
            <ProjectCard key={project.projectId} {...project} />
          ))}
        </div>
      )}
    </div>
  );
}
