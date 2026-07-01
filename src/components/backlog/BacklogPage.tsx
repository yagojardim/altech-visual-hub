import { BacklogHeader } from "./BacklogHeader";
import { BacklogToolbar } from "./BacklogToolbar";
import { BacklogContent } from "./BacklogContent";

export function BacklogPage() {
  return (
    <div className="space-y-4">
      <BacklogHeader />
      <BacklogToolbar />
      <BacklogContent />
    </div>
  );
}
