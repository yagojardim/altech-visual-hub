import { createFileRoute, useRouter } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { WorkItemDetailsPanel } from "@/components/work-item/WorkItemDetailsPanel";

const searchSchema = z.object({
  // Caminho absoluto (com query) da tela que originou o open — Backlog, Board ou Sprint.
  from: z.string().optional(),
});

export const Route = createFileRoute("/_workspace/work-items/$itemId")({
  head: ({ params }) => ({ meta: [{ title: `Work Item · ${params.itemId.slice(0, 6)}` }] }),
  validateSearch: (search) => searchSchema.parse(search),
  component: WorkItemPage,
});

function isSafeInternalPath(p: string | undefined): p is string {
  return !!p && p.startsWith("/") && !p.startsWith("//");
}

function labelForOrigin(from: string | undefined): string {
  if (!from) return "Voltar";
  if (from.startsWith("/backlog")) return "Voltar ao Backlog";
  if (from.startsWith("/boards/")) return "Voltar ao Board";
  if (from.startsWith("/sprints/")) return "Voltar à Sprint";
  return "Voltar";
}

function WorkItemPage() {
  const { itemId } = Route.useParams();
  const { from } = Route.useSearch();
  const router = useRouter();

  const handleBack = () => {
    if (isSafeInternalPath(from)) {
      void router.navigate({ to: from, replace: true });
      return;
    }
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.history.back();
      return;
    }
    void router.navigate({ to: "/backlog" });
  };

  return (
    <div className="space-y-4 p-4 lg:p-6">
      <Button variant="ghost" size="sm" onClick={handleBack}>
        <ArrowLeft className="mr-1.5 h-4 w-4" />
        {labelForOrigin(from)}
      </Button>
      <WorkItemDetailsPanel workItemId={itemId} originPath={from} />
    </div>
  );
}
