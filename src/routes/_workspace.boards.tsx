import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { KanbanSquare, ChevronRight, Search } from "lucide-react";
import { z } from "zod";

import { useCan } from "@/lib/auth";
import { UnauthorizedState, LoadingState, EmptyState, ErrorState } from "@/components/states";
import { Chip } from "@/components/ui/chip";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { listBoards, listBoardCounts } from "@/lib/boards-api";
import { listProjects } from "@/lib/projects-api";
import { qk } from "@/lib/query-keys";
import { formatSupabaseError } from "@/lib/supabase-errors";

const searchSchema = z.object({
  project: z.string().optional(),
});

type TabKey = "all" | "active" | "archived";

const TABS: { key: TabKey; label: string }[] = [
  { key: "all", label: "Todos" },
  { key: "active", label: "Ativos" },
  { key: "archived", label: "Arquivados" },
];

export const Route = createFileRoute("/_workspace/boards")({
  head: () => ({ meta: [{ title: "Boards · Altech Project" }] }),
  validateSearch: (search) => searchSchema.parse(search),

  component: BoardsPage,
});

function timeAgo(iso?: string | null): string {
  if (!iso) return "—";
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "—";
  const days = Math.max(0, Math.floor((Date.now() - then) / 86_400_000));
  if (days < 1) return "hoje";
  if (days < 30) return `há ${days} dia${days > 1 ? "s" : ""}`;
  const months = Math.floor(days / 30);
  if (months < 12) return `há ${months} mês${months > 1 ? "es" : ""}`;
  const years = Math.floor(months / 12);
  return `há ${years} ano${years > 1 ? "s" : ""}`;
}

function plural(n: number, one: string, many: string) {
  return `${n} ${n === 1 ? one : many}`;
}

function BoardActivityBars({ archived }: { archived: boolean }) {
  const heights = ["40%", "70%", "100%", "60%", "80%"];
  return (
    <span
      className="hidden h-5 shrink-0 items-end gap-0.5 sm:inline-flex"
      aria-hidden="true"
    >
      {heights.map((h, i) => (
        <span
          key={i}
          className={cn(
            "w-1 rounded-full",
            archived ? "bg-muted-foreground/25" : "bg-primary",
          )}
          style={{ height: h }}
        />
      ))}
    </span>
  );
}

