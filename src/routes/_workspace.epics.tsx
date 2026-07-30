import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronDown, ChevronRight, Plus, Search, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { Chip, StatusBadge } from "@/components/ui/chip";
import { WorkItemDetailsPanel } from "@/components/work-item/WorkItemDetailsPanel";
import { typeMeta } from "@/lib/work-item-type-style";
import { listProjects } from "@/lib/projects-api";
import { listTeamMembers, pickAvatarColor, type TeamMember } from "@/lib/team-members-api";
import { formatSupabaseError } from "@/lib/supabase-errors";
import {
  BUCKET_LABEL,
  EPIC_COLOR_PRESET,
  EPIC_STATUS_BUCKETS,
  computeEpicStats,
  createEpic,
  createIssueInEpic,
  epicColor,
  linkIssueToEpic,
  listEpics,
  listProjectIssues,
  type EpicColorKey,
  type EpicIssue,
  type EpicRow,
} from "@/lib/epics-api";

export const Route = createFileRoute("/_workspace/epics")({
  head: () => ({
    meta: [
      { title: "Épicos — Altech Project" },
      {
        name: "description",
        content:
          "Gerencie épicos do projeto ativo, vincule issues e acompanhe o progresso por status no Altech Project.",
      },
      { property: "og:title", content: "Épicos — Altech Project" },
      {
        property: "og:description",
        content: "Épicos, vínculo de issues e progresso em tempo real.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: EpicsPage,
});

/* ------------------------------------------------------------------ */

function ProgressRing({ value, color }: { value: number; color: string }) {
  const r = 22;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative h-14 w-14 shrink-0">
      <svg viewBox="0 0 56 56" className="h-14 w-14 -rotate-90">
        <circle cx="28" cy="28" r={r} fill="none" strokeWidth="5" className="stroke-border" />
        <circle
          cx="28"
          cy="28"
          r={r}
          fill="none"
          strokeWidth="5"
          strokeLinecap="round"
          stroke={color}
          strokeDasharray={c}
          strokeDashoffset={c - (c * Math.min(100, Math.max(0, value))) / 100}
          style={{ transition: "stroke-dashoffset .4s ease" }}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[11px] font-semibold text-foreground">
        {value}%
      </span>
    </div>
  );
}

function MemberAvatar({ member, size = 24 }: { member?: TeamMember; size?: number }) {
  const name = member?.name ?? "?";
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
  return (
    <Avatar className="border border-border" style={{ height: size, width: size }}>
      <AvatarFallback
        className="text-[10px] font-semibold text-background"
        style={{ background: member?.avatar_color ?? pickAvatarColor(name) }}
      >
        {initials || "?"}
      </AvatarFallback>
    </Avatar>
  );
}

/* ------------------------------------------------------------------ */

function EpicsPage() {
  const qc = useQueryClient();
  const [projectId, setProjectId] = useState<string>("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [selectedIssue, setSelectedIssue] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const projectsQ = useQuery({ queryKey: ["projects", "epics"], queryFn: listProjects });
  const membersQ = useQuery({ queryKey: ["team_members", "epics"], queryFn: listTeamMembers });

  const projects = projectsQ.data ?? [];
  const activeProject = projectId || projects[0]?.id || "";

  const epicsQ = useQuery({
    queryKey: ["epics", activeProject],
    queryFn: () => listEpics(activeProject),
    enabled: Boolean(activeProject),
  });
  const issuesQ = useQuery({
    queryKey: ["epics", activeProject, "issues"],
    queryFn: () => listProjectIssues(activeProject),
    enabled: Boolean(activeProject),
  });

  const membersById = useMemo(() => {
    const map = new Map<string, TeamMember>();
    for (const m of membersQ.data ?? []) map.set(m.id, m);
    return map;
  }, [membersQ.data]);

  const issuesByEpic = useMemo(() => {
    const map = new Map<string, EpicIssue[]>();
    for (const i of issuesQ.data ?? []) {
      if (!i.epic_id) continue;
      const list = map.get(i.epic_id) ?? [];
      list.push(i);
      map.set(i.epic_id, list);
    }
    return map;
  }, [issuesQ.data]);

  const unlinked = useMemo(
    () => (issuesQ.data ?? []).filter((i) => !i.epic_id),
    [issuesQ.data],
  );

  const refresh = () => {
    void qc.invalidateQueries({ queryKey: ["epics", activeProject] });
  };

  const loading = projectsQ.isLoading || epicsQ.isLoading || issuesQ.isLoading;
  const error = projectsQ.error ?? epicsQ.error ?? issuesQ.error;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Épicos</h1>
          <p className="text-sm text-muted-foreground">
            Agrupe issues por épico e acompanhe o progresso do projeto ativo.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={activeProject} onValueChange={setProjectId}>
            <SelectTrigger className="w-56">
              <SelectValue placeholder="Projeto" />
            </SelectTrigger>
            <SelectContent>
              {projects.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={() => setCreating((v) => !v)} className="gap-1.5">
            <Plus size={16} /> Novo épico
          </Button>
        </div>
      </header>

      {creating && activeProject ? (
        <CreateEpicForm
          projectId={activeProject}
          members={membersQ.data ?? []}
          onDone={() => {
            setCreating(false);
            refresh();
          }}
          onCancel={() => setCreating(false)}
        />
      ) : null}

      <div
        className={cn(
          "grid gap-6",
          selectedIssue ? "grid-cols-1 xl:grid-cols-[1fr_440px]" : "grid-cols-1",
        )}
      >
        <div className="min-w-0 space-y-4">
          {loading ? (
            <LoadingState label="Carregando épicos…" />
          ) : error ? (
            <ErrorState
              description={formatSupabaseError(error)}
              onRetry={() => {
                void epicsQ.refetch();
                void issuesQ.refetch();
              }}
            />
          ) : (epicsQ.data ?? []).length === 0 ? (
            <EmptyState
              title="Nenhum épico neste projeto"
              description="Crie um épico para agrupar histórias, tarefas e bugs relacionados."
            />
          ) : (
            (epicsQ.data ?? []).map((epic) => (
              <EpicCard
                key={epic.id}
                epic={epic}
                issues={issuesByEpic.get(epic.id) ?? []}
                unlinked={unlinked}
                membersById={membersById}
                expanded={expanded === epic.id}
                onToggle={() => setExpanded((cur) => (cur === epic.id ? null : epic.id))}
                onSelectIssue={setSelectedIssue}
                onChanged={refresh}
              />
            ))
          )}
        </div>

        {selectedIssue ? (
          <WidgetCard className="h-fit xl:sticky xl:top-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-foreground">Detalhes do work item</h2>
              <Button variant="ghost" size="icon" onClick={() => setSelectedIssue(null)}>
                <X size={16} />
              </Button>
            </div>
            <WorkItemDetailsPanel
              workItemId={selectedIssue}
              originPath="/epics"
              onChange={refresh}
            />
          </WidgetCard>
        ) : null}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function CreateEpicForm({
  projectId,
  members,
  onDone,
  onCancel,
}: {
  projectId: string;
  members: TeamMember[];
  onDone: () => void;
  onCancel: () => void;
}) {
  const [key, setKey] = useState("");
  const [label, setLabel] = useState("");
  const [quarter, setQuarter] = useState("");
  const [description, setDescription] = useState("");
  const [owner, setOwner] = useState<string>("");
  const [color, setColor] = useState<EpicColorKey>("inprogress");

  const m = useMutation({
    mutationFn: () =>
      createEpic({
        project_id: projectId,
        key,
        label,
        color,
        quarter,
        description,
        owner_id: owner || null,
      }),
    onSuccess: () => {
      toast.success("Épico criado.");
      onDone();
    },
    onError: (e) => toast.error(formatSupabaseError(e, "Erro ao criar épico.")),
  });

  return (
    <WidgetCard>
      <div className="grid gap-3 md:grid-cols-4">
        <Input placeholder="Chave (ex.: EP-1)" value={key} onChange={(e) => setKey(e.target.value)} />
        <Input
          className="md:col-span-2"
          placeholder="Título do épico"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
        />
        <Input placeholder="Quarter (ex.: Q3 2026)" value={quarter} onChange={(e) => setQuarter(e.target.value)} />
        <Textarea
          className="md:col-span-4"
          placeholder="Descrição"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <Select value={owner} onValueChange={setOwner}>
          <SelectTrigger className="md:col-span-2">
            <SelectValue placeholder="Dono do épico" />
          </SelectTrigger>
          <SelectContent>
            {members.map((mem) => (
              <SelectItem key={mem.id} value={mem.id}>
                {mem.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-2 md:col-span-2">
          <span className="text-xs text-muted-foreground">Cor:</span>
          {EPIC_COLOR_PRESET.map((c) => (
            <button
              key={c.key}
              type="button"
              aria-label={c.label}
              onClick={() => setColor(c.key)}
              className={cn(
                "h-6 w-6 rounded-md border-2",
                color === c.key ? "border-foreground" : "border-transparent",
              )}
              style={{ background: c.color }}
            />
          ))}
        </div>
      </div>
      <div className="mt-4 flex justify-end gap-2">
        <Button variant="ghost" onClick={onCancel}>
          Cancelar
        </Button>
        <Button
          disabled={!key.trim() || !label.trim() || m.isPending}
          onClick={() => m.mutate()}
        >
          Criar épico
        </Button>
      </div>
    </WidgetCard>
  );
}

/* ------------------------------------------------------------------ */

function EpicCard({
  epic,
  issues,
  unlinked,
  membersById,
  expanded,
  onToggle,
  onSelectIssue,
  onChanged,
}: {
  epic: EpicRow;
  issues: EpicIssue[];
  unlinked: EpicIssue[];
  membersById: Map<string, TeamMember>;
  expanded: boolean;
  onToggle: () => void;
  onSelectIssue: (id: string) => void;
  onChanged: () => void;
}) {
  const [search, setSearch] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const color = epicColor(epic.color);
  const stats = useMemo(() => computeEpicStats(issues), [issues]);
  const owner = epic.owner_id ? membersById.get(epic.owner_id) : undefined;

  const link = useMutation({
    mutationFn: (issueId: string) => linkIssueToEpic(issueId, epic.id),
    onSuccess: () => {
      toast.success("Issue vinculada ao épico.");
      onChanged();
    },
    onError: (e) => toast.error(formatSupabaseError(e, "Erro ao vincular issue.")),
  });

  const unlink = useMutation({
    mutationFn: (issueId: string) => linkIssueToEpic(issueId, null),
    onSuccess: () => {
      toast.success("Issue desvinculada.");
      onChanged();
    },
    onError: (e) => toast.error(formatSupabaseError(e, "Erro ao desvincular issue.")),
  });

  const create = useMutation({
    mutationFn: () =>
      createIssueInEpic({ projectId: epic.project_id, epicId: epic.id, title: newTitle }),
    onSuccess: () => {
      setNewTitle("");
      toast.success("Issue criada no épico.");
      onChanged();
    },
    onError: (e) => toast.error(formatSupabaseError(e, "Erro ao criar issue.")),
  });

  const matches = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return [];
    return unlinked.filter((i) => i.title.toLowerCase().includes(q)).slice(0, 8);
  }, [search, unlinked]);

  return (
    <WidgetCard style={{ borderTop: `3px solid ${color}` }}>
      <div className="flex flex-wrap items-start gap-4">
        <ProgressRing value={stats.progress} color={color} />

        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Chip label={epic.key} variant="custom" color={color} size="sm" dot />
            <h3 className="truncate text-sm font-semibold text-foreground">{epic.label}</h3>
            {epic.quarter ? <Chip label={epic.quarter} size="xs" /> : null}
            {owner ? (
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <MemberAvatar member={owner} size={20} /> {owner.name}
              </span>
            ) : null}
          </div>

          {epic.description ? (
            <p className="text-xs text-muted-foreground">{epic.description}</p>
          ) : null}

          <div className="flex flex-wrap items-center gap-1.5">
            {EPIC_STATUS_BUCKETS.map((b) => (
              <Chip
                key={b}
                size="xs"
                label={`${BUCKET_LABEL[b]}: ${stats.byBucket[b]}`}
                variant={b === "done" ? "success" : b === "in-progress" ? "accent" : "default"}
              />
            ))}
            <Chip size="xs" label={`${stats.points} pts`} variant="purple" />
            <span className="text-[11px] text-muted-foreground">
              {stats.done}/{stats.total} concluídas
            </span>
            <div className="ml-1 flex -space-x-2">
              {stats.assigneeIds.slice(0, 5).map((id) => (
                <MemberAvatar key={id} member={membersById.get(id)} size={22} />
              ))}
            </div>
          </div>
        </div>

        <Button variant="outline" size="sm" className="gap-1.5" onClick={onToggle}>
          {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          {expanded ? "Ocultar issues" : "Ver issues"}
        </Button>
      </div>

      {expanded ? (
        <div className="mt-4 space-y-3 border-t border-border pt-4">
          {issues.length === 0 ? (
            <p className="text-xs text-muted-foreground">Nenhuma issue vinculada ainda.</p>
          ) : (
            <ul className="space-y-1.5">
              {issues.map((i) => {
                const t = typeMeta(i.type);
                return (
                  <li
                    key={i.id}
                    className="flex items-center gap-2 rounded-md border border-border bg-panel-elevated px-3 py-2"
                  >
                    <button
                      type="button"
                      onClick={() => onSelectIssue(i.id)}
                      className="flex min-w-0 flex-1 items-center gap-2 text-left"
                    >
                      <Chip label={t.label} variant="custom" color={t.color} size="xs" dot />
                      <span className="truncate text-sm text-foreground">{i.title}</span>
                    </button>
                    <StatusBadge status={i.status} size="xs" />
                    {i.assignee_id ? (
                      <MemberAvatar member={membersById.get(i.assignee_id)} size={20} />
                    ) : null}
                    <Button
                      variant="ghost"
                      size="icon"
                      title="Desvincular"
                      onClick={() => unlink.mutate(i.id)}
                    >
                      <X size={14} />
                    </Button>
                  </li>
                );
              })}
            </ul>
          )}

          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1.5">
              <div className="relative">
                <Search
                  size={14}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
                />
                <Input
                  className="pl-8"
                  placeholder="Buscar issue para vincular…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              {matches.map((i) => (
                <button
                  key={i.id}
                  type="button"
                  onClick={() => {
                    setSearch("");
                    link.mutate(i.id);
                  }}
                  className="flex w-full items-center gap-2 rounded-md border border-border px-3 py-1.5 text-left text-xs hover:border-primary/40"
                >
                  <Chip
                    label={typeMeta(i.type).label}
                    variant="custom"
                    color={typeMeta(i.type).color}
                    size="xs"
                  />
                  <span className="truncate">{i.title}</span>
                </button>
              ))}
              {search.trim() && matches.length === 0 ? (
                <p className="text-[11px] text-muted-foreground">
                  Nenhuma issue livre encontrada.
                </p>
              ) : null}
            </div>

            <div className="flex items-start gap-2">
              <Input
                placeholder="Criar issue neste épico…"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && newTitle.trim()) create.mutate();
                }}
              />
              <Button
                disabled={!newTitle.trim() || create.isPending}
                onClick={() => create.mutate()}
                className="gap-1.5"
              >
                <Plus size={14} /> Criar
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </WidgetCard>
  );
}
