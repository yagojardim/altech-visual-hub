import { BacklogHeader } from "./BacklogHeader";
import { BacklogToolbar } from "./BacklogToolbar";
import { BacklogContent } from "./BacklogContent";

export function BacklogPage({ projectId }: { projectId?: string } = {}) {
  return (
    <div className="space-y-4">
      <BacklogHeader projectId={projectId} />
      <BacklogToolbar />
      <BacklogContent projectId={projectId} />
    </div>
  );
}
