import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Archive, ChevronRight, FolderKanban, MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useCan } from "@/lib/auth";
import { UnauthorizedState, EmptyState, LoadingState, ErrorState } from "@/components/states";
import { ProjectCard } from "./ProjectCard";
import { ProjectToolbar } from "./ProjectToolbar";
import { CreateProjectModal } from "./CreateProjectModal";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { deleteProject, listProjects, updateProject, type ProjectRow } from "@/lib/projects-api";
import { formatSupabaseError } from "@/lib/supabase-errors";
import { qk } from "@/lib/query-keys";
import { useOrgPrefs } from "@/lib/use-org-prefs";
import type { OrgControlsValue } from "@/components/work-item/OrgControls";

type ProjectsPrefs = OrgControlsValue & {
  search: string;
  [k: string]: unknown;
}

const DEFAULT_PREFS: ProjectsPrefs = {
  filters: { status: [] as string[], cliente: [] as string[], responsavel: [] as string[] },
  sortBy: "nome",
  sortDir: "asc",
  groupBy: "none",
  search: "",
};

const SORT_OPTIONS = [
  { value: "nome", label: "Nome" },
  { value: "status", label: "Status" },
  { value: "data_inicio", label: "Início" },
  { value: "data_fim", label: "Fim" },
  { value: "created_at", label: "Criação" },
];

const GROUP_OPTIONS = [
  { value: "none", label: "Sem agrupamento" },
  { value: "status", label: "Status" },
  { value: "cliente", label: "Cliente" },
  { value: "responsavel", label: "Responsável" },
];

export function ProjectListPage() {
  const canView = useCan("project.view");
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<ProjectRow | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);

  const {
    data: projects,
    isLoading: loading,
    error: queryError,
    refetch,
  } = useQuery({
    queryKey: qk.projects(),
    queryFn: listProjects,
  });
  const error = queryError ? formatSupabaseError(queryError, "Erro ao carregar projetos.") : null;

  const [prefs, updatePrefs, resetPrefs] = useOrgPrefs<ProjectsPrefs>(
    "/projects",
    DEFAULT_PREFS,
  );

  const reload = () => {
    void queryClient.invalidateQueries({ queryKey: qk.projects() });
    void refetch();
  };

  const filterFields = useMemo(() => {
    const uniq = (k: keyof ProjectRow) =>
      Array.from(new Set((projects ?? []).map((p) => (p[k] as string | null) ?? "—"))).sort();
    return [
      {
        key: "status",
        label: "Status",
        options: uniq("status").map((v) => ({ value: v, label: v })),
      },
      {
        key: "cliente",
        label: "Cliente",
        options: uniq("cliente").map((v) => ({ value: v, label: v })),
      },
      {
        key: "responsavel",
        label: "Responsável",
        options: uniq("responsavel").map((v) => ({ value: v, label: v })),
      },
    ];
  }, [projects]);

  const visible = useMemo(() => {
    if (!projects) return [];
    const q = prefs.search.trim().toLowerCase();
    const filtered = projects.filter((p) => {
      if (q) {
        const hay = `${p.nome} ${p.cliente ?? ""} ${p.responsavel ?? ""} ${p.descricao ?? ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      for (const [key, values] of Object.entries(prefs.filters)) {
        if (!values || values.length === 0) continue;
        const v = (p[key as keyof ProjectRow] as string | null) ?? "—";
        if (!values.includes(v)) return false;
      }
      return true;
    });
    const dir = prefs.sortDir === "desc" ? -1 : 1;
    filtered.sort((a, b) => {
      const av = (a[prefs.sortBy as keyof ProjectRow] as string | null) ?? "";
      const bv = (b[prefs.sortBy as keyof ProjectRow] as string | null) ?? "";
      return av.localeCompare(bv, "pt-BR", { numeric: true }) * dir;
    });
    return filtered;
  }, [projects, prefs]);

  const grouped = useMemo(() => {
    if (prefs.groupBy === "none") return [{ key: "", label: "", items: visible }];
    const map = new Map<string, ProjectRow[]>();
    for (const p of visible) {
      const key = ((p[prefs.groupBy as keyof ProjectRow] as string | null) ?? "—") || "—";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(p);
    }
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b, "pt-BR"))
      .map(([key, items]) => ({ key, label: key, items }));
  }, [visible, prefs.groupBy]);

  const count = visible.length;
  const activeCount = projects?.filter((p) => p.status !== "Arquivado").length ?? 0;

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
                {activeCount} {activeCount === 1 ? "ativo" : "ativos"}
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
        search={prefs.search}
        onSearchChange={(v) => updatePrefs({ search: v })}
        org={prefs}
        onOrgChange={(patch) => updatePrefs(patch as Partial<ProjectsPrefs>)}
        onRefresh={reload}
        onReset={resetPrefs}
        filterFields={filterFields}
        sortOptions={SORT_OPTIONS}
        groupOptions={GROUP_OPTIONS}
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
          onRetry={reload}
        />
      ) : !projects || projects.length === 0 ? (
        <>
          <EmptyState
            icon={<FolderKanban className="h-5 w-5" />}
            title="Nada por aqui ainda"
            description="Crie seu primeiro projeto para começar."
            action={
              <Button size="sm" variant="cta" onClick={() => setCreateOpen(true)}>
                <Plus className="mr-1.5 h-4 w-4" />
                Novo Projeto
              </Button>
            }
          />
          <CreateProjectModal
            trigger={null}
            open={createOpen}
            onOpenChange={setCreateOpen}
            onSaved={(p) => {
              toast.success(`Projeto “${p.nome}” criado.`);
              reload();
            }}
          />
        </>
      ) : count === 0 ? (
        <EmptyState
          icon={<FolderKanban className="h-5 w-5" />}
          title="Nenhum projeto corresponde aos filtros"
          description="Ajuste os filtros ou limpe a busca para ver mais resultados."
        />
      ) : (
        <div className="space-y-6">
          {grouped.map((g) => (
            <section key={g.key || "all"} className="space-y-3">
              {g.label && (
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-medium text-foreground">{g.label}</h2>
                  <span className="rounded-full bg-panel px-2 py-0.5 text-[11px] text-muted-foreground">
                    {g.items.length}
                  </span>
                </div>
              )}
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {g.items.map((p) => (
                  <div key={p.id} className="relative group">
                    <ProjectCard
                      projectId={p.slug}
                      name={p.nome}
                      client={p.cliente ?? "—"}
                      owner={p.responsavel ?? "—"}
                      status={p.status}
                      dueDate={formatRange(p.data_inicio, p.data_fim)}
                      description={p.descricao ?? "Projeto do workspace Altech."}
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
            </section>
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
