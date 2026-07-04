import { Link, useRouterState } from "@tanstack/react-router";
import { LayoutDashboard, Settings, LifeBuoy, Zap, Users } from "lucide-react";
import { ConceptIcon, type ConceptIconName } from "@/components/icons/ConceptIcon";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { cn } from "@/lib/utils";

type IconRender = React.ComponentType<{ className?: string }>;

interface NavItem {
  to: "/dashboard" | "/projects" | "/pessoas" | "/boards" | "/sprints" | "/backlog" | "/settings" | "/support" | "/automation";
  label: string;
  icon?: IconRender;
  concept?: ConceptIconName;
  badge?: string;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const GROUPS: NavGroup[] = [
  {
    label: "Visão",
    items: [
      { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { to: "/projects", label: "Projetos", concept: "projeto" },
      { to: "/pessoas", label: "Pessoas", icon: Users },
    ],
  },
  {
    label: "Execução",
    items: [
      { to: "/boards", label: "Boards", concept: "feature" },
      { to: "/sprints", label: "Sprints", concept: "sprint" },
      { to: "/backlog", label: "Backlog", concept: "historia" },
      { to: "/automation", label: "Automação", icon: Zap, badge: "beta" },
    ],
  },
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
    <div className="flex h-full flex-col overflow-hidden" style={{ background: "#080F1E" }}>
      <Link
        to="/dashboard"
        onClick={onNavigate}
        className="flex flex-shrink-0 items-center gap-[10px] border-b px-[18px] py-[14px] focus-visible:outline-none"
        style={{ borderColor: "rgba(255,255,255,0.05)" }}
        aria-label="Ir para o Dashboard"
      >
        <BrandLogo variant="dark" />
      </Link>

      <nav className="flex-1 overflow-y-auto px-2 py-[10px]" aria-label="Navegação principal">
        {GROUPS.map((group) => (
          <div key={group.label} className="mb-[18px]">
            <div
              style={{
                font: "500 9px 'JetBrains Mono',monospace",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "rgba(107,136,165,0.5)",
                padding: "4px 10px 3px",
                marginBottom: 2,
              }}
            >
              {group.label}
            </div>
            {group.items.map((item) => (
              <NavLink
                key={item.to}
                item={item}
                active={isSectionActive(pathname, item.to)}
                onNavigate={onNavigate}
              />
            ))}
          </div>
        ))}
      </nav>

      <div className="flex-shrink-0 border-t px-2 py-3" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
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
    <aside className="hidden md:flex shrink-0 flex-col" style={{ width: 232 }}>
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
  const iconClass = cn("h-4 w-4", active ? "text-[#5FB0FF]" : "text-[rgba(169,182,201,0.6)]");
  return (
    <Link
      to={item.to}
      onClick={onNavigate}
      className={cn(
        "group flex items-center gap-[10px] px-[10px] py-[7px] text-[13px] font-medium transition-colors",
        "keep-radius",
      )}
      style={{
        borderRadius: 7,
        marginBottom: 1,
        background: active ? "rgba(47,107,255,0.14)" : "transparent",
        color: active ? "#F0F4FC" : "rgba(169,182,201,0.75)",
        fontFamily: "'Manrope',sans-serif",
      }}
      aria-current={active ? "page" : undefined}
    >
      <span
        aria-hidden="true"
        style={{
          width: 5,
          height: 5,
          borderRadius: "50%",
          background: active ? "#2F6BFF" : "rgba(107,136,165,0.3)",
          flexShrink: 0,
        }}
      />
      {item.concept ? (
        <ConceptIcon name={item.concept} size={16} active={active} className={iconClass} />
      ) : Icon ? (
        <Icon className={iconClass} aria-hidden="true" />
      ) : null}
      <span className="truncate flex-1">{item.label}</span>
      {item.badge && (
        <span
          style={{
            font: "500 9px 'JetBrains Mono',monospace",
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            color: "#06C18A",
            background: "rgba(6,193,138,0.12)",
            padding: "2px 6px",
            borderRadius: 4,
          }}
        >
          {item.badge}
        </span>
      )}
    </Link>
  );
}
