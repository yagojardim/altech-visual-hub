import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  KanbanSquare,
  FolderKanban,
  CalendarRange,
  ListTodo,
  Settings,
  LifeBuoy,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  to: "/dashboard" | "/projects" | "/boards" | "/sprints" | "/backlog" | "/settings" | "/support";
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const NAV: NavItem[] = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/projects", label: "Projetos", icon: FolderKanban },
  { to: "/boards", label: "Boards", icon: KanbanSquare },
  { to: "/sprints", label: "Sprints", icon: CalendarRange },
  { to: "/backlog", label: "Backlog", icon: ListTodo },
];

const SECONDARY: NavItem[] = [
  { to: "/settings", label: "Configurações", icon: Settings },
  { to: "/support", label: "Suporte", icon: LifeBuoy },
];

function isSectionActive(pathname: string, to: string) {
  if (to === "/dashboard") return pathname === "/" || pathname.startsWith("/dashboard");
  return pathname === to || pathname.startsWith(`${to}/`);
}

export function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="flex h-full flex-col gap-2 p-3">
      <Link
        to="/dashboard"
        onClick={onNavigate}
        className="flex items-center gap-2 px-2 py-3 focus-visible:outline-none"
        aria-label="Ir para o Dashboard do Altech Project"
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-lg altech-gradient" aria-hidden="true">
          <Check className="h-4 w-4 text-primary-foreground" strokeWidth={3} />
        </div>
        <div className="leading-tight">
          <div className="text-sm font-semibold tracking-tight">Altech Project</div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
            by Altech
          </div>
        </div>
      </Link>

      <nav className="mt-2 flex flex-col gap-0.5" aria-label="Navegação principal">
        {NAV.map((item) => (
          <NavLink
            key={item.to}
            item={item}
            active={isSectionActive(pathname, item.to)}
            onNavigate={onNavigate}
          />
        ))}
      </nav>

      <div className="mt-auto flex flex-col gap-0.5 border-t border-sidebar-border pt-3">
        <div className="px-2 pb-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
          Workspace
        </div>
        {SECONDARY.map((item) => (
          <NavLink
            key={item.to}
            item={item}
            active={isSectionActive(pathname, item.to)}
            onNavigate={onNavigate}
          />
        ))}
      </div>
    </div>
  );
}

export function Sidebar() {
  return (
    <aside className="hidden md:flex w-60 shrink-0 flex-col border-r border-sidebar-border bg-sidebar">
      <SidebarContent />
    </aside>
  );
}

function NavLink({
  item,
  active,
  onNavigate,
}: {
  item: NavItem;
  active: boolean;
  onNavigate?: () => void;
}) {
  const Icon = item.icon;
  return (
    <Link
      to={item.to}
      onClick={onNavigate}
      className={cn(
        "flex items-center gap-2.5 rounded-md px-2 py-2 text-sm font-medium transition-colors",
        "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
        active && "bg-sidebar-accent text-sidebar-primary",
      )}
      aria-current={active ? "page" : undefined}
    >
      <Icon aria-hidden="true" className={cn("h-4 w-4", active ? "text-sidebar-primary" : "text-muted-foreground")} />
      <span className="truncate">{item.label}</span>
    </Link>
  );
}
