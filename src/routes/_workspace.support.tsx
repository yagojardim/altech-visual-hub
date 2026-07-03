import { createFileRoute } from "@tanstack/react-router";
import { EmptyState } from "@/components/states";
import { LifeBuoy } from "lucide-react";

export const Route = createFileRoute("/_workspace/support")({
  component: SupportIndex,
});

function SupportIndex() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl">Suporte</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Canal de ajuda do Altech Project.
        </p>
      </div>
      <EmptyState
        icon={<LifeBuoy className="h-5 w-5" />}
        title="Precisa de ajuda?"
        description="Fale com o time Altech pelo canal interno ou consulte a documentação em breve disponível aqui."
      />
    </div>
  );
}
