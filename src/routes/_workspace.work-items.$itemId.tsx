import { createFileRoute } from "@tanstack/react-router";
import { CalendarClock, User2, Tag } from "lucide-react";
import { UnauthorizedState } from "@/components/states";
import { useCan } from "@/lib/auth";
import { Can } from "@/components/Can";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_workspace/work-items/$itemId")({
  head: ({ params }) => ({ meta: [{ title: `${params.itemId} · Work Item` }] }),
  component: WorkItemPage,
});

function WorkItemPage() {
  const canView = useCan("workitem.view");
  const { itemId } = Route.useParams();

  if (!canView) return <UnauthorizedState />;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
      <article className="space-y-6">
        <header className="space-y-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <code className="rounded bg-panel px-1.5 py-0.5 font-mono text-primary">{itemId}</code>
            <span>·</span>
            <span>Altech Core</span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Definir arquitetura de permissões
          </h1>
          <div className="flex items-center gap-2">
            <span className="inline-flex rounded-full border border-accent/30 bg-accent/15 px-2 py-0.5 text-[11px] text-accent">
              Em progresso
            </span>
            <span className="inline-flex rounded-full border border-border bg-panel px-2 py-0.5 text-[11px] text-muted-foreground">
              Prioridade média
            </span>
          </div>
        </header>

        <section className="space-y-2">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Descrição</h2>
          <div className="rounded-xl border border-border bg-panel p-5 text-sm leading-relaxed text-foreground/90">
            <p>
              Modelar o sistema de roles e permissões da plataforma Altech. Deve suportar
              <em> permission-driven UI </em> em todos os módulos e integrar com o Supabase
              usando policies RLS.
            </p>
            <p className="mt-3 text-muted-foreground">
              Este work item é a base para todos os módulos posteriores (Kanban, Sprint,
              Portal, Billing).
            </p>
          </div>
        </section>

        <Can permission="workitem.manage">
          <div className="flex gap-2">
            <Button size="sm">Atualizar status</Button>
            <Button variant="outline" size="sm">Adicionar comentário</Button>
          </div>
        </Can>
      </article>

      <aside className="space-y-3">
        <div className="rounded-xl border border-border bg-panel p-4">
          <h3 className="text-xs uppercase tracking-wider text-muted-foreground">Detalhes</h3>
          <ul className="mt-3 space-y-3 text-sm">
            <Detail icon={User2} label="Owner" value="Ana Silva" />
            <Detail icon={CalendarClock} label="Prazo" value="12 jul 2026" />
            <Detail icon={Tag} label="Tipo" value="Arquitetura" />
          </ul>
        </div>
      </aside>
    </div>
  );
}

function Detail({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <li className="flex items-center justify-between gap-3">
      <span className="flex items-center gap-2 text-xs text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </span>
      <span className="text-sm">{value}</span>
    </li>
  );
}
