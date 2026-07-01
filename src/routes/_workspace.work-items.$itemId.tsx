import { createFileRoute } from "@tanstack/react-router";
import { WorkItemDetails } from "@/components/work-item/WorkItemDetails";

export const Route = createFileRoute("/_workspace/work-items/$itemId")({
  head: ({ params }) => ({ meta: [{ title: `${params.itemId} · Work Item` }] }),
  component: WorkItemPage,
});

function WorkItemPage() {
  const { itemId } = Route.useParams();

  return (
    <WorkItemDetails
      itemId={itemId}
      title="Definir arquitetura de permissões"
      project="Altech Core"
      status="Em progresso"
      priority="Prioridade média"
      description="Modelar o sistema de roles e permissões da plataforma Altech. Deve suportar permission-driven UI em todos os módulos e integrar com o Supabase usando policies RLS."
      owner="Ana Silva"
      dueDate="12 jul 2026"
      type="Arquitetura"
    />
  );
}
