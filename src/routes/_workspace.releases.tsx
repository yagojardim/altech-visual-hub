import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, CalendarDays, ChevronDown, ChevronRight, Plus, Search, X } from "lucide-react";
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
  RELEASE_STATES,
  RELEASE_STATE_COLOR,
  RELEASE_STATE_LABEL,
  RELEASE_STATUS_BUCKETS,
  computeReleaseStats,
  createRelease,
  daysUntil,
  formatReleaseDate,
  linkIssueToRelease,
  listProjectIssuesForReleases,
  listReleases,
  releaseState,
  type ReleaseIssue,
  type ReleaseRow,
  type ReleaseState,
} from "@/lib/releases-api";

export const Route = createFileRoute("/_workspace/releases")({
  head: () => ({
    meta: [
      { title: "Releases — Altech Project" },
      {
        name: "description",
        content:
          "Planeje releases do projeto ativo, vincule issues e acompanhe progresso, prazo e status de entrega.",
      },
      { property: "og:title", content: "Releases — Altech Project" },
      {
        property: "og:description",
        content: "Versões, prazos e progresso das entregas do Altech Project.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ReleasesPage,
});

/* ------------------------------------------------------------------ */

function MemberAvatar({ member, size = 22 }: { member?: TeamMember; size?: number }) {
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

function ReleasesPage() {
  const qc = useQueryClient();
  const [projectId, setProjectId] = useState<string>("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [selectedIssue, setSelectedIssue] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const projectsQ = useQuery({ queryKey: ["projects", "releases"], queryFn: listProjects });
  const membersQ = useQuery({ queryKey: ["team_members", "releases"], queryFn: listTeamMembers });

  const projects = projectsQ.data ?? [];
  const activeProject = projectId || projects[0]?.id || "";

  const releasesQ = useQuery({
    queryKey: ["releases", activeProject],
    queryFn: () => listReleases(activeProject),
    enabled: Boolean(activeProject),
  });
  const issuesQ = useQuery({
    queryKey: ["releases", activeProject, "issues"],
    queryFn: () => listProjectIssuesForReleases(activeProject),
    enabled: Boolean(activeProject),
  });

  const membersById = useMemo(() => {
    const map = new Map<string, TeamMember>();
    for (const m of membersQ.data ?? []) map.set(m.id, m);
    return map;
  }, [membersQ.data]);

  const issuesByRelease = useMemo(() => {
    const map = new Map<string, ReleaseIssue[]>();
    for (const i of issuesQ.data ?? []) {
      if (!i.release_id) continue;
      const list = map.get(i.release_id) ?? [];
      list.push(i);
      map.set(i.release_id, list);
    }
    return map;
  }, [issuesQ.data]);

  const unlinked = useMemo(
    () => (issuesQ.data ?? []).filter((i) => !i.release_id),
    [issuesQ.data],
  );

  const refresh = () => {
    void qc.invalidateQueries({ queryKey: ["releases", activeProject] });
  };

  const loading = projectsQ.isLoading || releasesQ.isLoading || issuesQ.isLoading;
  const error = projectsQ.error ?? releasesQ.error ?? issuesQ.error;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Releases</h1>
          <p className="text-sm text-muted-foreground">
            Planeje versões, vincule issues e acompanhe o progresso das entregas.
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
            <Plus size={16} /> Nova release
          </Button>
        </div>
      </header>

      {creating && activeProject ? (
        <CreateReleaseForm
          projectId={activeProject}
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
            <LoadingState label="Carregando releases…" />
          ) : error ? (
            <ErrorState
              description={formatSupabaseError(error)}
              onRetry={() => {
                void releasesQ.refetch();
                void issuesQ.refetch();
              }}
            />
          ) : (releasesQ.data ?? []).length === 0 ? (
            <EmptyState
              title="Nenhuma release neste projeto"
              description="Crie uma release para agrupar as issues que serão entregues em uma versão."
            />
          ) : (
            (releasesQ.data ?? []).map((release) => (
              <ReleaseCard
                key={release.id}
                release={release}
                issues={issuesByRelease.get(release.id) ?? []}
                unlinked={unlinked}
                membersById={membersById}
                expanded={expanded === release.id}
                onToggle={() =>
                  setExpanded((cur) => (cur === release.id ? null : release.id))
                }
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
              originPath="/releases"
              onChange={refresh}
            />
          </WidgetCard>
        ) : null}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function CreateReleaseForm({
  projectId,
  onDone,
  onCancel,
}: {
  projectId: string;
  onDone: () => void;
  onCancel: () => void;
}) {
  const [version, setVersion] = useState("");
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [state, setState] = useState<ReleaseState>("planned");
  const [notes, setNotes] = useState("");

  const m = useMutation({
    mutationFn: () =>
      createRelease({
        project_id: projectId,
        version,
        name,
        release_date: date || null,
        state,
        notes,
      }),
    onSuccess: () => {
      toast.success("Release criada.");
      onDone();
    },
    onError: (e) => toast.error(formatSupabaseError(e, "Erro ao criar release.")),
  });

  return (
    <WidgetCard>
      <div className="grid gap-3 md:grid-cols-4">
        <Input
          placeholder="Versão (ex.: v1.2.0)"
          value={version}
          onChange={(e) => setVersion(e.target.value)}
        />
        <Input
          className="md:col-span-2"
          placeholder="Nome da release"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        <Select value={state} onValueChange={(v) => setState(v as ReleaseState)}>
          <SelectTrigger>
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            {RELEASE_STATES.map((s) => (
              <SelectItem key={s} value={s}>
                {RELEASE_STATE_LABEL[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Textarea
          className="md:col-span-3"
          placeholder="Notas da release"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>
      <div className="mt-4 flex justify-end gap-2">
        <Button variant="ghost" onClick={onCancel}>
          Cancelar
        </Button>
        <Button disabled={!version.trim() || m.isPending} onClick={() => m.mutate()}>
          Criar release
        </Button>
      </div>
    </WidgetCard>
  );
}

/* ------------------------------------------------------------------ */

function ReleaseCard({
  release,
  issues,
  unlinked,
  membersById,
  expanded,
  onToggle,
  onSelectIssue,
  onChanged,
}: {
  release: ReleaseRow;
  issues: ReleaseIssue[];
  unlinked: ReleaseIssue[];
  membersById: Map<string, TeamMember>;
  expanded: boolean;
  onToggle: () => void;
  onSelectIssue: (id: string) => void;
  onChanged: () => void;
}) {
  const [search, setSearch] = useState("");
  const state = releaseState(release.state);
  const color = RELEASE_STATE_COLOR[state];
  const stats = useMemo(() => computeReleaseStats(issues), [issues]);
  const remaining = daysUntil(release.release_date);
  const showCountdown = state === "in-progress" && remaining !== null;
  const urgent = showCountdown && (remaining as number) <= 7;

  const link = useMutation({
    mutationFn: (issueId: string) => linkIssueToRelease(issueId, release.id),
    onSuccess: () => {
      toast.success("Issue vinculada à release.");
      onChanged();
    },
    onError: (e) => toast.error(formatSupabaseError(e, "Erro ao vincular issue.")),
  });

  const unlink = useMutation({
    mutationFn: (issueId: string) => linkIssueToRelease(issueId, null),
    onSuccess: () => {
      toast.success("Issue desvinculada.");
      onChanged();
    },
    onError: (e) => toast.error(formatSupabaseError(e, "Erro ao desvincular issue.")),
  });

  const matches = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return [];
    return unlinked.filter((i) => i.title.toLowerCase().includes(q)).slice(0, 8);
  }, [search, unlinked]);

  return (
    <WidgetCard
      style={{
        borderTop: `3px solid ${color}`,
        opacity: state === "released" ? 0.85 : 1,
      }}
    >
      <div className="flex flex-wrap items-start gap-4">
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Chip label={release.version} variant="custom" color={color} size="sm" dot />
            <h3 className="truncate text-sm font-semibold text-foreground">
              {release.name || "Sem nome"}
            </h3>
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <CalendarDays size={13} /> {formatReleaseDate(release.release_date)}
            </span>
            <Chip label={RELEASE_STATE_LABEL[state]} variant="custom" color={color} size="xs" />
            {showCountdown ? (
              <Chip
                size="xs"
                variant={urgent ? "crit" : "accent"}
                icon={urgent ? <AlertTriangle size={11} /> : undefined}
                label={
                  (remaining as number) < 0
                    ? `${Math.abs(remaining as number)} dias de atraso`
                    : (remaining as number) === 0
                      ? "Lança hoje"
                      : `Faltam ${remaining} dias`
                }
              />
            ) : null}
          </div>

          {release.notes ? (
            <p className="text-xs text-muted-foreground">{release.notes}</p>
          ) : null}

          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] text-muted-foreground">
              <span>
                {stats.done}/{stats.total} issues concluídas
              </span>
              <span>{stats.progress}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-border">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${stats.progress}%`,
                  background: color,
                  transition: "width .4s ease",
                }}
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {RELEASE_STATUS_BUCKETS.map((b) => (
              <Chip
                key={b}
                size="xs"
                label={`${BUCKET_LABEL[b]}: ${stats.byBucket[b]}`}
                variant={b === "done" ? "success" : b === "in-progress" ? "accent" : "default"}
              />
            ))}
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

          <div className="space-y-1.5 md:max-w-md">
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
        </div>
      ) : null}
    </WidgetCard>
  );
}
