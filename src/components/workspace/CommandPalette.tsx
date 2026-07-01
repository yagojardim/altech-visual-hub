import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { LayoutDashboard, KanbanSquare, FolderKanban, LogOut, FileText } from "lucide-react";
import { useAuth } from "@/lib/auth";

export function CommandPalette({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const navigate = useNavigate();
  const { signOut, can } = useAuth();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onOpenChange]);

  const go = (to: string) => {
    onOpenChange(false);
    navigate({ to });
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Buscar comandos, projetos, itens…" />
      <CommandList>
        <CommandEmpty>Nenhum resultado.</CommandEmpty>
        <CommandGroup heading="Navegar">
          {can("workspace.view") && (
            <CommandItem onSelect={() => go("/dashboard")}>
              <LayoutDashboard className="mr-2 h-4 w-4" /> Ir para Dashboard
            </CommandItem>
          )}
          {can("board.view") && (
            <CommandItem onSelect={() => go("/boards")}>
              <KanbanSquare className="mr-2 h-4 w-4" /> Ver Boards
            </CommandItem>
          )}
          {can("project.view") && (
            <CommandItem onSelect={() => go("/projects/altech-core")}>
              <FolderKanban className="mr-2 h-4 w-4" /> Projeto Altech Core
            </CommandItem>
          )}
          {can("workitem.view") && (
            <CommandItem onSelect={() => go("/work-items/WI-101")}>
              <FileText className="mr-2 h-4 w-4" /> Abrir Work Item WI-101
            </CommandItem>
          )}
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Conta">
          <CommandItem
            onSelect={async () => {
              onOpenChange(false);
              await signOut();
              navigate({ to: "/login" });
            }}
          >
            <LogOut className="mr-2 h-4 w-4" /> Sair
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
