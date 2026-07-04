import { useEffect, useState } from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  LayoutDashboard,
  KanbanSquare,
  FolderKanban,
  FileText,
  ListTodo,
  Plus,
  Rocket,
  Search,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

type ProjectHit = { id: string; nome: string | null; slug?: string | null };
type WorkItemHit = {
  id: string;
  item_key: string | null;
  titulo: string;
  project_id: string | null;
};


export function CommandPalette({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const navigate = useNavigate();
  const currentPath = useRouterState({
    select: (s) => `${s.location.pathname}${s.location.searchStr ?? ""}`,
  });
  const [query, setQuery] = useState("");
  const [projects, setProjects] = useState<ProjectHit[]>([]);
  const [items, setItems] = useState<WorkItemHit[]>([]);
  const [loading, setLoading] = useState(false);

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

  useEffect(() => {
    if (!open) {
      setQuery("");
      setProjects([]);
      setItems([]);
      return;
    }
    let alive = true;
    const t = setTimeout(async () => {
      setLoading(true);
      const q = query.trim();
      const projectQuery = q
        ? supabase.from("projects").select("id, nome, slug").ilike("nome", `%${q}%`).limit(6)
        : supabase.from("projects").select("id, nome, slug").order("nome").limit(6);
      const itemQuery = q
        ? supabase
            .from("work_items")
            .select("id, item_key, titulo, project_id")
            .or(`titulo.ilike.%${q}%,item_key.ilike.%${q}%`)
            .limit(8)
        : supabase
            .from("work_items")
            .select("id, item_key, titulo, project_id")
            .order("updated_at", { ascending: false })
            .limit(6);

      const [{ data: p }, { data: it }] = await Promise.all([projectQuery, itemQuery]);
      if (!alive) return;
      setProjects((p ?? []) as ProjectHit[]);
      setItems((it ?? []) as WorkItemHit[]);
      setLoading(false);
    }, 180);
    return () => {
      alive = false;
      clearTimeout(t);
    };
  }, [query, open]);

  const go = (to: string) => {
    onOpenChange(false);
    navigate({ to });
  };

  const openProject = (p: ProjectHit) =>
    go(`/projects/${p.slug || p.id}`);

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput
        placeholder="Buscar projetos, work items ou comandos…"
        value={query}
        onValueChange={setQuery}
        aria-label="Buscar projetos, work items ou comandos"
      />
      <CommandList>
        <CommandEmpty>
          {loading ? "Buscando…" : "Nenhum resultado."}
        </CommandEmpty>

        <CommandGroup heading="Ações rápidas">
          <CommandItem onSelect={() => go("/projects")} value="novo-projeto">
            <Plus className="mr-2 h-4 w-4" aria-hidden="true" /> Novo projeto
          </CommandItem>
          <CommandItem onSelect={() => go("/sprints")} value="nova-sprint">
            <Rocket className="mr-2 h-4 w-4" aria-hidden="true" /> Nova sprint
          </CommandItem>
          <CommandItem onSelect={() => go("/dashboard")} value="ir-dashboard">
            <LayoutDashboard className="mr-2 h-4 w-4" aria-hidden="true" /> Ir para Dashboard
          </CommandItem>
          <CommandItem onSelect={() => go("/boards")} value="ir-boards">
            <KanbanSquare className="mr-2 h-4 w-4" aria-hidden="true" /> Ir para Boards
          </CommandItem>
          <CommandItem onSelect={() => go("/backlog")} value="ir-backlog">
            <ListTodo className="mr-2 h-4 w-4" aria-hidden="true" /> Ir para Backlog
          </CommandItem>
        </CommandGroup>

        {projects.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Projetos">
              {projects.map((p) => (
                <CommandItem
                  key={p.id}
                  value={`proj-${p.nome}-${p.id}`}
                  onSelect={() => openProject(p)}
                >
                  <FolderKanban className="mr-2 h-4 w-4" aria-hidden="true" />
                  <span className="truncate">{p.nome ?? "Sem nome"}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        {items.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Work items">
              {items.map((it) => (
                <CommandItem
                  key={it.id}
                  value={`wi-${it.item_key}-${it.titulo}-${it.id}`}
                  onSelect={() => go(`/work-items/${it.item_key ?? it.id}`)}
                >
                  <FileText className="mr-2 h-4 w-4" aria-hidden="true" />
                  <span className="mr-2 rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                    {it.item_key ?? it.id.slice(0, 6)}
                  </span>
                  <span className="truncate">{it.titulo}</span>
                </CommandItem>
              ))}

            </CommandGroup>
          </>
        )}

        {!projects.length && !items.length && !loading && query && (
          <div className="flex items-center gap-2 px-3 py-6 text-xs text-muted-foreground">
            <Search className="h-3.5 w-3.5" aria-hidden="true" /> Sem resultados para "{query}"
          </div>
        )}
      </CommandList>
    </CommandDialog>
  );
}
