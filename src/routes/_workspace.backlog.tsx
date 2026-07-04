import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ListTodo, Plus, Search } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { isMissingRelation, logSupabaseError, formatSupabaseError } from "@/lib/supabase-errors";
import { TIPO_OPTIONS, PRIORIDADE_OPTIONS, type WorkItemRow } from "@/lib/work-items-api";
import { listProjects, type ProjectRow } from "@/lib/projects-api";
import { listTeamMembers, type TeamMember } from "@/lib/team-members-api";
import { qk } from "@/lib/query-keys";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { WidgetCard } from "@/components/dashboard/WidgetCard";
import { LoadingState, EmptyState, ErrorState } from "@/components/states";
import { WorkItemDrawer } from "@/components/work-items/WorkItemDrawer";

async function listBacklogItems(): Promise<WorkItemRow[]> {
  const { data: linked, error: linkedErr } = await supabase
    .from("sprint_items")
    .select("work_item_id");
  if (linkedErr && !isMissingRelation(linkedErr)) {
    logSupabaseError("backlog:sprint_items", linkedErr);
    throw linkedErr;
  }
  const linkedIds = new Set<string>(((linked ?? []) as Array<{ work_item_id: string }>).map((r) => r.work_item_id));

  let q = supabase
    .from("work_items")
    .select("id, project_id, tenant_id, item_key, titulo, tipo, status, responsavel, descricao, prioridade, ordem, sprint_id, created_at, updated_at")
    .is("sprint_id", null)
    .order("created_at", { ascending: false });
  const { data, error } = await q;
  if (error) {
    if (isMissingRelation(error)) { logSupabaseError("backlog:work_items", error); return []; }
    throw error;
  }
  const rows = (data ?? []) as WorkItemRow[];
  return rows.filter((r) => !linkedIds.has(r.id));
}

export const Route = createFileRoute("/_workspace/backlog")({
  head: () => ({ meta: [{ title: "Backlog · Altech Project" }] }),
  component: BacklogIndex,
});

function tipoVariant(tipo: string): "default" | "secondary" | "outline" | "destructive" {
  if (tipo === "Bug") return "destructive";
  if (tipo === "Épico") return "default";
  return "secondary";
}
function prioridadeVariant(p: string): "default" | "secondary" | "outline" | "destructive" {
  if (p === "Crítica") return "destructive";
  if (p === "Alta") return "default";
  if (p === "Baixa") return "outline";
  return "secondary";
}

function initials(name: string | null | undefined): string {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function ResponsavelCell({
  name,
  membersByName,
}: {
  name: string | null;
  membersByName: Map<string, TeamMember>;
}) {
  if (!name) return <span className="text-sm text-muted-foreground">—</span>;
  const member = membersByName.get(name);
  const color = member?.avatar_color ?? "#94a3b8";
  return (
    <div className="inline-flex items-center gap-2 text-sm text-foreground">
      <Avatar className="h-6 w-6 border text-[10px] font-medium" style={{ borderColor: color }}>
        <AvatarFallback className="text-white" style={{ backgroundColor: color }}>
          {initials(name)}
        </AvatarFallback>
      </Avatar>
      <span className="truncate">{name}</span>
    </div>
  );
}


  const queryClient = useQueryClient();
  const itemsQ = useQuery({ queryKey: qk.workItemsBacklog(), queryFn: listBacklogItems });
  const projectsQ = useQuery({ queryKey: qk.projects(), queryFn: listProjects });
  const membersQ = useQuery({ queryKey: qk.teamMembers(), queryFn: listTeamMembers });



  const [search, setSearch] = useState("");
  const [tipo, setTipo] = useState<string>("all");
  const [prioridade, setPrioridade] = useState<string>("all");
  const [openItemId, setOpenItemId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const projectsById = useMemo(() => {
    const m = new Map<string, ProjectRow>();
    (projectsQ.data ?? []).forEach((p) => m.set(p.id, p));
    return m;
  }, [projectsQ.data]);

  const membersByName = useMemo(() => {
    const m = new Map<string, TeamMember>();
    (membersQ.data ?? []).forEach((p) => m.set(p.name, p));
    return m;
  }, [membersQ.data]);


  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    return (itemsQ.data ?? []).filter((it) => {
      if (tipo !== "all" && it.tipo !== tipo) return false;
      if (prioridade !== "all" && it.prioridade !== prioridade) return false;
      if (s && !it.titulo.toLowerCase().includes(s)) return false;
      return true;
    });
  }, [itemsQ.data, tipo, prioridade, search]);

  return (
    <div className="space-y-6">
      <header className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">Backlog</h1>
          <p className="text-sm text-muted-foreground">
            Work items ainda não vinculados a nenhuma sprint no Altech Project.
          </p>
        </div>
        <Button onClick={() => setCreating(true)} size="sm">
          <Plus className="mr-1 h-4 w-4" /> Novo item
        </Button>
      </header>

      <WidgetCard>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por título..."
              className="pl-9"
              aria-label="Buscar work items"
            />
          </div>
          <Select value={tipo} onValueChange={setTipo}>
            <SelectTrigger className="sm:w-40" aria-label="Filtrar por tipo">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os tipos</SelectItem>
              {TIPO_OPTIONS.map((t) => (
                <SelectItem key={t} value={t}>{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={prioridade} onValueChange={setPrioridade}>
            <SelectTrigger className="sm:w-44" aria-label="Filtrar por prioridade">
              <SelectValue placeholder="Prioridade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas prioridades</SelectItem>
              {PRIORIDADE_OPTIONS.map((p) => (
                <SelectItem key={p} value={p}>{p}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </WidgetCard>

      {itemsQ.isLoading ? (
        <LoadingState variant="skeleton" rows={6} />
      ) : itemsQ.error ? (
        <ErrorState
          title="Não foi possível carregar o backlog"
          description={formatSupabaseError(itemsQ.error, "Erro ao carregar work items.")}
          onRetry={() => void itemsQ.refetch()}
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<ListTodo className="h-5 w-5" />}
          title="Backlog vazio"
          description={
            (itemsQ.data?.length ?? 0) === 0
              ? "Nenhum work item fora de sprints no momento."
              : "Nenhum item corresponde aos filtros aplicados."
          }
        />
      ) : (
        <WidgetCard>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Título</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Prioridade</TableHead>
                  <TableHead>Responsável</TableHead>
                  <TableHead>Projeto</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((it) => {
                  const project = projectsById.get(it.project_id);
                  return (
                    <TableRow
                      key={it.id}
                      onClick={() => setOpenItemId(it.id)}
                      className="cursor-pointer"
                    >
                      <TableCell className="font-medium text-foreground">{it.titulo}</TableCell>
                      <TableCell>
                        <Badge variant={tipoVariant(it.tipo)} className="text-[10px] uppercase">
                          {it.tipo}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={prioridadeVariant(it.prioridade)} className="text-[10px] uppercase">
                          {it.prioridade}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <ResponsavelCell name={it.responsavel} membersByName={membersByName} />
                      </TableCell>

                      <TableCell className="text-sm text-muted-foreground">
                        {project?.nome ?? "—"}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </WidgetCard>
      )}
      <WorkItemDrawer
        itemId={openItemId}
        open={!!openItemId || creating}
        createMode={creating}
        onOpenChange={(o) => {
          if (!o) { setOpenItemId(null); setCreating(false); }
        }}
        onChanged={() => { void queryClient.invalidateQueries({ queryKey: qk.workItems() }); }}
      />
    </div>
  );
}
