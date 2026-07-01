import { createFileRoute } from "@tanstack/react-router";
import { UnauthorizedState } from "@/components/states";

export const Route = createFileRoute("/unauthorized")({
  head: () => ({ meta: [{ title: "Sem acesso · Altech" }] }),
  component: () => (
    <div className="min-h-screen bg-background">
      <UnauthorizedState />
    </div>
  ),
});
