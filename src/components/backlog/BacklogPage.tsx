import { BacklogHeader } from "./BacklogHeader";
import { LiveBacklog } from "./LiveBacklog";

export function BacklogPage({ projectId }: { projectId?: string } = {}) {
  return (
    <div className="space-y-4">
      <BacklogHeader projectId={projectId} />
      {projectId ? (
        <LiveBacklog projectId={projectId} />
      ) : (
        <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          Selecione um projeto para ver o backlog.
        </div>
      )}
    </div>
  );
}
