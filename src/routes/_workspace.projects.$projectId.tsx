import { createFileRoute, Link } from "@tanstack/react-router";
import { Calendar, GitBranch, Users } from "lucide-react";
import { UnauthorizedState } from "@/components/states";
import { useCan } from "@/lib/auth";
import { Can } from "@/components/Can";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_workspace/projects/$projectId")({
  head: ({ params }) => ({
    meta: [{ title: `${params.projectId} · Projeto Altech` }],
  }),
  component: ProjectOverviewPage,
});

const WORK_ITEMS = [
  { id: "WI-101", title: "Definir arquitetura de permissões", status: "Em progresso", owner: "Ana" },
  { id: "WI-102", title: "Implementar Command Palette", status: "Concluído", owner: "Bruno" },
  { id: "WI-103", title: "Wireframes do Board Container", status: "Aberto", owner: "Clara" },
];

const STATUS_STYLES: Record<string, string> = {
  "Em progresso": "bg-accent/15 text-accent border-accent/30",
  Concluído: "bg-primary/15 text-primary border-primary/30",
  Aberto: "bg-warning/15 text-warning border-warning/30",
};

function ProjectOverviewPage() {
  const canView = useCan("project.view");
  const { projectId } = Route.useParams();

  if (!canView) return <UnauthorizedState />;

  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
          <span>Projeto</span>
          <span>·</span>
          <code className="rounded bg-panel px-1.5 py-0.5 font-mono text-primary">{projectId}</code>
        </div>
        <div className="flex items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Altech Core</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Projeto principal da plataforma. Overview e work items base.
            </p>
          </div>
          <Can permission="project.manage">
            <Button variant="outline" size="sm">Configurar</Button>
          </Can>
        </div>

        <div className="flex flex-wrap gap-2 pt-2">
          <Meta icon={Calendar} label="Sprint 3 · 12 dias" />
          <Meta icon={Users} label="8 colaboradores" />
          <Meta icon={GitBranch} label="main" />
        </div>
      </header>

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Work items</h2>
        <div className="overflow-hidden rounded-xl border border-border bg-panel">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-panel-elevated/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">ID</th>
                <th className="px-4 py-3 font-medium">Título</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Owner</th>
              </tr>
            </thead>
            <tbody>
              {WORK_ITEMS.map((wi) => (
                <tr key={wi.id} className="border-b border-border last:border-0 hover:bg-panel-elevated/40">
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                    <Link to="/work-items/$itemId" params={{ itemId: wi.id }} className="hover:text-primary">
                      {wi.id}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <Link to="/work-items/$itemId" params={{ itemId: wi.id }} className="hover:text-primary">
                      {wi.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] ${STATUS_STYLES[wi.status]}`}>
                      {wi.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{wi.owner}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function Meta({ icon: Icon, label }: { icon: React.ComponentType<{ className?: string }>; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-md border border-border bg-panel px-2.5 py-1 text-xs text-muted-foreground">
      <Icon className="h-3.5 w-3.5" />
      {label}
    </span>
  );
}
