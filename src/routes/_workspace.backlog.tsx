import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ListTodo, Search } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { isMissingRelation, logSupabaseError, formatSupabaseError } from "@/lib/supabase-errors";
import { listProjects, type ProjectRow } from "@/lib/projects-api";
import { qk } from "@/lib/query-keys";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { WidgetCard } from "@/components/dashboard/WidgetCard";
import { LoadingState, EmptyState, ErrorState } from "@/components/states";

interface BacklogItem {
  id: string;
  project_id: string;
  title: string;
  type: string;
  priority: string;
  status: string;
  assignee_id: string | null;
  description: string | null;
  position: number;
  created_at: string;
}

interface TeamMember {
  id: string;
  name: string;
  avatar_color: string | null;
}

const TYPE_OPTIONS = [
  { value: "story", label: "História" },
  { value: "task", label: "Tarefa" },
  { value: "bug", label: "Bug" },
  { value: "risk", label: "Risco" },
  { value: "epic", label: "Épico" },
];

const PRIORITY_OPTIONS = [
  { value: "baixa", label: "Baixa" },
  { value: "media", label: "Média" },
  { value: "alta", label: "Alta" },
  { value: "critica", label: "Crítica" },
];

async function listBacklogItems(): Promise<BacklogItem[]> {
  const { data: linked, error: linkedErr } = await supabase
    .from("sprint_items")
    .select("work_item_id");
  if (linkedErr && !isMissingRelation(linkedErr)) {
    logSupabaseError("backlog:sprint_items", linkedErr);
    throw linkedErr;
  }
  const linkedIds = new Set<string>(
    ((linked ?? []) as Array<{ work_item_id: string }>).map((r) => r.work_item_id),
  );

  const { data, error } = await supabase
    .from("work_items")
    .select("id, project_id, title, type, priority, status, assignee_id, description, position, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    if (isMissingRelation(error)) {
      logSupabaseError("backlog:work_items", error);
      return [];
    }
    throw error;
  }
  return ((data ?? []) as BacklogItem[]).filter((r) => !linkedIds.has(r.id));
}

async function listMembers(): Promise<TeamMember[]> {
  const { data, error } = await supabase
    .from("team_members")
    .select("id, name, avatar_color")
    .order("name", { ascending: true });
  if (error) {
    logSupabaseError("backlog:team_members", error);
    throw error;
  }
  return (data ?? []) as TeamMember[];
}

export const Route = createFileRoute("/_workspace/backlog")({
  head: () => ({ meta: [{ title: "Backlog · Altech Project" }] }),
  component: BacklogIndex,
});

function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function typeLabel(type: string): string {
  return TYPE_OPTIONS.find((t) => t.value === normalize(type))?.label ?? type;
}

function priorityLabel(priority: string): string {
  return PRIORITY_OPTIONS.find((p) => p.value === normalize(priority))?.label ?? priority;
}

function typeVariant(type: string): "default" | "secondary" | "outline" | "destructive" {
  const t = normalize(type);
  if (t === "bug" || t === "risk") return "destructive";
  if (t === "epic") return "default";
  return "secondary";
}

function priorityVariant(priority: string): "default" | "secondary" | "outline" | "destructive" {
  const p = normalize(priority);
  if (p === "critica") return "destructive";
  if (p === "alta") return "default";
  if (p === "baixa") return "outline";
  return "secondary";
}

function initials(name: string | null | undefined): string {
  if (!name) return "?";
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase() ?? "")
    .join("") || "?";
}

function ResponsavelCell({
  member,
}: {
  member: TeamMember | undefined;
}) {
  if (!member) return <span className="text-sm text-muted-foreground">—</span>;
  const color = member.avatar_color ?? "#94a3b8";
  return (
    <div className="inline-flex items-center gap-2 text-sm text-foreground">
      <Avatar className="h-6 w-6 border text-[10px] font-medium" style={{ borderColor: color }}>
        <AvatarFallback className="text-white" style={{ backgroundColor: color }}>
          {initials(member.name)}
        </AvatarFallback>
      </Avatar>
      <span className="truncate">{member.name}</span>
    </div>
  );
}

function BacklogIndex() {
  const itemsQ = useQuery({ queryKey: qk.workItemsBacklog(), queryFn: listBacklogItems });
  const projectsQ = useQuery({ queryKey: qk.projects(), queryFn: listProjects });
  const membersQ = useQuery({ queryKey: qk.teamMembers(), queryFn: listMembers });

  const [search, setSearch] = useState("");
  const [type, setType] = useState<string>("all");
  const [priority, setPriority] = useState<string>("all");

  const projectsById = useMemo(() => {
    const m = new Map<string, ProjectRow>();
    (projectsQ.data ?? []).forEach((p) => m.set(p.id, p));
    return m;
  }, [projectsQ.data]);

  const membersById = useMemo(() => {
    const m = new Map<string, TeamMember>();
    (membersQ.data ?? []).forEach((p) => m.set(p.id, p));
    return m;
  }, [membersQ.data]);

  const filtered = useMemo(() => {
    const s = normalize(search);
    return (itemsQ.data ?? []).filter((it) => {
      if (type !== "all" && normalize(it.type) !== type) return false;
      if (priority !== "all" && normalize(it.priority) !== priority) return false;
      if (s && !normalize(it.title).includes(s)) return false;
      return true;
    });
  }, [itemsQ.data, type, priority, search]);

  return (
    <div className="space-y-6">
      <header className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">Backlog</h1>
          <p className="text-sm text-muted-foreground">
            Work items ainda não vinculados a nenhuma sprint no Altech Project.
          </p>
        </div>
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
          <Select value={type} onValueChange={setType}>
            <SelectTrigger className="sm:w-40" aria-label="Filtrar por tipo">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os tipos</SelectItem>
              {TYPE_OPTIONS.map((t) => (
                <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={priority} onValueChange={setPriority}>
            <SelectTrigger className="sm:w-44" aria-label="Filtrar por prioridade">
              <SelectValue placeholder="Prioridade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas prioridades</SelectItem>
              {PRIORITY_OPTIONS.map((p) => (
                <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </WidgetCard>

      {itemsQ.isLoading || projectsQ.isLoading || membersQ.isLoading ? (
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
                  const member = it.assignee_id ? membersById.get(it.assignee_id) : undefined;
                  return (
                    <TableRow
                      key={it.id}
                      className="cursor-pointer"
                    >
                      <TableCell className="font-medium text-foreground">{it.title}</TableCell>
                      <TableCell>
                        <Badge variant={typeVariant(it.type)} className="text-[10px] uppercase">
                          {typeLabel(it.type)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={priorityVariant(it.priority)} className="text-[10px] uppercase">
                          {priorityLabel(it.priority)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <ResponsavelCell member={member} />
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
    </div>
  );
}
