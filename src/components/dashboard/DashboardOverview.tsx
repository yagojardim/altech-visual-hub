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
import { ProjectPortfolioSection } from "@/components/dashboard/ProjectPortfolioSection";
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
          trend={
            metrics.projectsDelta !== 0
              ? {
                  value: Math.abs(metrics.projectsDelta),
                  direction: metrics.projectsDelta > 0 ? "up" : "down",
                }
              : undefined
          }
          caption="vs. mês anterior"
          footer={<MiniBars values={metrics.monthlyProjects} />}
        />
        <KpiCard
          label="Velocidade média"
          value={metrics.avgVelocity != null ? `${metrics.avgVelocity}` : "—"}
          icon={Gauge}
          severity="default"
          caption={
            metrics.stabilitySprints > 0
              ? `${metrics.stability} — ${metrics.stabilitySprints} sprints`
              : "Sem histórico ainda"
          }
          footer={<MiniProgress value={metrics.velocityRatio} />}
        />
        <KpiCard
          label="Histórias entregues"
          value={metrics.storiesDone}
          icon={ListChecks}
          severity="success"
          trend={
            metrics.storiesTotal > 0
              ? { value: metrics.storiesPct, direction: "up" }
              : undefined
          }
          caption="este trimestre"
          footer={
            metrics.storiesTotal > 0 ? (
              <span className="inline-flex items-center rounded-md bg-[var(--success-500,#10b981)]/15 px-2 py-0.5 text-[11px] font-medium text-[var(--success-500,#10b981)]">
                Meta: {metrics.storiesTarget} — {metrics.storiesPct}%
              </span>
            ) : null
          }
        />
        <KpiCard
          label="Sprints em risco"
          value={`${metrics.sprintsAtRisk} de ${metrics.activeSprintsCount}`}
          icon={AlertTriangle}
          severity={metrics.sprintsAtRisk > 0 ? "warning" : "success"}
          caption={
            metrics.activeSprintsCount === 0
              ? "Sem sprints ativas"
              : metrics.sprintsAtRisk > 0
              ? "Requer atenção"
              : "Tudo dentro do prazo"
          }
          footer={<DotBars dots={metrics.sprintDots} />}
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

  // Mini-histograma de projetos criados nos últimos 6 meses
  const monthlyProjects: number[] = new Array(6).fill(0);
  const nowDate = new Date();
  for (const p of data.projects) {
    if (!p.created_at) continue;
    const d = new Date(p.created_at);
    const diffMonths =
      (nowDate.getFullYear() - d.getFullYear()) * 12 + (nowDate.getMonth() - d.getMonth());
    if (diffMonths >= 0 && diffMonths < 6) monthlyProjects[5 - diffMonths] += 1;
  }
  const projectsThisMonth = monthlyProjects[5];
  const projectsLastMonth = monthlyProjects[4];
  const projectsDelta = projectsThisMonth - projectsLastMonth;

  // Velocidade — estabilidade (desvio padrão relativo) e nº de sprints considerados
  const velocityValues = completedSprints.map((v) => v.value);
  const velocityStddev = stddev(velocityValues);
  const stability =
    velocityValues.length < 2 || avgVelocity == null || avgVelocity === 0
      ? "—"
      : velocityStddev / avgVelocity < 0.2
      ? "Estável"
      : velocityStddev / avgVelocity < 0.4
      ? "Consistente"
      : "Variável";
  const maxVelocity = Math.max(1, ...velocityBySprint.map((v) => v.value));
  const velocityRatio = avgVelocity != null ? Math.min(1, avgVelocity / maxVelocity) : 0;

  // Histórias — total e meta (95% do total como referência)
  const storiesTotal = data.items.filter((i) => (i.type ?? "").toLowerCase() === "story").length;
  const storiesTarget = Math.max(storiesDone, Math.ceil(storiesTotal * 0.95));
  const storiesPct = storiesTarget > 0 ? Math.round((storiesDone / storiesTarget) * 100) : 0;

  // Sprints em risco — status por sprint ativa
  const sprintDots = activeSprints.map((s) => {
    const its = itemsBySprint.get(s.id) ?? [];
    const total = its.length || 1;
    const done = its.filter((i) => isDone(i.status)).length;
    const progress = done / total;
    const end = s.end_date ? new Date(s.end_date).getTime() : null;
    const daysLeft = end ? Math.round((end - now) / 86_400_000) : null;
    const atRisk =
      (daysLeft != null && daysLeft < 0) ||
      (daysLeft != null && daysLeft <= 3 && progress < 0.6) ||
      progress < 0.3;
    return atRisk ? "warning" : "success";
  });

  return {
    activeProjects,
    activeSprintsCount,
    sprintsAtRisk,
    avgVelocity,
    storiesDone,
    velocityBySprint,
    projectHealth,
    teamLoad,
    // Footer KPI details
    monthlyProjects,
    projectsDelta,
    stability,
    stabilitySprints: velocityValues.length,
    velocityRatio,
    storiesTotal,
    storiesTarget,
    storiesPct,
    sprintDots,
  };
}

function stddev(vals: number[]) {
  if (vals.length < 2) return 0;
  const m = vals.reduce((a, b) => a + b, 0) / vals.length;
  const v = vals.reduce((a, b) => a + (b - m) ** 2, 0) / vals.length;
  return Math.sqrt(v);
}

