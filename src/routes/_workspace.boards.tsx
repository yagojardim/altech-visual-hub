import { createFileRoute, Link } from "@tanstack/react-router";
import { KanbanSquare, Plus } from "lucide-react";
import { EmptyState } from "@/components/states";
import { Button } from "@/components/ui/button";
import { Can } from "@/components/Can";
import { useCan } from "@/lib/auth";
import { UnauthorizedState } from "@/components/states";

export const Route = createFileRoute("/_workspace/boards")({
  head: () => ({ meta: [{ title: "Boards · Altech" }] }),
  component: BoardsPage,
});

const BOARDS = [
  { id: "b1", name: "Roadmap 2026", items: 42, color: "from-accent to-primary" },
  { id: "b2", name: "Discovery Backlog", items: 18, color: "from-primary to-warning" },
  { id: "b3", name: "Bug Tracker", items: 24, color: "from-warning to-accent" },
];

function BoardsPage() {
  const canView = useCan("board.view");
  if (!canView) return <UnauthorizedState />;

  return (
    <div className="space-y-6">
      <header className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Boards</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Container de boards do workspace. A visualização kanban virá em uma etapa futura.
          </p>
        </div>
        <Can permission="board.manage">
          <Button size="sm">
            <Plus className="mr-1.5 h-4 w-4" /> Novo board
          </Button>
        </Can>
      </header>

      {BOARDS.length === 0 ? (
        <EmptyState
          title="Nenhum board ainda"
          description="Crie seu primeiro board para organizar work items."
          icon={<KanbanSquare className="h-5 w-5" />}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {BOARDS.map((b) => (
            <Link
              key={b.id}
              to="/projects/altech-core"
              className="group overflow-hidden rounded-xl border border-border bg-panel transition-all hover:border-primary/40"
            >
              <div className={`h-24 bg-gradient-to-br ${b.color} opacity-80`} />
              <div className="p-4">
                <div className="flex items-center gap-2">
                  <KanbanSquare className="h-4 w-4 text-primary" />
                  <h3 className="text-sm font-medium">{b.name}</h3>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">{b.items} work items</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
