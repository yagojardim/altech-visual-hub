import { createFileRoute } from "@tanstack/react-router";
import { AutomationPage } from "@/components/automation/AutomationPage";

export const Route = createFileRoute("/_workspace/automation")({
  head: () => ({ meta: [{ title: "Automações · Altech Project" }] }),
  component: AutomationPage,
});