function BoardsPage() {
  const canView = useCan("board.view");
  const { project: projectFilter } = Route.useSearch();
  const { location } = useRouterState();
  const isBoardsIndex = location.pathname === "/boards";

  const [term, setTerm] = useState("");
  const [tab, setTab] = useState<TabKey>("all");

  const projectsQ = useQuery({ queryKey: qk.projects(), queryFn: listProjects });
  const boardsQ = useQuery({ queryKey: ["boards", "all"], queryFn: listBoards });
  const countsQ = useQuery({ queryKey: ["boards", "counts"], queryFn: listBoardCounts });

  const projectById = useMemo(() => {
    const m = new Map<string, { nome: string; slug: string; status: string }>();
    for (const p of projectsQ.data ?? [])
      m.set(p.id, { nome: p.nome, slug: p.slug, status: p.status });
    return m;
  }, [projectsQ.data]);

  const projectBySlug = useMemo(() => {
    const m = new Map<string, string>();
    for (const p of projectsQ.data ?? []) m.set(p.slug, p.id);
    return m;
  }, [projectsQ.data]);

  /** Boards no escopo (respeita ?project= quando informado). */
  const scoped = useMemo(() => {
    const boards = boardsQ.data ?? [];
    if (!projectFilter || projectFilter === "all") return boards;
    const pid = projectBySlug.get(projectFilter) ?? projectFilter;
    return boards.filter((b) => b.project_id === pid);
  }, [boardsQ.data, projectFilter, projectBySlug]);

  const isArchived = (projectId: string | null) =>
    (projectId ? projectById.get(projectId)?.status : undefined) === "Arquivado";

  const summary = useMemo(() => {
    const archived = scoped.filter((b) => isArchived(b.project_id)).length;
    return { total: scoped.length, archived, active: scoped.length - archived };
  }, [scoped, projectById]);

  const filtered = useMemo(() => {
    const q = term.trim().toLowerCase();
    return scoped.filter((b) => {
      const proj = b.project_id ? projectById.get(b.project_id) : undefined;
      const archived = isArchived(b.project_id);
      if (tab === "active" && archived) return false;
      if (tab === "archived" && !archived) return false;
      if (!q) return true;
      return (
        b.name.toLowerCase().includes(q) ||
        (proj?.nome ?? "").toLowerCase().includes(q) ||
        (proj?.slug ?? "").toLowerCase().includes(q)
      );
    });
  }, [scoped, term, tab, projectById]);

  const groups = useMemo(() => {
    const map = new Map<string, { label: string; boards: typeof filtered }>();
    for (const b of filtered) {
      const key = b.project_id ?? "none";
      const label = (b.project_id ? projectById.get(b.project_id)?.nome : null) ?? "Sem projeto";
      const entry = map.get(key) ?? { label, boards: [] as typeof filtered };
      entry.boards.push(b);
      map.set(key, entry);
    }
    return [...map.entries()].sort((a, b) => a[1].label.localeCompare(b[1].label));
  }, [filtered, projectById]);

  if (!canView) return <UnauthorizedState />;
  if (!isBoardsIndex) return <Outlet />;

  const loading = boardsQ.isLoading || projectsQ.isLoading;
  const error = boardsQ.error
    ? formatSupabaseError(boardsQ.error, "Erro ao carregar boards.")
    : null;

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-1.5 text-xs uppercase tracking-wider text-muted-foreground"
        >
          <span>Workspace</span>
          <ChevronRight className="h-3 w-3" />
          <span className="text-foreground">Boards</span>
        </nav>
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">Boards</h1>
        <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
          <span>{plural(summary.total, "board no escopo", "boards no escopo")}</span>
          <span aria-hidden>·</span>
          <span className="inline-flex items-center gap-1.5 text-[color:var(--healthy,var(--primary))]">
            <span className="h-1.5 w-1.5 rounded-full bg-current" />
            {plural(summary.active, "ativo", "ativos")}
          </span>
          <span aria-hidden>·</span>
          <span>{plural(summary.archived, "arquivado", "arquivados")}</span>
        </p>
      </header>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative w-full sm:max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="Buscar board ou projeto..."
            aria-label="Buscar board ou projeto"
            className="pl-9"
          />
        </div>
        <div role="tablist" aria-label="Filtro de boards" className="flex items-center gap-2">
          {TABS.map((t) => (
            <button
              key={t.key}
              role="tab"
              type="button"
              aria-selected={tab === t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                "rounded-full border px-4 py-1.5 text-sm transition-colors",
                tab === t.key
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-panel text-muted-foreground hover:text-foreground",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <LoadingState variant="skeleton" />
      ) : error ? (
        <ErrorState
          title="Não foi possível carregar os boards"
          description={error}
          onRetry={() => void boardsQ.refetch()}
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<KanbanSquare className="h-5 w-5" />}
          title="Nenhum board por aqui"
          description={
            term || tab !== "all"
              ? "Nenhum board corresponde à busca ou ao filtro selecionado."
              : "Ainda não existem boards cadastrados."
          }
        />
      ) : (
        <div className="space-y-6">
          {groups.map(([key, group]) => (
            <section key={key} className="space-y-2">
              <h2 className="flex items-center gap-2 text-xs font-semibold tracking-wider text-foreground">
                <span className="h-2 w-2 rounded-full bg-primary" />
                <span className="uppercase">{group.label}</span>
                <span className="font-normal normal-case text-muted-foreground">
                  — {plural(group.boards.length, "board", "boards")}
                </span>
              </h2>

              <div className="space-y-2">
                {group.boards.map((b) => {
                  const proj = b.project_id ? projectById.get(b.project_id) : undefined;
                  const archived = isArchived(b.project_id);
                  const counts = countsQ.data?.[b.id];
                  return (
                    <Link
                      key={b.id}
                      to="/boards/$boardId"
                      params={{ boardId: b.id }}
                      className={cn(
                        "flex items-center gap-3 rounded-lg border border-border bg-panel px-3 py-3 transition-colors hover:border-primary/50 hover:bg-panel-elevated focus:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                        archived && "opacity-60",
                      )}
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-panel-elevated text-primary">
                        <KanbanSquare className="h-4 w-4" />
                      </span>

                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="truncate text-sm font-semibold text-foreground">
                            {b.name}
                          </h3>
                          {archived && (
                            <Chip label="ARQUIVADO" variant="default" size="xs" className="shrink-0" />
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                          <span className="inline-flex items-center gap-1.5">
                            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                            {proj?.nome ?? "Sem projeto"}
                          </span>
                          <span>{plural(counts?.columns ?? 0, "coluna", "colunas")}</span>
                          <span>{plural(counts?.items ?? 0, "item", "itens")}</span>
                        </div>
                      </div>

                      <BoardActivityBars archived={archived} />

                      <span className="hidden shrink-0 text-xs text-muted-foreground sm:block">
                        {timeAgo(b.created_at)}
                      </span>
                      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                    </Link>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
