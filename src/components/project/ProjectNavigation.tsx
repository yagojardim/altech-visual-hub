import { LayoutDashboard, ListTodo, KanbanSquare, Timer, BarChart3, Settings } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

const TABS = [
  { key: "overview", label: "Visão Geral", icon: LayoutDashboard },
  { key: "backlog", label: "Backlog", icon: ListTodo },
  { key: "board", label: "Board", icon: KanbanSquare },
  { key: "sprints", label: "Sprints", icon: Timer },
  { key: "dashboard", label: "Dashboard", icon: BarChart3 },
  { key: "settings", label: "Configurações", icon: Settings },
];

export function ProjectNavigation({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <Tabs value={value} onValueChange={onChange}>
      <TabsList className="h-auto w-full justify-start overflow-x-auto rounded-none border-b border-border bg-transparent p-0">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const active = tab.key === value;
          return (
            <TabsTrigger
              key={tab.key}
              value={tab.key}
              className={cn(
                "gap-2 rounded-none border-b-2 border-transparent px-3 py-2.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring data-[state=active]:bg-transparent data-[state=active]:shadow-none",
                active
                  ? "border-primary text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon className="h-4 w-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </TabsTrigger>
          );
        })}
      </TabsList>
    </Tabs>
  );
}
