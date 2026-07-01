import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Can } from "@/components/Can";
import { useCan } from "@/lib/auth";
import { UnauthorizedState } from "@/components/states";
import { BoardContainer } from "@/components/board/BoardContainer";
import { type ViewKey } from "@/components/views/ViewSwitcher";
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
    <BoardContainer
      title="Boards"
      description="Container de boards do workspace. Estrutura preparada para múltiplas Views."
      boardActions={
        <Can permission="board.manage">
          <Button size="sm">
            <Plus className="mr-1.5 h-4 w-4" /> Novo board
          </Button>
        </Can>
      }
      viewTitle="Roadmap 2026"
      viewDescription="Board principal · view engine foundation"
      activeView={activeView}
      onViewChange={setActiveView}
      toolbarRight={
        <span className="text-[11px] text-muted-foreground">View ativa: {activeView}</span>
      }
    >
      {activeView === "kanban" && <KanbanViewPlaceholder />}
    </BoardContainer>
  );
}
