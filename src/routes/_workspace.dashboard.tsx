import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import {
  ArrowUpRight,
  KanbanSquare,
  FolderKanban,
  Users,
  Activity,
  Layers,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useWorkspace } from "@/lib/workspace";
import { Can } from "@/components/Can";
import { DashboardContainer } from "@/components/dashboard/DashboardContainer";
import { WidgetGrid } from "@/components/dashboard/WidgetGrid";
import { WidgetCard } from "@/components/dashboard/WidgetCard";
import { WidgetHeader } from "@/components/dashboard/WidgetHeader";
import { WidgetPlaceholder } from "@/components/dashboard/WidgetPlaceholder";

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
  const { current } = useWorkspace();

  return (
    <DashboardContainer>
      <header className="space-y-1">
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[11px] uppercase tracking-wider text-primary">
          <span className="h-1.5 w-1.5 rounded-full bg-primary" />
          {current ? `${current.name} · ${current.plan}` : "Workspace ativo"}
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">Bem-vindo, {user?.name}</h1>
        <p className="text-sm text-muted-foreground">
          Visão geral do seu workspace Altech. Use{" "}
          <kbd className="rounded border border-border bg-panel px-1 py-0.5 text-[10px] font-mono">
            ⌘K
          </kbd>{" "}
          para navegar.
        </p>
      </header>

      <WidgetGrid columns={4}>
        {STATS.map((s) => (
          <WidgetCard key={s.label}>
            <WidgetHeader
              title={s.label}
              icon={s.icon}
              action={<span className="text-2xl font-semibold">{s.value}</span>}
            />
            <p className="mt-3 text-[11px] text-muted-foreground">{s.hint}</p>
          </WidgetCard>
        ))}
      </WidgetGrid>

      <WidgetGrid columns={3}>
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
      </WidgetGrid>

      <WidgetGrid columns={3}>
        <WidgetPlaceholder title="Atividade" description="Atividade recente do workspace" icon={Activity} />
        <WidgetPlaceholder title="Performance" description="Métricas de performance" icon={Layers} />
        <WidgetPlaceholder title="Membros" description="Membros ativos no workspace" icon={Users} />
      </WidgetGrid>
    </DashboardContainer>
  );
}

function QuickCard({ title, description, href }: { title: string; description: string; href: string }) {
  return (
    <Link to={href}>
      <WidgetCard hover className="group h-full">
        <WidgetHeader
          title={title}
          description={description}
          action={
            <ArrowUpRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary" />
          }
        />
      </WidgetCard>
    </Link>
  );
}
