import { Link, useRouterState } from "@tanstack/react-router";
import { LayoutDashboard, KanbanSquare, FolderKanban, Settings, LifeBuoy, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCan, type Permission } from "@/lib/auth";

interface NavItem {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  permission: Permission;
}

const NAV: NavItem[] = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, permission: "workspace.view" },
  { to: "/boards", label: "Boards", icon: KanbanSquare, permission: "board.view" },
  { to: "/projects/altech-core", label: "Projeto Altech", icon: FolderKanban, permission: "project.view" },
];

const SECONDARY: NavItem[] = [
  { to: "/dashboard", label: "Configurações", icon: Settings, permission: "admin.access" },
  { to: "/dashboard", label: "Suporte", icon: LifeBuoy, permission: "workspace.view" },
];

export function Sidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <aside className="hidden md:flex w-60 shrink-0 flex-col gap-2 border-r border-border bg-sidebar p-3">
      <Link to="/dashboard" className="flex items-center gap-2 px-2 py-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg altech-gradient">
          <Check className="h-4 w-4 text-primary-foreground" strokeWidth={3} />
        </div>
        <div className="leading-tight">
          <div className="text-sm font-semibold tracking-tight">Altech</div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Platform</div>
        </div>
      </Link>

      <nav className="mt-2 flex flex-col gap-0.5">
        {NAV.map((item) => (
          <NavLink key={item.label} item={item} active={pathname.startsWith(item.to.split("/").slice(0, 2).join("/"))} />
        ))}
      </nav>

      <div className="mt-auto flex flex-col gap-0.5">
        <div className="px-2 pb-1 pt-3 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
          Workspace
        </div>
        {SECONDARY.map((item) => (
          <NavLink key={item.label} item={item} active={false} />
        ))}
      </div>
    </aside>
  );
}

function NavLink({ item, active }: { item: NavItem; active: boolean }) {
  const allowed = useCan(item.permission);
  if (!allowed) return null;
  const Icon = item.icon;
  return (
    <Link
      to={item.to}
      className={cn(
        "flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm text-sidebar-foreground/80 transition-colors",
        "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
        active && "bg-sidebar-accent text-sidebar-accent-foreground",
      )}
    >
      <Icon className={cn("h-4 w-4", active && "text-primary")} />
      <span className="truncate">{item.label}</span>
    </Link>
  );
}