function shortSprintLabel(name: string) {
  const m = name.match(/(\d+)/);
  return m ? `S${m[1]}` : name.slice(0, 4);
}

// ----------------------------------------------------------------------------
// Sub-widgets
// ----------------------------------------------------------------------------

function ProgressRing({ value, color }: { value: number; color: string }) {
  const r = 20;
  const c = 2 * Math.PI * r;
  const offset = c - (Math.min(100, Math.max(0, value)) / 100) * c;
  return (
    <svg width="52" height="52" viewBox="0 0 52 52" aria-hidden="true">
      <circle cx="26" cy="26" r={r} fill="none" stroke="var(--border)" strokeWidth="4" opacity="0.35" />
      <circle
        cx="26"
        cy="26"
        r={r}
        fill="none"
        stroke={color}
        strokeWidth="4"
        strokeDasharray={c}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform="rotate(-90 26 26)"
      />
      <text
        x="26"
        y="30"
        textAnchor="middle"
        style={{ fontSize: 11, fontWeight: 700, fill: color }}
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
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {projects.map((p) => {
            const color = healthColor(p.status);
            return (
              <div
                key={p.id}
                className="flex items-center gap-3 rounded-xl bg-muted/40 p-3"
              >
                <ProgressRing value={p.progress} color={color} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold text-foreground">{p.name}</div>
                  <div className="mt-0.5 text-xs text-muted-foreground">{p.label}</div>
                  <span
                    className="mt-2 inline-block h-1.5 w-1.5 rounded-full"
                    style={{ backgroundColor: color }}
                    aria-hidden="true"
                  />
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
  const lastPrevIndex = (() => {
    for (let i = sprints.length - 1; i >= 0; i--) if (!sprints[i].isCurrent) return i;
    return -1;
  })();
  return (
    <WidgetCard className="!rounded-lg keep-radius">
      <div className="flex items-start justify-between">
        <WidgetHeader title="Velocidade por sprint" />
        <span className="text-xs font-medium text-[var(--blue-500,#3b82f6)]">
          Média: {average} pts
        </span>
      </div>
      {sprints.length === 0 ? (
        <div className="mt-3"><EmptyState title="Sem sprints" description="Nenhuma sprint com itens registrada." /></div>
      ) : (
        <>
          <div className="mt-6 flex h-40 items-end justify-between gap-3">
            {sprints.map((s, i) => {
              const h = Math.max(10, (s.value / max) * 100);
              const bg = s.isCurrent
                ? "var(--success-500,#10b981)"
                : i === lastPrevIndex
                ? "var(--blue-500,#3b82f6)"
                : "color-mix(in oklab, var(--blue-500,#3b82f6) 35%, transparent)";
              return (
                <div key={s.id} className="flex flex-1 flex-col items-center gap-2">
                  <span className="text-[11px] font-semibold text-muted-foreground">{s.value}</span>
                  <div
                    className="w-full rounded-lg transition-all"
                    style={{ height: `${h}%`, backgroundColor: bg }}
                    aria-label={`${s.label}: ${s.value} pts`}
                  />
                  <span className="text-[10px] text-muted-foreground">{s.label}</span>
                </div>
              );
            })}
          </div>
          <div className="mt-4 flex items-center justify-end gap-4 text-[11px] text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm bg-[var(--blue-500,#3b82f6)]" /> Anteriores
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm bg-[var(--success-500,#10b981)]" /> Atual
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

// ----------------------------------------------------------------------------
// KPI footer helpers
// ----------------------------------------------------------------------------

function MiniBars({ values }: { values: number[] }) {
  const max = Math.max(1, ...values);
  return (
    <div className="flex h-6 items-end gap-1">
      {values.map((v, i) => {
        const isLast = i === values.length - 1;
        const h = Math.max(15, (v / max) * 100);
        return (
          <div
            key={i}
            className={cn(
              "w-3 rounded-sm",
              isLast ? "bg-[var(--blue-500,#3b82f6)]" : "bg-[var(--blue-500,#3b82f6)]/25",
            )}
            style={{ height: `${h}%` }}
            aria-hidden="true"
          />
        );
      })}
    </div>
  );
}

function MiniProgress({ value }: { value: number }) {
  const pct = Math.max(0, Math.min(1, value)) * 100;
  return (
    <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-panel">
      <div
        className="absolute inset-y-0 left-0 rounded-full"
        style={{
          width: `${pct}%`,
          background:
            "linear-gradient(90deg, var(--blue-500,#3b82f6), var(--success-500,#10b981))",
        }}
      />
    </div>
  );
}

function DotBars({ dots }: { dots: Array<"success" | "warning"> }) {
  if (dots.length === 0) {
    return (
      <div className="flex h-1.5 items-center gap-1">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-1.5 flex-1 rounded-full bg-panel" />
        ))}
      </div>
    );
  }
  return (
    <div className="flex h-1.5 items-center gap-1">
      {dots.map((d, i) => (
        <div
          key={i}
          className="h-1.5 flex-1 rounded-full"
          style={{
            backgroundColor:
              d === "warning"
                ? "var(--warning-500, #f59e0b)"
                : "var(--success-500, #10b981)",
          }}
        />
      ))}
    </div>
  );
}
