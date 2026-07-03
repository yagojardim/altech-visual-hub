import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  ChevronRight,
  FolderKanban,
  KanbanSquare,
  ListTodo,
  Timer,
  Building2,
  User,
  Calendar,
  SearchX,
  ArrowUpRight,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { WidgetCard } from "@/components/dashboard/WidgetCard";
import { WidgetGrid } from "@/components/dashboard/WidgetGrid";
import { WidgetHeader } from "@/components/dashboard/WidgetHeader";
import { LoadingState, ErrorState, EmptyState } from "@/components/states";
import { getProjectBySlug, type ProjectRow } from "@/lib/projects-api";
import { formatSupabaseError } from "@/lib/supabase-errors";
import { qk } from "@/lib/query-keys";

function fmtDate(s: string | null): string {
  if (!s) return "—";
  const [y, m, d] = s.split("-");
  if (!y || !m || !d) return s;
  return `${d}/${m}/${y}`;
}

function formatRange(start: string | null, end: string | null): string {
  const a = fmtDate(start);
  const b = fmtDate(end);
  if (start && end) return `${a} – ${b}`;
  return start ? a : end ? b : "—";
}

interface ProjectWorkspacePageProps {
  slug: string;
}

export function ProjectWorkspacePage({ slug }: ProjectWorkspacePageProps) {
  const {
    data: project,
    isLoading,
    error: queryError,
    refetch,
  } = useQuery({
    queryKey: ["projects", "bySlug", slug],
    queryFn: () => getProjectBySlug(slug),
  });

  const error = queryError ? formatSupabaseError(queryError, "Erro ao carregar projeto.") : null;

  if (isLoading) {
    return <LoadingState variant="skeleton" rows={3} />;
  }

  if (error) {
    return (
      <ErrorState
        title="Não foi possível carregar o projeto"
        description={error}
        onRetry={() => void refetch()}
      />
    );
  }

  if (!project) {
    return (
      <EmptyState
        icon={<SearchX className="h-5 w-5" />}
        title="Projeto não encontrado"
        description={`Não localizamos um projeto com o slug “${slug}”. Verifique o endereço ou volte para a lista.`}
        action={
          <Link
            to="/projects"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Voltar para Projetos
          </Link>
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      <ProjectWorkspaceHeader project={project} />
      <ProjectWorkspaceShortcuts slug={slug} />
    </div>
  );
}

function ProjectWorkspaceHeader({ project }: { project: ProjectRow }) {
  return (
    <header className="space-y-2">
      <nav
        aria-label="Breadcrumb"
        className="flex items-center gap-1.5 text-xs uppercase tracking-wider text-muted-foreground"
      >
        <Link to="/projects" className="hover:text-foreground">
          Projetos
        </Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-foreground">{project.nome}</span>
      </nav>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0 space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">{project.nome}</h1>
            <Badge variant="secondary">{project.status}</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            {project.descricao ?? "Workspace do projeto no Altech Project."}
          </p>
        </div>
      </div>

      <WidgetGrid columns={4}>
        <WidgetCard>
          <WidgetHeader
            title="Responsável"
            description="Gestor do projeto"
            icon={User}
            action={<span className="text-sm font-medium text-foreground">{project.responsavel ?? "—"}</span>}
          />
        </WidgetCard>
        <WidgetCard>
          <WidgetHeader
            title="Time"
            description="Time alocado"
            icon={Building2}
            action={<span className="text-sm font-medium text-foreground">{project.cliente ?? "—"}</span>}
          />
        </WidgetCard>
        <WidgetCard>
          <WidgetHeader
            title="Período"
            description="Duração do projeto"
            icon={Calendar}
            action={
              <span className="text-sm font-medium text-foreground">
                {formatRange(project.data_inicio, project.data_fim)}
              </span>
            }
          />
        </WidgetCard>
        <WidgetCard>
          <WidgetHeader
            title="Slug"
            description="Identificador único"
            icon={FolderKanban}
            action={<code className="text-sm font-medium text-foreground">{project.slug}</code>}
          />
        </WidgetCard>
      </WidgetGrid>
    </header>
  );
}

function ProjectWorkspaceShortcuts({ slug }: { slug: string }) {
  const links = [
    {
      to: "/boards",
      search: { project: slug } as const,
      label: "Boards",
      description: "Visualize o board deste projeto",
      icon: KanbanSquare,
    },
    {
      to: "/sprints",
      search: { project: slug } as const,
      label: "Sprints",
      description: "Acompanhe as sprints do projeto",
      icon: Timer,
    },
    {
      to: "/backlog",
      search: { project: slug } as const,
      label: "Backlog",
      description: "Fila de trabalho priorizada",
      icon: ListTodo,
    },
  ];

  return (
    <div className="space-y-3">
      <h2 className="text-sm font-medium text-foreground">Atalhos</h2>
      <WidgetGrid columns={3}>
        {links.map((link) => {
          const Icon = link.icon;
          return (
            <Link
              key={link.label}
              to={link.to}
              search={link.search}
              className="block focus:outline-none"
            >
              <WidgetCard
                hover
                className="flex h-full items-center justify-between gap-3 focus-visible:ring-1 focus-visible:ring-ring"
              >
                <WidgetHeader
                  title={link.label}
                  description={link.description}
                  icon={Icon}
                />
                <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground" />
              </WidgetCard>
            </Link>
          );
        })}
      </WidgetGrid>
    </div>
  );
}
