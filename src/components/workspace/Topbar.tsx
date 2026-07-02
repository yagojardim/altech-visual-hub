import { useNavigate, useRouterState } from "@tanstack/react-router";
import { Search, Bell, LogOut } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Breadcrumbs } from "./Breadcrumb";

export function Topbar({ onOpenPalette }: { onOpenPalette: () => void }) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur">
      <Breadcrumbs pathname={pathname} />

      <div className="ml-auto flex items-center gap-2">
        <button
          onClick={onOpenPalette}
          className="group hidden sm:flex items-center gap-2 rounded-md border border-border bg-panel px-2.5 py-1.5 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          aria-label="Abrir busca (Ctrl+K)"
        >
          <Search className="h-3.5 w-3.5" />
          <span>Buscar…</span>
          <kbd className="ml-6 rounded border border-border bg-background px-1.5 py-0.5 text-[10px] font-mono">⌘K</kbd>
        </button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 sm:hidden"
          onClick={onOpenPalette}
          aria-label="Abrir busca"
        >
          <Search className="h-4 w-4" />
        </Button>

        <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Notificações">
          <Bell className="h-4 w-4" />
        </Button>

        {user && (
          <div className="flex items-center gap-2 pl-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-full altech-gradient text-[11px] font-medium text-primary-foreground">
              {user.name[0]?.toUpperCase()}
            </div>
            <div className="hidden sm:block leading-tight">
              <div className="text-xs font-medium">{user.name}</div>
              <div className="text-[10px] text-muted-foreground capitalize">{user.role}</div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              aria-label="Sair"
              onClick={async () => {
                await signOut();
                navigate({ to: "/login" });
              }}
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </header>
  );
}
