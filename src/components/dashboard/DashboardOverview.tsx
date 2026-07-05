/**
 * Altech Project — Dashboard Overview.
 *
 * Layout base (referência):
 *  1) 4 KPIs no topo
 *  2) Saúde dos projetos + Velocidade por sprint
 *  3) Carga do time
 *
 * Todos os dados vêm do Supabase (@supabase/supabase-js).
 */
import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, FolderKanban, Gauge, ListChecks, Timer } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { pickAvatarColor } from "@/lib/team-members-api";
import { formatSupabaseError } from "@/lib/supabase-errors";
import { WidgetCard } from "@/components/dashboard/WidgetCard";
import { WidgetHeader } from "@/components/dashboard/WidgetHeader";
import { LoadingState, EmptyState } from "@/components/states";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

const DONE = new Set(["done", "concluido", "concluído", "completed", "closed", "resolved"]);
const ACTIVE_SPRINT = new Set(["ativa", "ativo", "em andamento", "andamento", "iniciada", "active", "in_progress"]);
const INACTIVE_PROJECT = new Set(["arquivado", "arquivada", "concluido", "concluído", "cancelado", "encerrado"]);

function isDone(s?: string | null) {
  return !!s && DONE.has(s.toLowerCase());
}

interface Project { id: string; name: string; status: string | null; created_at: string | null }
interface Sprint { id: string; name: string; status: string | null; project_id: string | null; start_date: string | null; end_date: string | null }
interface Item { id: string; project_id: string | null; status: string | null; type: string | null; assignee_id: string | null }
interface Member { id: string; name: string; avatar_color: string | null }
interface SprintItem { sprint_id: string; work_item_id: string }

interface OverviewData {
  projects: Project[];
  sprints: Sprint[];
  items: Item[];
  members: Member[];
  sprintItems: SprintItem[];
}

