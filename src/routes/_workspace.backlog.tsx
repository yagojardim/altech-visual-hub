import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ChevronDown,
  ChevronRight,
  ListTodo,
  Search,
  Target,
  Puzzle,
  BookOpen,
  CheckSquare,
  ListChecks,
  Bug,
  AlertTriangle,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { isMissingRelation, logSupabaseError, formatSupabaseError } from "@/lib/supabase-errors";
import { listProjects, type ProjectRow } from "@/lib/projects-api";
import { qk } from "@/lib/query-keys";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { WidgetCard } from "@/components/dashboard/WidgetCard";
import { LoadingState, EmptyState, ErrorState } from "@/components/states";

type WIType = "epic" | "feature" | "story" | "task" | "subtask" | "bug" | "risk";

interface BacklogItem {
  id: string;
  project_id: string;
  title: string;
  type: WIType | string;
  priority: string;
  status: string;
  assignee_id: string | null;
  parent_id: string | null;
}

interface TeamMember {
  id: string;
  name: string;
  avatar_color: string | null;
}

const TYPE_OPTIONS: { value: WIType; label: string }[] = [
  { value: "epic", label: "Épico" },
  { value: "feature", label: "Feature" },
  { value: "story", label: "História" },
  { value: "task", label: "Tarefa" },
  { value: "subtask", label: "Subtarefa" },
  { value: "bug", label: "Bug" },
  { value: "risk", label: "Risco" },
];

const PRIORITY_OPTIONS = [
  { value: "baixa", label: "Baixa" },
  { value: "media", label: "Média" },
  { value: "alta", label: "Alta" },
  { value: "critica", label: "Crítica" },
];

const TYPE_META: Record<
  WIType,
  { label: string; icon: React.ComponentType<{ className?: string }>; badge: string; color: string }
