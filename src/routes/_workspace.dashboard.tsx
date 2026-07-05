import { createFileRoute } from "@tanstack/react-router";
import { useDevRole } from "@/lib/dev-role";
import { DashboardContainer } from "@/components/dashboard/DashboardContainer";
import { PMDashboard, PODashboard } from "@/components/dashboard/RoleDashboards";
import { DashboardContextHeader } from "@/components/dashboard/DashboardContextHeader";
import { DashboardOverview } from "@/components/dashboard/DashboardOverview";
import { TooltipProvider } from "@/components/ui/tooltip";

export const Route = createFileRoute("/_workspace/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard · Altech Project" }] }),
  component: DashboardPage,
});

function DashboardPage() {
  const { role } = useDevRole();

  return (
    <TooltipProvider delayDuration={200}>
      <DashboardContainer>
        <DashboardContextHeader />
        {role === "PM" ? (
          <PMDashboard />
        ) : role === "PO" ? (
          <PODashboard />
        ) : (
          <DashboardOverview />
        )}
      </DashboardContainer>
    </TooltipProvider>
  );
}
