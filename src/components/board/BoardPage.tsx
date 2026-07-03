import { BoardHeader } from "./BoardHeader";
import { BoardToolbar } from "./BoardToolbar";
import { BoardContent } from "./BoardContent";
import { KanbanBoard } from "./KanbanBoard";

export function BoardPage({ projectId }: { projectId?: string } = {}) {
  return (
    <div className="space-y-4">
      <BoardHeader
        title="Board"
        description="Fluxo Kanban do projeto — dados ao vivo do Supabase."
        projectId={projectId}
      />
      <BoardToolbar />
      {projectId ? <KanbanBoard projectId={projectId} /> : <BoardContent projectId={projectId} />}
    </div>
  );
}