> = {
  epic:    { label: "Épico",     icon: Target,       badge: "bg-purple-500/15 text-purple-300 border-purple-500/30",   color: "text-purple-300" },
  feature: { label: "Feature",   icon: Puzzle,       badge: "bg-blue-500/15 text-blue-300 border-blue-500/30",         color: "text-blue-300" },
  story:   { label: "História",  icon: BookOpen,     badge: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30", color: "text-emerald-300" },
  task:    { label: "Tarefa",    icon: CheckSquare,  badge: "bg-slate-500/15 text-slate-200 border-slate-500/30",      color: "text-slate-200" },
  subtask: { label: "Subtarefa", icon: ListChecks,   badge: "bg-slate-500/10 text-slate-300 border-slate-500/20",      color: "text-slate-300" },
  bug:     { label: "Bug",       icon: Bug,          badge: "bg-red-500/15 text-red-300 border-red-500/30",            color: "text-red-300" },
  risk:    { label: "Risco",     icon: AlertTriangle,badge: "bg-amber-500/15 text-amber-300 border-amber-500/30",      color: "text-amber-300" },
};

function normalize(value: string): string {
  return value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}
function typeKey(t: string): WIType {
  const k = normalize(t) as WIType;
  return (TYPE_META[k] ? k : "task");
}
function priorityLabel(p: string): string {
  return PRIORITY_OPTIONS.find((o) => o.value === normalize(p))?.label ?? p;
}
function priorityVariant(p: string): "default" | "secondary" | "outline" | "destructive" {
  const n = normalize(p);
  if (n === "critica") return "destructive";
  if (n === "alta") return "default";
  if (n === "baixa") return "outline";
  return "secondary";
}
function initials(name?: string | null): string {
  if (!name) return "?";
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((s) => s[0]?.toUpperCase() ?? "").join("") || "?";
}

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
    .select("id, project_id, title, type, priority, status, assignee_id, parent_id")
    .order("created_at", { ascending: true });

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

interface TreeNode {
  item: BacklogItem;
  children: TreeNode[];
}

function buildTree(items: BacklogItem[]): { hierarchy: TreeNode[]; standalone: TreeNode[] } {
  const byId = new Map<string, TreeNode>();
  items.forEach((it) => byId.set(it.id, { item: it, children: [] }));

  const roots: TreeNode[] = [];
  items.forEach((it) => {
    const node = byId.get(it.id)!;
    if (it.parent_id && byId.has(it.parent_id)) {
      byId.get(it.parent_id)!.children.push(node);
    } else {
      roots.push(node);
    }
  });

  const HIER: WIType[] = ["epic", "feature", "story", "task", "subtask"];
  const hierarchy: TreeNode[] = [];
  const standalone: TreeNode[] = [];
  roots.forEach((n) => {
    const t = typeKey(n.item.type);
    if (HIER.includes(t)) hierarchy.push(n);
    else standalone.push(n); // bug, risk (or unknown) without parent
  });
  // Bugs/risks that ARE nested under a hierarchical parent stay inside `hierarchy`.
  return { hierarchy, standalone };
}

function filterTree(
  nodes: TreeNode[],
  matches: (it: BacklogItem) => boolean,
): TreeNode[] {
  const out: TreeNode[] = [];
  nodes.forEach((n) => {
    const kids = filterTree(n.children, matches);
    if (matches(n.item) || kids.length > 0) {
      out.push({ item: n.item, children: kids });
    }
  });
  return out;
}

function ResponsavelCell({ member }: { member?: TeamMember }) {
  if (!member) return <span className="text-xs text-muted-foreground">—</span>;
  const color = member.avatar_color ?? "#94a3b8";
  return (
    <div className="inline-flex items-center gap-2 text-xs text-foreground">
      <Avatar className="h-6 w-6 border" style={{ borderColor: color }}>
        <AvatarFallback className="text-[10px] text-white" style={{ backgroundColor: color }}>
          {initials(member.name)}
        </AvatarFallback>
      </Avatar>
      <span className="truncate max-w-[120px]">{member.name}</span>
    </div>
  );
}

function TreeRow({
  node,
  depth,
  expanded,
  onToggle,
  membersById,
  projectsById,
}: {
  node: TreeNode;
  depth: number;
  expanded: Set<string>;
  onToggle: (id: string) => void;
  membersById: Map<string, TeamMember>;
  projectsById: Map<string, ProjectRow>;
}) {
  const t = typeKey(node.item.type);
  const meta = TYPE_META[t];
  const Icon = meta.icon;
  const hasChildren = node.children.length > 0;
  const isOpen = expanded.has(node.item.id);
  const member = node.item.assignee_id ? membersById.get(node.item.assignee_id) : undefined;
  const project = projectsById.get(node.item.project_id);

  return (
    <>
      <div
        className="group flex items-center gap-2 rounded-md px-2 py-2 hover:bg-accent/40 transition-colors"
        style={{ paddingLeft: `${depth * 20 + 8}px` }}
      >
        {hasChildren ? (
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5 shrink-0"
            onClick={() => onToggle(node.item.id)}
            aria-label={isOpen ? "Recolher" : "Expandir"}
          >
            {isOpen ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
          </Button>
        ) : (
          <span className="inline-block h-5 w-5 shrink-0" />
        )}

        <Icon className={cn("h-4 w-4 shrink-0", meta.color)} />

        <Badge variant="outline" className={cn("text-[10px] uppercase shrink-0", meta.badge)}>
          {meta.label}
        </Badge>

        <span className="flex-1 truncate text-sm text-foreground" title={node.item.title}>
          {node.item.title}
        </span>

        <Badge variant={priorityVariant(node.item.priority)} className="text-[10px] uppercase shrink-0">
          {priorityLabel(node.item.priority)}
        </Badge>

        <div className="w-[140px] shrink-0 hidden md:flex justify-end">
          <ResponsavelCell member={member} />
        </div>

        <div className="w-[120px] shrink-0 hidden lg:block truncate text-right text-xs text-muted-foreground">
          {project?.nome ?? "—"}
        </div>
      </div>

      {hasChildren && isOpen &&
        node.children.map((child) => (
          <TreeRow
            key={child.item.id}
            node={child}
            depth={depth + 1}
            expanded={expanded}
            onToggle={onToggle}
            membersById={membersById}
            projectsById={projectsById}
          />
        ))}
    </>
  );
}

function BacklogIndex() {
  const itemsQ = useQuery({ queryKey: qk.workItemsBacklog(), queryFn: listBacklogItems });
  const projectsQ = useQuery({ queryKey: qk.projects(), queryFn: listProjects });
  const membersQ = useQuery({ queryKey: qk.teamMembers(), queryFn: listMembers });

  const [search, setSearch] = useState("");
  const [type, setType] = useState<string>("all");
  const [priority, setPriority] = useState<string>("all");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

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

  const tree = useMemo(() => buildTree(itemsQ.data ?? []), [itemsQ.data]);

  const filtered = useMemo(() => {
    const s = normalize(search);
    const match = (it: BacklogItem) => {
      if (type !== "all" && typeKey(it.type) !== type) return false;
      if (priority !== "all" && normalize(it.priority) !== priority) return false;
      if (s && !normalize(it.title).includes(s)) return false;
      return true;
    };
    return {
      hierarchy: filterTree(tree.hierarchy, match),
      standalone: filterTree(tree.standalone, match),
    };
  }, [tree, type, priority, search]);

  const toggle = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const expandAll = () => {
    const ids = new Set<string>();
    const walk = (nodes: TreeNode[]) =>
      nodes.forEach((n) => {
        if (n.children.length) {
          ids.add(n.item.id);
          walk(n.children);
        }
      });
    walk(filtered.hierarchy);
    walk(filtered.standalone);
    setExpanded(ids);
  };
  const collapseAll = () => setExpanded(new Set());

  const totalVisible = filtered.hierarchy.length + filtered.standalone.length;

  return (
    <div className="space-y-6">
      <header className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">Backlog</h1>
          <p className="text-sm text-muted-foreground">
            Work items ainda não vinculados a nenhuma sprint no Altech Project, organizados por hierarquia.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={expandAll}>Expandir tudo</Button>
          <Button variant="outline" size="sm" onClick={collapseAll}>Recolher tudo</Button>
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
      ) : totalVisible === 0 ? (
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
        <div className="space-y-4">
          {filtered.hierarchy.length > 0 && (
            <WidgetCard>
              <div className="mb-2 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-foreground">Hierarquia</h2>
                <span className="text-xs text-muted-foreground">{filtered.hierarchy.length} raízes</span>
              </div>
              <div className="divide-y divide-border/40">
                {filtered.hierarchy.map((n) => (
                  <TreeRow
                    key={n.item.id}
                    node={n}
                    depth={0}
                    expanded={expanded}
                    onToggle={toggle}
                    membersById={membersById}
                    projectsById={projectsById}
                  />
                ))}
              </div>
            </WidgetCard>
          )}

          {filtered.standalone.length > 0 && (
            <WidgetCard>
              <div className="mb-2 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-foreground">Bugs & Riscos</h2>
                <span className="text-xs text-muted-foreground">{filtered.standalone.length} itens</span>
              </div>
              <div className="divide-y divide-border/40">
                {filtered.standalone.map((n) => (
                  <TreeRow
                    key={n.item.id}
                    node={n}
                    depth={0}
                    expanded={expanded}
                    onToggle={toggle}
                    membersById={membersById}
                    projectsById={projectsById}
                  />
                ))}
              </div>
            </WidgetCard>
          )}
        </div>
      )}
    </div>
  );
}
