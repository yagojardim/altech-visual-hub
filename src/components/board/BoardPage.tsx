import { BoardHeader } from "./BoardHeader";
import { BoardToolbar } from "./BoardToolbar";
import { BoardContent } from "./BoardContent";

export function BoardPage({ projectId }: { projectId?: string } = {}) {
  return (
    <div className="space-y-4">
      <BoardHeader
        title="Board"
        description="Fluxo Kanban do projeto. Estrutura visual preparada para o MVP."
        projectId={projectId}
      />
      <BoardToolbar />
      <BoardContent projectId={projectId} />
    </div>
  );
}
