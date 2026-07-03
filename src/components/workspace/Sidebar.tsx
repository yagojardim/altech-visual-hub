import { Link, useRouterState } from "@tanstack/react-router";
import { LayoutDashboard, Settings, LifeBuoy, Zap } from "lucide-react";
import { ConceptIcon, type ConceptIconName } from "@/components/icons/ConceptIcon";
import { cn } from "@/lib/utils";

type IconRender = React.ComponentType<{ className?: string }>;

interface NavItem {
  to: "/dashboard" | "/projects" | "/boards" | "/sprints" | "/backlog" | "/settings" | "/support" | "/automation";
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
        className="flex flex-shrink-0 items-center gap-3 border-b px-[18px] py-[14px] focus-visible:outline-none"
        style={{ borderColor: "rgba(255,255,255,0.05)" }}
        aria-label="Ir para o Dashboard"
      >
        <svg width="28" height="28" viewBox="0 0 40 40" fill="none" aria-hidden="true">
          <defs>
            <linearGradient id="altech-mark" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#2F6BFF" />
              <stop offset="100%" stopColor="#2E9BFF" />
            </linearGradient>
          </defs>
          <path d="M20 5 L36 35 H4 Z" fill="url(#altech-mark)" opacity="0.1" />
          <path d="M11 28 L20 8 L29 28" stroke="url(#altech-mark)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          <path d="M14.5 22 L25.5 22" stroke="url(#altech-mark)" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
        <div className="leading-tight">
          <div style={{ font: "700 12px 'Sora',sans-serif", color: "#F0F4FC", letterSpacing: "-0.01em" }}>
            Gestão Ágil
          </div>
          <div style={{ font: "400 9px 'JetBrains Mono',monospace", color: "rgba(107,136,165,0.6)", marginTop: 3, letterSpacing: "0.06em" }}>
            ALTECH · v1.0
          </div>
        </div>
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
      <Icon className={cn("h-4 w-4", active ? "text-[#5FB0FF]" : "text-[rgba(169,182,201,0.6)]")} aria-hidden="true" />
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
