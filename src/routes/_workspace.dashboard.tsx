import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { ArrowUpRight, KanbanSquare, FolderKanban, Users, Activity } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useWorkspace } from "@/lib/workspace";
import { Can } from "@/components/Can";

export const Route = createFileRoute("/_workspace/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard · Altech" }] }),
  component: DashboardPage,
});

const STATS = [
  { label: "Boards ativos", value: "4", icon: KanbanSquare, hint: "+1 esta semana" },
  { label: "Projetos", value: "12", icon: FolderKanban, hint: "3 em andamento" },
  { label: "Membros", value: "28", icon: Users, hint: "workspace" },
  { label: "Work items", value: "146", icon: Activity, hint: "24 abertos" },
];

function DashboardPage() {
  const { user } = useAuth();

  return (
    <div className="space-y-8">
      <header className="space-y-1">
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[11px] uppercase tracking-wider text-primary">
          <span className="h-1.5 w-1.5 rounded-full bg-primary" />
          Workspace ativo
        </div>
        <h1 className="text-3xl font-semibold tracking-tight">Bem-vindo, {user?.name}</h1>
        <p className="text-sm text-muted-foreground">
          Visão geral do seu workspace Altech. Use <kbd className="rounded border border-border bg-panel px-1 py-0.5 text-[10px] font-mono">⌘K</kbd> para navegar.
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {STATS.map((s) => (
          <div key={s.label} className="rounded-xl border border-border bg-panel p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">{s.label}</span>
              <s.icon className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="mt-3 text-2xl font-semibold">{s.value}</div>
            <div className="mt-1 text-[11px] text-muted-foreground">{s.hint}</div>
          </div>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <Can permission="board.view">
          <QuickCard
            title="Boards"
            description="Container de boards do workspace. Kanban virá depois."
            href="/boards"
          />
        </Can>
        <Can permission="project.view">
          <QuickCard
            title="Projeto Altech Core"
            description="Overview do projeto principal e seus work items."
            href="/projects/altech-core"
          />
        </Can>
        <Can permission="workitem.view">
          <QuickCard
            title="Work Item WI-101"
            description="Exemplo de work item base para explorar a estrutura."
            href="/work-items/WI-101"
          />
        </Can>
      </section>
    </div>
  );
}

function QuickCard({ title, description, href }: { title: string; description: string; href: string }) {
  return (
    <Link
      to={href}
      className="group relative rounded-xl border border-border bg-panel p-5 transition-all hover:border-primary/40 hover:bg-panel-elevated"
    >
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-sm font-medium">{title}</h3>
          <p className="mt-1 text-xs text-muted-foreground">{description}</p>
        </div>
        <ArrowUpRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary" />
      </div>
    </Link>
  );
}