export function DashboardOverview() {
  const [data, setData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const [p, s, w, m, si] = await Promise.all([
          supabase.from("projects").select("id, name, status, created_at"),
          supabase.from("sprints").select("id, name, status, project_id, start_date, end_date").order("start_date", { ascending: true }),
          supabase.from("work_items").select("id, project_id, status, type, assignee_id"),
          supabase.from("team_members").select("id, name, avatar_color"),
          supabase.from("sprint_items").select("sprint_id, work_item_id"),
        ]);
        const err = p.error || s.error || w.error || m.error || si.error;
        if (err) throw err;
        if (cancelled) return;
        setData({
          projects: (p.data ?? []) as Project[],
          sprints: (s.data ?? []) as Sprint[],
          items: (w.data ?? []) as Item[],
          members: (m.data ?? []) as Member[],
          sprintItems: (si.data ?? []) as SprintItem[],
        });
      } catch (e) {
        if (!cancelled) setError(formatSupabaseError(e) || "Falha ao carregar dashboard");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const metrics = useMemo(() => computeMetrics(data), [data]);

  if (loading) return <LoadingState label="Carregando dashboard…" variant="skeleton" rows={4} />;
  if (error) return <EmptyState title="Não foi possível carregar" description={error} />;
  if (!data || !metrics) return null;

  return (
    <div className="space-y-4">
      {/* Row 1 — KPIs */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Projetos ativos"
          value={metrics.activeProjects}
          icon={FolderKanban}
          severity="info"
        />
        <KpiCard
          label="Velocidade média"
          value={metrics.avgVelocity != null ? `${metrics.avgVelocity}` : "—"}
          icon={Gauge}
          severity="default"
        />
        <KpiCard
          label="Histórias entregues"
          value={metrics.storiesDone}
          icon={ListChecks}
          severity="success"
        />
        <KpiCard
          label="Sprints em risco"
          value={`${metrics.sprintsAtRisk} de ${metrics.activeSprintsCount}`}
          icon={AlertTriangle}
          severity={metrics.sprintsAtRisk > 0 ? "warning" : "success"}
        />
      </div>

      {/* Row 2 — Project Health + Velocity */}
      <div className="grid gap-4 lg:grid-cols-2">
        <ProjectHealthWidget projects={metrics.projectHealth} />
        <SprintVelocityWidget sprints={metrics.velocityBySprint} average={metrics.avgVelocity ?? 0} />
      </div>

      {/* Row 3 — Team load */}
      <TeamLoadWidget members={metrics.teamLoad} />
    </div>
  );
}

// ----------------------------------------------------------------------------
// Metrics
// ----------------------------------------------------------------------------

interface ProjectHealth {
  id: string;
  name: string;
  progress: number;
  status: "on-track" | "at-risk" | "delayed" | "done";
  daysLeft: number | null;
  label: string;
}

interface TeamLoadRow {
  id: string;
  name: string;
  color: string;
  load: number;
  max: number;
}

interface VelocityBar {
  id: string;
  label: string;
  value: number;
  isCurrent: boolean;
}

function computeMetrics(data: OverviewData | null) {
  if (!data) return null;
  const activeProjects = data.projects.filter((p) => !INACTIVE_PROJECT.has((p.status ?? "").toLowerCase())).length;
  const activeSprints = data.sprints.filter((s) => ACTIVE_SPRINT.has((s.status ?? "").toLowerCase()));
  const activeSprintsCount = activeSprints.length;

  // items indexed by sprint
  const itemById = new Map(data.items.map((i) => [i.id, i]));
  const itemsBySprint = new Map<string, Item[]>();
  for (const link of data.sprintItems) {
    const it = itemById.get(link.work_item_id);
    if (!it) continue;
    const arr = itemsBySprint.get(link.sprint_id) ?? [];
    arr.push(it);
    itemsBySprint.set(link.sprint_id, arr);
  }

  // Velocidade por sprint = itens concluídos
  const velocityBySprint: VelocityBar[] = data.sprints
    .filter((s) => (s.status ?? "").toLowerCase() !== "planejada" || (itemsBySprint.get(s.id)?.length ?? 0) > 0)
    .slice(-8)
    .map((s) => {
      const its = itemsBySprint.get(s.id) ?? [];
      return {
        id: s.id,
        label: shortSprintLabel(s.name),
        value: its.filter((i) => isDone(i.status)).length,
        isCurrent: ACTIVE_SPRINT.has((s.status ?? "").toLowerCase()),
      };
    });

  const completedSprints = velocityBySprint.filter((v) => !v.isCurrent && v.value > 0);
  const avgVelocity = completedSprints.length
    ? Math.round(completedSprints.reduce((a, b) => a + b.value, 0) / completedSprints.length)
    : velocityBySprint.length
    ? Math.round(velocityBySprint.reduce((a, b) => a + b.value, 0) / velocityBySprint.length)
    : null;

  // Histórias entregues (type=story, done)
  const storiesDone = data.items.filter((i) => (i.type ?? "").toLowerCase() === "story" && isDone(i.status)).length;

  // Sprints em risco: ativa + dias restantes <= 3 e progresso < 60%
  const now = Date.now();
  let sprintsAtRisk = 0;
  for (const s of activeSprints) {
    const its = itemsBySprint.get(s.id) ?? [];
    const total = its.length || 1;
    const done = its.filter((i) => isDone(i.status)).length;
    const progress = done / total;
    const end = s.end_date ? new Date(s.end_date).getTime() : null;
    const daysLeft = end ? Math.round((end - now) / 86_400_000) : null;
    if ((daysLeft != null && daysLeft < 0) || (daysLeft != null && daysLeft <= 3 && progress < 0.6) || progress < 0.3) {
      sprintsAtRisk++;
    }
  }

  // Project health
  const itemsByProject = new Map<string, Item[]>();
  for (const it of data.items) {
    if (!it.project_id) continue;
    const arr = itemsByProject.get(it.project_id) ?? [];
    arr.push(it);
    itemsByProject.set(it.project_id, arr);
  }
  const projectHealth: ProjectHealth[] = data.projects
    .filter((p) => !INACTIVE_PROJECT.has((p.status ?? "").toLowerCase()) || (p.status ?? "").toLowerCase() === "concluido")
    .slice(0, 6)
    .map((p) => {
      const its = itemsByProject.get(p.id) ?? [];
      const total = its.length;
      const done = its.filter((i) => isDone(i.status)).length;
      const progress = total ? Math.round((done / total) * 100) : 0;
      // approximate days-left via next active sprint
      const projSprints = data.sprints.filter((s) => s.project_id === p.id && s.end_date);
      const nextEnd = projSprints
        .map((s) => new Date(s.end_date!).getTime())
        .filter((t) => t >= now)
        .sort((a, b) => a - b)[0];
      const daysLeft = nextEnd ? Math.max(0, Math.round((nextEnd - now) / 86_400_000)) : null;
      const status: ProjectHealth["status"] =
        progress >= 100
          ? "done"
          : progress < 30
          ? "delayed"
          : progress < 60
          ? "at-risk"
          : "on-track";
      return {
        id: p.id,
        name: p.name,
        progress,
        status,
        daysLeft,
        label: progress >= 100 ? "Entregue" : daysLeft != null ? `${daysLeft} dias` : "—",
      };
    });

  // Team load — count of open items per assignee
  const loadByMember = new Map<string, number>();
  for (const i of data.items) {
    if (!i.assignee_id || isDone(i.status)) continue;
    loadByMember.set(i.assignee_id, (loadByMember.get(i.assignee_id) ?? 0) + 1);
  }
  const maxLoad = Math.max(1, ...Array.from(loadByMember.values()));
  const teamLoad: TeamLoadRow[] = data.members
    .map((m) => ({
      id: m.id,
      name: m.name,
      color: m.avatar_color || pickAvatarColor(m.id),
      load: loadByMember.get(m.id) ?? 0,
      max: maxLoad,
    }))
    .filter((r) => r.load > 0)
    .sort((a, b) => b.load - a.load)
    .slice(0, 8);

  return {
    activeProjects,
    activeSprintsCount,
    sprintsAtRisk,
    avgVelocity,
    storiesDone,
    velocityBySprint,
    projectHealth,
    teamLoad,
  };
}

function shortSprintLabel(name: string) {
  const m = name.match(/(\d+)/);
  return m ? `S${m[1]}` : name.slice(0, 4);
}

// ----------------------------------------------------------------------------
// Sub-widgets
// ----------------------------------------------------------------------------

function ProgressRing({ value, color }: { value: number; color: string }) {
  const r = 22;
  const c = 2 * Math.PI * r;
  const offset = c - (Math.min(100, Math.max(0, value)) / 100) * c;
  return (
    <svg width="56" height="56" viewBox="0 0 56 56" aria-hidden="true">
      <circle cx="28" cy="28" r={r} fill="none" stroke="var(--border)" strokeWidth="5" />
      <circle
        cx="28"
        cy="28"
        r={r}
        fill="none"
        stroke={color}
        strokeWidth="5"
        strokeDasharray={c}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform="rotate(-90 28 28)"
      />
      <text
        x="28"
        y="32"
        textAnchor="middle"
        className="fill-foreground"
        style={{ fontSize: 12, fontWeight: 600 }}
      >
        {value}%
      </text>
    </svg>
  );
}

function healthColor(status: ProjectHealth["status"]) {
  switch (status) {
    case "on-track": return "var(--success-500, #10b981)";
    case "at-risk": return "var(--warning-500, #f59e0b)";
    case "delayed": return "var(--danger-500, #ef4444)";
    case "done": return "var(--blue-500, #3b82f6)";
  }
}

function ProjectHealthWidget({ projects }: { projects: ProjectHealth[] }) {
  return (
    <WidgetCard className="!rounded-lg keep-radius">
      <WidgetHeader title="Saúde dos projetos" />
      {projects.length === 0 ? (
        <div className="mt-3"><EmptyState title="Sem projetos" description="Nenhum projeto ativo encontrado." /></div>
      ) : (
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {projects.map((p) => {
            const color = healthColor(p.status);
            return (
              <div key={p.id} className="flex items-center gap-3 rounded-lg border border-border bg-panel/40 p-3">
                <ProgressRing value={p.progress} color={color} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-foreground">{p.name}</div>
                  <div className="mt-0.5 text-xs text-muted-foreground">{p.label}</div>
                  <div className="mt-1 flex items-center gap-1.5">
                    <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color }} />
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      {p.status === "on-track" ? "No prazo" : p.status === "at-risk" ? "Atenção" : p.status === "delayed" ? "Atrasado" : "Entregue"}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </WidgetCard>
  );
}

function SprintVelocityWidget({ sprints, average }: { sprints: VelocityBar[]; average: number }) {
  const max = Math.max(1, ...sprints.map((s) => s.value));
  return (
    <WidgetCard className="!rounded-lg keep-radius">
      <div className="flex items-start justify-between">
        <WidgetHeader title="Velocidade por sprint" icon={Timer} />
        <span className="text-xs text-muted-foreground">Média: {average} itens</span>
      </div>
      {sprints.length === 0 ? (
        <div className="mt-3"><EmptyState title="Sem sprints" description="Nenhuma sprint com itens registrada." /></div>
      ) : (
        <>
          <div className="mt-4 flex h-40 items-end justify-between gap-2">
            {sprints.map((s) => {
              const h = Math.max(6, (s.value / max) * 100);
              return (
                <div key={s.id} className="flex flex-1 flex-col items-center gap-1.5">
                  <span className="text-[10px] font-medium text-muted-foreground">{s.value}</span>
                  <div
                    className={cn(
                      "w-full rounded-t-md transition-all",
                      s.isCurrent ? "bg-[var(--success-500,#10b981)]" : "bg-primary/70",
                    )}
                    style={{ height: `${h}%` }}
                    aria-label={`${s.label}: ${s.value} itens`}
                  />
                  <span className="text-[10px] text-muted-foreground">{s.label}</span>
                </div>
              );
            })}
          </div>
          <div className="mt-3 flex items-center justify-end gap-3 text-[10px] text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-sm bg-primary/70" /> Anteriores
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-sm bg-[var(--success-500,#10b981)]" /> Atual
            </span>
          </div>
        </>
      )}
    </WidgetCard>
  );
}

function TeamLoadWidget({ members }: { members: TeamLoadRow[] }) {
  return (
    <WidgetCard className="!rounded-lg keep-radius">
      <WidgetHeader title="Carga do time" />
      {members.length === 0 ? (
        <div className="mt-3"><EmptyState title="Sem carga" description="Nenhum item aberto atribuído no momento." /></div>
      ) : (
        <ul className="mt-3 space-y-2.5">
          {members.map((m) => {
            const pct = Math.max(6, (m.load / m.max) * 100);
            const initials = m.name.split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("");
            return (
              <li key={m.id} className="flex items-center gap-3">
                <Avatar className="h-7 w-7">
                  <AvatarFallback className="text-[10px] font-medium text-white" style={{ backgroundColor: m.color }}>
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="w-28 truncate text-sm text-foreground">{m.name}</div>
                <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-panel">
                  <div
                    className="absolute inset-y-0 left-0 rounded-full"
                    style={{ width: `${pct}%`, backgroundColor: m.color }}
                  />
                </div>
                <div className="w-14 text-right text-xs font-medium tabular-nums" style={{ color: m.color }}>
                  {m.load} it
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </WidgetCard>
  );
}
