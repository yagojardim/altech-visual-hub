import { useEffect, useMemo, useState } from "react";
import { ChevronRight, FolderKanban, Pencil } from "lucide-react";
import { toast } from "sonner";
import { useCan } from "@/lib/auth";
import { UnauthorizedState, EmptyState, LoadingState, ErrorState } from "@/components/states";
import { ProjectCard } from "./ProjectCard";
import { ProjectToolbar } from "./ProjectToolbar";
import { CreateProjectModal } from "./CreateProjectModal";
import { Button } from "@/components/ui/button";
import { listProjects, type ProjectRow } from "@/lib/projects-api";

export function ProjectListPage() {
  const canView = useCan("project.view");
  const [projects, setProjects] = useState<ProjectRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<ProjectRow | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);
    listProjects()
      .then((rows) => {
        if (!alive) return;
        setProjects(rows);
      })
      .catch((err: unknown) => {
        if (!alive) return;
        const msg = err instanceof Error ? err.message : String(err);
        setError(msg);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [reloadKey]);

  const reload = () => setReloadKey((k) => k + 1);

  const count = useMemo(() => projects?.length ?? 0, [projects]);

  if (!canView) return <UnauthorizedState />;

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
              {!loading && !error && (
                <span className="inline-flex rounded-full border border-accent/30 bg-accent/15 px-2 py-0.5 text-[11px] text-accent">
                  {count} ativos
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              Consulte, filtre e crie novos projetos do Altech Project.
            </p>
          </div>
        </div>
      </header>

      <ProjectToolbar
        action={
          <CreateProjectModal
            onSaved={(p) => {
              toast.success(`Projeto “${p.nome}” criado.`);
              reload();
            }}
          />
        }
      />

      {loading ? (
        <LoadingState variant="skeleton" />
      ) : error ? (
        <ErrorState
          title="Não foi possível carregar os projetos"
          description={error}
          action={
            <Button variant="outline" size="sm" onClick={reload}>
              Tentar novamente
            </Button>
          }
        />
      ) : !projects || projects.length === 0 ? (
        <EmptyState
          icon={<FolderKanban className="h-5 w-5" />}
          title="Nenhum projeto encontrado"
          description="Crie o primeiro projeto para começar a organizar o trabalho."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {projects.map((p) => (
            <div key={p.id} className="relative group">
              <ProjectCard
                projectId={p.slug}
                name={p.nome}
                client={p.cliente ?? "—"}
                owner={p.responsavel ?? "—"}
                status={p.status}
                dueDate={formatRange(p.data_inicio, p.data_fim)}
                description={p.descricao ?? "Projeto do workspace Altech Project."}
              />
              <Button
                size="icon"
                variant="ghost"
                aria-label={`Editar ${p.nome}`}
                className="absolute right-2 top-2 h-7 w-7 opacity-0 transition group-hover:opacity-100 focus:opacity-100"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setEditing(p);
                  setEditOpen(true);
                }}
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <CreateProjectModal
        trigger={null}
        mode="edit"
        project={editing}
        open={editOpen}
        onOpenChange={setEditOpen}
        onSaved={() => {
          reload();
        }}
      />
    </div>
  );
}

function formatRange(start: string | null, end: string | null): string {
  const fmt = (s: string | null) => {
    if (!s) return null;
    const [y, m, d] = s.split("-");
    if (!y || !m || !d) return s;
    return `${d}/${m}/${y}`;
  };
  const a = fmt(start);
  const b = fmt(end);
  if (a && b) return `${a} – ${b}`;
  return a ?? b ?? "—";
}
