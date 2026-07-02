import { Search, Bell, Menu, ChevronDown } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useWorkspace } from "@/lib/workspace";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface TopbarProps {
  onOpenPalette: () => void;
  onOpenMobileNav: () => void;
}

export function Topbar({ onOpenPalette, onOpenMobileNav }: TopbarProps) {
  const { user } = useAuth();
  const ws = useWorkspace();
  const workspaceName = ws.current?.name ?? "Altech HQ";

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur">
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 md:hidden"
        aria-label="Abrir menu"
        onClick={onOpenMobileNav}
      >
        <Menu className="h-4 w-4" />
      </Button>

      <div className="flex min-w-0 items-center gap-2">
        <div className="hidden h-6 w-6 items-center justify-center rounded-md altech-gradient sm:flex">
          <span className="text-[10px] font-bold text-primary-foreground">A</span>
        </div>
        <div className="truncate text-sm font-semibold text-foreground">{workspaceName}</div>
      </div>

      <div className="ml-auto flex items-center gap-2">
        <button
          onClick={onOpenPalette}
          className="group hidden items-center gap-2 rounded-md border border-border bg-card px-2.5 py-1.5 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground sm:flex"
          aria-label="Abrir busca (Ctrl+K)"
        >
          <Search className="h-3.5 w-3.5" />
          <span>Buscar…</span>
          <kbd className="ml-6 rounded border border-border bg-background px-1.5 py-0.5 text-[10px] font-mono">
            ⌘K
          </kbd>
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
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="flex items-center gap-2 rounded-md pl-2 pr-1.5 py-1 transition-colors hover:bg-accent"
                aria-label="Menu do usuário"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-full altech-gradient text-[11px] font-semibold text-primary-foreground">
                  {user.name[0]?.toUpperCase()}
                </div>
                <div className="hidden text-left leading-tight sm:block">
                  <div className="text-xs font-medium text-foreground">{user.name}</div>
                  <div className="text-[10px] capitalize text-muted-foreground">{user.role}</div>
                </div>
                <ChevronDown className="hidden h-3.5 w-3.5 text-muted-foreground sm:block" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="leading-tight">
                  <div className="text-sm font-medium text-foreground">{user.name}</div>
                  <div className="text-xs text-muted-foreground">{user.email}</div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem disabled>Perfil</DropdownMenuItem>
              <DropdownMenuItem disabled>Preferências</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem disabled>Sair</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </header>
  );
}
