import { createFileRoute, useRouter } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WorkItemDetailsPanel } from "@/components/work-item/WorkItemDetailsPanel";

export const Route = createFileRoute("/_workspace/work-items/$itemId")({
  head: ({ params }) => ({ meta: [{ title: `Work Item · ${params.itemId.slice(0, 6)}` }] }),
  component: WorkItemPage,
});

function WorkItemPage() {
  const { itemId } = Route.useParams();
  const router = useRouter();

  return (
    <div className="space-y-4 p-4 lg:p-6">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => {
          // Preserva origem (Backlog/Board/Sprint) sem trocar de projeto
          if (typeof window !== "undefined" && window.history.length > 1) {
            router.history.back();
          } else {
            void router.navigate({ to: "/backlog" });
          }
        }}
      >
        <ArrowLeft className="mr-1.5 h-4 w-4" />
        Voltar
      </Button>
      <WorkItemDetailsPanel workItemId={itemId} />
    </div>
  );
}
