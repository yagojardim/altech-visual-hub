import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Filter, Plus, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Can } from "@/components/Can";
import { useCan } from "@/lib/auth";
import { UnauthorizedState } from "@/components/states";
import { ViewContainer } from "@/components/views/ViewContainer";
import { ViewHeader } from "@/components/views/ViewHeader";
import { ViewSwitcher, type ViewKey } from "@/components/views/ViewSwitcher";
import { KanbanViewPlaceholder } from "@/components/views/KanbanViewPlaceholder";

export const Route = createFileRoute("/_workspace/boards")({
  head: () => ({ meta: [{ title: "Boards · Altech" }] }),
  component: BoardsPage,
});

function BoardsPage() {
  const canView = useCan("board.view");
  const [activeView, setActiveView] = useState<ViewKey>("kanban");

  if (!canView) return <UnauthorizedState />;

  return (
    <div className="space-y-6">
      <header className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Boards</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Container de boards do workspace. Estrutura preparada para múltiplas Views.
          </p>
        </div>
        <Can permission="board.manage">
          <Button size="sm">
            <Plus className="mr-1.5 h-4 w-4" /> Novo board
          </Button>
        </Can>
      </header>

      <ViewContainer
        header={
          <ViewHeader
            title="Roadmap 2026"
            description="Board principal · view engine foundation"
            actions={<ViewSwitcher value={activeView} onChange={setActiveView} />}
          />
        }
        toolbar={
          <>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Button variant="ghost" size="sm" className="h-7 px-2 text-xs">
                <Filter className="mr-1 h-3.5 w-3.5" /> Filtros
              </Button>
              <Button variant="ghost" size="sm" className="h-7 px-2 text-xs">
                <SlidersHorizontal className="mr-1 h-3.5 w-3.5" /> Agrupar
              </Button>
            </div>
            <span className="text-[11px] text-muted-foreground">View ativa: {activeView}</span>
          </>
        }
      >
        {activeView === "kanban" && <KanbanViewPlaceholder />}
      </ViewContainer>
    </div>
  );
}
