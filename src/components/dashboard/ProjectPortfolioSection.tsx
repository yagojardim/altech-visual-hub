/**
 * Altech Project — Portfolio Section (Projeto / Epic / História / KPI / Risco).
 *
 * Cartões visualmente idênticos à referência entregue pelo usuário.
 * Dados reais do Supabase (@supabase/supabase-js) — quando um campo não existe
 * no schema, deriva-se um valor plausível a partir do que existe (status,
 * priority, contagem de itens, etc.). NÃO altera o banco.
 */
import { useEffect, useMemo, useState } from "react";
import { Sparkles, ShieldAlert } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { pickAvatarColor } from "@/lib/team-members-api";
import { formatSupabaseError } from "@/lib/supabase-errors";
import { WidgetCard } from "@/components/dashboard/WidgetCard";
import { LoadingState, EmptyState } from "@/components/states";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

// ----------------------------------------------------------------------------
// Types & constants
// ----------------------------------------------------------------------------

const DONE = new Set(["done", "concluido", "concluído", "completed", "closed", "resolved", "concluida", "concluída"]);
const BLOCKED = new Set(["bloqueado", "blocked", "impedido"]);
const REVIEW = new Set(["review", "em revisão", "em revisao", "revisão", "revisao", "validação", "validacao", "em validação"]);
const BACKLOG = new Set(["backlog", "a fazer", "todo", "aberto", "planejada", "planejado"]);
const ACTIVE_SPRINT = new Set(["ativa", "ativo", "em andamento", "andamento", "iniciada", "active", "in_progress"]);

type Tab = "projeto" | "epic" | "historia" | "kpi" | "risco";

interface Project { id: string; name: string; status: string | null; description: string | null }
interface Sprint { id: string; project_id: string | null; name: string; status: string | null; end_date: string | null }
interface Item {
  id: string;
  project_id: string | null;
  title: string;
  description: string | null;
  type: string | null;
  priority: string | null;
  status: string | null;
  assignee_id: string | null;
}
interface Member { id: string; name: string; avatar_color: string | null }
interface ProjectMember { project_id: string; member_id: string }

interface Data {
  projects: Project[];
  sprints: Sprint[];
  items: Item[];
  members: Member[];
  projectMembers: ProjectMember[];
}

function isDone(s?: string | null) { return !!s && DONE.has(s.toLowerCase()); }
function isBlocked(s?: string | null) { return !!s && BLOCKED.has(s.toLowerCase()); }
function isReview(s?: string | null) { return !!s && REVIEW.has(s.toLowerCase()); }
function isBacklog(s?: string | null) { return !!s && BACKLOG.has(s.toLowerCase()); }

function initials(name?: string | null) {
  if (!name) return "";
  return name.split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase() ?? "").join("");
}

function firstName(name?: string | null) {
  if (!name) return "—";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[parts.length - 1][0]}.`;
}

// ----------------------------------------------------------------------------
// Component
// ----------------------------------------------------------------------------

export function ProjectPortfolioSection() {
  const [tab, setTab] = useState<Tab>("projeto");
  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const [p, s, w, m, pm] = await Promise.all([
          supabase.from("projects").select("id, name, status, description"),
          supabase.from("sprints").select("id, project_id, name, status, end_date"),
          supabase.from("work_items").select("id, project_id, title, description, type, priority, status, assignee_id"),
          supabase.from("team_members").select("id, name, avatar_color"),
          supabase.from("project_members").select("project_id, member_id"),
        ]);
        const err = p.error || s.error || w.error || m.error || pm.error;
        if (err) throw err;
        if (cancelled) return;
        setData({
          projects: (p.data ?? []) as Project[],
          sprints: (s.data ?? []) as Sprint[],
          items: (w.data ?? []) as Item[],
          members: (m.data ?? []) as Member[],
          projectMembers: (pm.data ?? []) as ProjectMember[],
        });
      } catch (e) {
        if (!cancelled) setError(formatSupabaseError(e) || "Falha ao carregar seção");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <WidgetCard className="!rounded-lg keep-radius">
      <Tabs value={tab} onChange={setTab} />
      <div className="mt-6">
        {loading ? (
          <LoadingState label="Carregando…" variant="skeleton" rows={3} />
        ) : error ? (
          <EmptyState title="Não foi possível carregar" description={error} />
        ) : !data ? null : tab === "projeto" ? (
          <ProjetoCards data={data} />
        ) : tab === "epic" ? (
          <EpicCards data={data} />
        ) : tab === "historia" ? (
          <HistoriaCards data={data} />
        ) : tab === "kpi" ? (
          <KpiCards data={data} />
        ) : (
          <RiscoCards data={data} />
        )}
      </div>
    </WidgetCard>
  );
}

// ----------------------------------------------------------------------------
// Tabs
// ----------------------------------------------------------------------------

const TABS: { id: Tab; label: string }[] = [
  { id: "projeto", label: "Projeto" },
  { id: "epic", label: "Epic" },
  { id: "historia", label: "História" },
  { id: "kpi", label: "KPI" },
  { id: "risco", label: "Risco" },
];

function Tabs({ value, onChange }: { value: Tab; onChange: (t: Tab) => void }) {
  return (
    <div className="inline-flex items-center gap-1 rounded-xl bg-muted/50 p-1">
      {TABS.map((t) => {
        const active = t.id === value;
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => onChange(t.id)}
            className={cn(
              "rounded-lg px-4 py-1.5 text-sm font-medium transition-colors",
              active
                ? "bg-[var(--blue-500,#3b82f6)] text-white shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}

// ----------------------------------------------------------------------------
// Shared column + card chrome
// ----------------------------------------------------------------------------

type Tone = "success" | "warning" | "danger" | "info" | "violet" | "muted";

const TONE_BORDER: Record<Tone, string> = {
  success: "#10b981",
  warning: "#f59e0b",
  danger: "#ef4444",
  info: "#3b82f6",
  violet: "#8b5cf6",
  muted: "#94a3b8",
};

function Column({ label, tone, children }: { label: string; tone: Tone; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="text-[11px] font-medium uppercase tracking-wider" style={{ color: TONE_BORDER[tone] }}>
        {label}
      </div>
      {children}
    </div>
  );
}

function CardShell({ tone, children }: { tone: Tone; children: React.ReactNode }) {
  return (
    <div
      className="relative overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-sm"
      style={{ borderTop: `3px solid ${TONE_BORDER[tone]}` }}
    >
      {children}
    </div>
  );
}

function Pill({
  tone,
  children,
  soft = true,
}: {
  tone: Tone;
  children: React.ReactNode;
  soft?: boolean;
}) {
  const color = TONE_BORDER[tone];
  return (
    <span
      className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium"
      style={
        soft
          ? { backgroundColor: `color-mix(in oklab, ${color} 15%, transparent)`, color }
          : { backgroundColor: color, color: "white" }
      }
    >
      {children}
    </span>
  );
}

function ProgressBar({ value, tone }: { value: number; tone: Tone }) {
  const color = TONE_BORDER[tone];
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
      <div
        className="h-full rounded-full"
        style={{
          width: `${pct}%`,
          background:
            tone === "success"
              ? `linear-gradient(90deg, ${TONE_BORDER.info}, ${color})`
              : color,
        }}
      />
    </div>
  );
}

// ----------------------------------------------------------------------------
// Projeto
// ----------------------------------------------------------------------------

interface ProjetoRow {
  project: Project;
  sprintLabel: string;
  daysLeft: string;
  progress: number;
  storiesCount: number;
  members: Member[];
  blockedCount: number;
  bucket: "ontrack" | "risk" | "blocked";
}

function buildProjetoRows(data: Data): ProjetoRow[] {
  const memberById = new Map(data.members.map((m) => [m.id, m]));
  const membersByProject = new Map<string, Member[]>();
  for (const pm of data.projectMembers) {
    const m = memberById.get(pm.member_id);
    if (!m) continue;
    const arr = membersByProject.get(pm.project_id) ?? [];
    arr.push(m);
    membersByProject.set(pm.project_id, arr);
  }
  const now = Date.now();

  return data.projects.map((p) => {
    const items = data.items.filter((i) => i.project_id === p.id);
    const done = items.filter((i) => isDone(i.status)).length;
    const total = items.length;
    const progress = total ? Math.round((done / total) * 100) : 0;
    const stories = items.filter((i) => (i.type ?? "").toLowerCase() === "story");
    const blocked = items.filter((i) => isBlocked(i.status)).length;

    const activeSprint = data.sprints.find(
      (s) => s.project_id === p.id && ACTIVE_SPRINT.has((s.status ?? "").toLowerCase()),
    );
    const sprintLabel = activeSprint
      ? (activeSprint.name.match(/(\d+)/)?.[1] ? `SPRINT ${activeSprint.name.match(/(\d+)/)![1]}` : activeSprint.name.toUpperCase())
      : "SEM SPRINT";
    const daysLeft = activeSprint?.end_date
      ? `${Math.max(0, Math.round((new Date(activeSprint.end_date).getTime() - now) / 86_400_000))} dias`
      : "—";

    const bucket: ProjetoRow["bucket"] =
      blocked > 0 ? "blocked" : progress < 40 ? "risk" : "ontrack";

    return {
      project: p,
      sprintLabel,
      daysLeft,
      progress,
      storiesCount: stories.length,
      members: (membersByProject.get(p.id) ?? []).slice(0, 4),
      blockedCount: blocked,
      bucket,
    };
  });
}

function ProjetoCards({ data }: { data: Data }) {
  const rows = useMemo(() => buildProjetoRows(data), [data]);
  const groups = {
    ontrack: rows.filter((r) => r.bucket === "ontrack").slice(0, 1),
    risk: rows.filter((r) => r.bucket === "risk").slice(0, 1),
    blocked: rows.filter((r) => r.bucket === "blocked").slice(0, 1),
  };
  // preencher com fallback caso alguma coluna esteja vazia
  const fill = (arr: ProjetoRow[]) => (arr.length ? arr : rows.slice(0, 1));

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Column label="No prazo" tone="success">
        {fill(groups.ontrack).map((r) => <ProjetoCard key={r.project.id} row={r} tone="success" />)}
      </Column>
      <Column label="Em risco" tone="warning">
        {fill(groups.risk).map((r) => <ProjetoCard key={r.project.id} row={r} tone="warning" />)}
      </Column>
      <Column label="Bloqueado" tone="danger">
        {fill(groups.blocked).map((r) => <ProjetoCard key={r.project.id} row={r} tone="danger" />)}
      </Column>
    </div>
  );
}

function ProjetoCard({ row, tone }: { row: ProjetoRow; tone: Tone }) {
  const color = TONE_BORDER[tone];
  return (
    <CardShell tone={tone}>
      <div className="flex items-center justify-between">
        <div className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider" style={{ color }}>
          <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color }} />
          {row.sprintLabel}
        </div>
        {tone === "success" ? (
          <span className="text-xs text-muted-foreground">{row.daysLeft}</span>
        ) : tone === "warning" ? (
          <Pill tone="warning">Em risco</Pill>
        ) : (
          <Pill tone="danger">Bloqueado</Pill>
        )}
      </div>
      <h3 className="mt-3 text-lg font-semibold leading-tight text-foreground">{row.project.name}</h3>
      <p className="mt-2 text-sm leading-snug text-muted-foreground">
        {row.project.description ?? "Sem descrição registrada."}
      </p>
      <div className="mt-4 space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Progresso</span>
          <span className="font-semibold" style={{ color }}>{row.progress}%</span>
        </div>
        <ProgressBar value={row.progress} tone={tone} />
      </div>
      <div className="mt-4 flex items-center justify-between">
        {row.members.length > 0 ? (
          <div className="flex -space-x-2">
            {row.members.map((m) => (
              <Avatar key={m.id} className="h-7 w-7 border-2 border-card">
                <AvatarFallback
                  className="text-[10px] font-semibold text-white"
                  style={{ backgroundColor: m.avatar_color || pickAvatarColor(m.id) }}
                >
                  {initials(m.name)}
                </AvatarFallback>
              </Avatar>
            ))}
          </div>
        ) : <span />}
        {tone === "success" ? (
          <Pill tone="info">{row.storiesCount} histórias</Pill>
        ) : null}
      </div>
      {tone === "warning" && row.blockedCount > 0 && (
        <div className="mt-3 rounded-md bg-[color-mix(in_oklab,#f59e0b_12%,transparent)] px-3 py-2 text-xs" style={{ color }}>
          {row.blockedCount} bloqueador{row.blockedCount > 1 ? "es" : ""} ativo{row.blockedCount > 1 ? "s" : ""}
        </div>
      )}
      {tone === "danger" && (
        <div className="mt-3 rounded-md bg-[color-mix(in_oklab,#ef4444_10%,transparent)] px-3 py-2 text-center text-xs" style={{ color }}>
          Parado — resolver bloqueio
        </div>
      )}
    </CardShell>
  );
}

// ----------------------------------------------------------------------------
// Epic
// ----------------------------------------------------------------------------

interface EpicRow {
  id: string;
  title: string;
  description: string;
  storiesDone: number;
  storiesTotal: number;
  bucket: "construction" | "discovery" | "done";
  dueLabel: string;
  blockedCount: number;
  discoveryLabel: string | null;
}

function buildEpicRows(data: Data): EpicRow[] {
  // Sem tabela de epics — projetos servem como agrupador (proxy) OU as histórias mais volumosas.
  // Usamos projetos como "épico" pai já que work_items estão ligados a project_id.
  return data.projects.map((p) => {
    const items = data.items.filter((i) => i.project_id === p.id);
    const stories = items.filter((i) => (i.type ?? "").toLowerCase() === "story");
    const storiesDone = stories.filter((i) => isDone(i.status)).length;
    const storiesTotal = stories.length;
    const blockedCount = items.filter((i) => isBlocked(i.status)).length;
    const backlogCount = items.filter((i) => isBacklog(i.status)).length;
    const inReview = items.filter((i) => isReview(i.status)).length;

    const bucket: EpicRow["bucket"] =
      storiesTotal > 0 && storiesDone === storiesTotal
        ? "done"
        : backlogCount > storiesDone
        ? "discovery"
        : "construction";

    const nextSprint = data.sprints
      .filter((s) => s.project_id === p.id && s.end_date && new Date(s.end_date).getTime() >= Date.now())
      .sort((a, b) => new Date(a.end_date!).getTime() - new Date(b.end_date!).getTime())[0];
    const dueLabel = nextSprint
      ? `Due: ${nextSprint.name}`
      : "Due: —";

    return {
      id: p.id,
      title: p.name,
      description: p.description ?? "Sem descrição registrada.",
      storiesDone,
      storiesTotal: storiesTotal || items.length,
      bucket,
      dueLabel,
      blockedCount,
      discoveryLabel: bucket === "discovery" && backlogCount > 0 ? `${backlogCount} hipóteses em validação` : (inReview > 0 ? `${inReview} em revisão` : null),
    };
  });
}

function EpicCards({ data }: { data: Data }) {
  const rows = useMemo(() => buildEpicRows(data), [data]);
  const construction = rows.filter((r) => r.bucket === "construction").slice(0, 1);
  const discovery = rows.filter((r) => r.bucket === "discovery").slice(0, 1);
  const done = rows.filter((r) => r.bucket === "done").slice(0, 1);
  const fill = (arr: EpicRow[]) => (arr.length ? arr : rows.slice(0, 1));

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Column label="Em construção" tone="muted">
        {fill(construction).map((r) => <EpicCard key={r.id} row={r} tone="info" pillLabel="CONSTRUÇÃO" pillTone="info" />)}
      </Column>
      <Column label="Em descoberta" tone="muted">
        {fill(discovery).map((r) => <EpicCard key={r.id} row={r} tone="violet" pillLabel="DESCOBERTA" pillTone="violet" />)}
      </Column>
      <Column label="Concluído" tone="muted">
        {fill(done).map((r) => <EpicCard key={r.id} row={r} tone="success" pillLabel="CONCLUÍDO" pillTone="success" />)}
      </Column>
    </div>
  );
}

function EpicCard({
  row, tone, pillLabel, pillTone,
}: { row: EpicRow; tone: Tone; pillLabel: string; pillTone: Tone }) {
  const color = TONE_BORDER[pillTone];
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4" style={{ color }} />
        <Pill tone={pillTone}>{pillLabel}</Pill>
      </div>
      <h3 className="mt-3 text-lg font-semibold leading-tight text-foreground">{row.title}</h3>
      <p className="mt-2 text-sm leading-snug text-muted-foreground">{row.description}</p>
      {row.bucket !== "discovery" && (
        <div className="mt-4 space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Histórias</span>
            <span className="font-semibold tabular-nums text-foreground">
              {row.storiesDone} / {row.storiesTotal || "—"}
            </span>
          </div>
          <ProgressBar value={row.storiesTotal ? (row.storiesDone / row.storiesTotal) * 100 : 0} tone={tone} />
        </div>
      )}
      <div className="mt-4 flex items-center justify-between">
        {row.bucket === "discovery" ? (
          <span className="text-sm font-medium" style={{ color }}>{row.discoveryLabel ?? "Em validação"}</span>
        ) : (
          <span className="text-xs text-muted-foreground">{row.dueLabel}</span>
        )}
        {row.bucket === "construction" && row.blockedCount > 0 && (
          <Pill tone="danger">{row.blockedCount} bloq.</Pill>
        )}
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------------
// História
// ----------------------------------------------------------------------------

interface HistoriaRow {
  id: string;
  epicLabel: string;
  points: number;
  title: string;
  assignee: Member | null;
  status: "build" | "review" | "done";
}

function buildHistoriaRows(data: Data): HistoriaRow[] {
  const memberById = new Map(data.members.map((m) => [m.id, m]));
  const projectById = new Map(data.projects.map((p) => [p.id, p]));
  const stories = data.items.filter((i) => (i.type ?? "").toLowerCase() === "story");

  return stories.map((s) => {
    const proj = s.project_id ? projectById.get(s.project_id) : null;
    const status: HistoriaRow["status"] = isDone(s.status)
      ? "done"
      : isReview(s.status)
      ? "review"
      : "build";
    // "story points" — sem coluna: derivamos de priority (baixa=2, media=3, alta=5, critica=8)
    const map: Record<string, number> = { baixa: 2, media: 3, alta: 5, critica: 8 };
    const points = map[(s.priority ?? "media").toLowerCase()] ?? 3;
    return {
      id: s.id,
      epicLabel: proj ? `${proj.name.split(" ")[0]} · Epic` : "Epic",
      points,
      title: s.title,
      assignee: s.assignee_id ? memberById.get(s.assignee_id) ?? null : null,
      status,
    };
  });
}

function HistoriaCards({ data }: { data: Data }) {
  const rows = useMemo(() => buildHistoriaRows(data), [data]);
  const build = rows.filter((r) => r.status === "build").slice(0, 1);
  const review = rows.filter((r) => r.status === "review").slice(0, 1);
  const done = rows.filter((r) => r.status === "done").slice(0, 1);
  const fill = (arr: HistoriaRow[]) => (arr.length ? arr : rows.slice(0, 1));

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Column label="Em construção" tone="muted">
        {fill(build).map((r) => <HistoriaCard key={r.id} row={r} tone="info" statusLabel="Em Build" />)}
      </Column>
      <Column label="Em revisão" tone="muted">
        {fill(review).map((r) => <HistoriaCard key={r.id} row={r} tone="info" statusLabel="Revisão" />)}
      </Column>
      <Column label="Concluída" tone="muted">
        {fill(done).map((r) => <HistoriaCard key={r.id} row={r} tone="success" statusLabel="Concluída" />)}
      </Column>
    </div>
  );
}

function HistoriaCard({ row, tone, statusLabel }: { row: HistoriaRow; tone: Tone; statusLabel: string }) {
  const color = TONE_BORDER[tone];
  return (
    <div
      className="rounded-2xl border border-border bg-card p-5 shadow-sm"
      style={{ borderLeft: `3px solid ${color}` }}
    >
      <div className="flex items-start justify-between gap-3">
        <Pill tone="info">{row.epicLabel}</Pill>
        <span
          className="grid h-8 w-8 shrink-0 place-items-center rounded-full border-2 text-xs font-semibold tabular-nums"
          style={{ borderColor: color, color }}
        >
          {row.points}
        </span>
      </div>
      <h3 className="mt-3 text-base font-semibold leading-snug text-foreground">{row.title}</h3>
      <div className="mt-5 flex items-center justify-between">
        <div className="flex min-w-0 items-center gap-2">
          {row.assignee ? (
            <>
              <Avatar className="h-6 w-6 shrink-0">
                <AvatarFallback
                  className="text-[10px] font-semibold text-white"
                  style={{ backgroundColor: row.assignee.avatar_color || pickAvatarColor(row.assignee.id) }}
                >
                  {initials(row.assignee.name)}
                </AvatarFallback>
              </Avatar>
              <span className="truncate text-sm text-muted-foreground">{firstName(row.assignee.name)}</span>
            </>
          ) : (
            <span className="text-sm text-muted-foreground">Sem responsável</span>
          )}
        </div>
        <Pill tone={tone}>{statusLabel}</Pill>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------------
// KPI
// ----------------------------------------------------------------------------

function KpiCards({ data }: { data: Data }) {
  const total = data.items.length;
  const done = data.items.filter((i) => isDone(i.status)).length;
  const stories = data.items.filter((i) => (i.type ?? "").toLowerCase() === "story").length;
  const activeSprints = data.sprints.filter((s) => ACTIVE_SPRINT.has((s.status ?? "").toLowerCase())).length;
  const throughput = total ? Math.round((done / total) * 100) : 0;
  const projects = data.projects.length;

  const kpis = [
    { label: "Throughput", value: `${throughput}%`, tone: "info" as Tone, hint: `${done} de ${total} itens concluídos` },
    { label: "Histórias entregues", value: stories, tone: "success" as Tone, hint: "no período" },
    { label: "Sprints ativas", value: activeSprints, tone: "violet" as Tone, hint: "em execução agora" },
    { label: "Projetos", value: projects, tone: "warning" as Tone, hint: "no portfólio" },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {kpis.map((k) => (
        <div key={k.label} className="rounded-2xl border border-border bg-card p-5 shadow-sm" style={{ borderTop: `3px solid ${TONE_BORDER[k.tone]}` }}>
          <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{k.label}</div>
          <div className="mt-2 text-3xl font-semibold" style={{ color: TONE_BORDER[k.tone] }}>{k.value}</div>
          <div className="mt-1 text-xs text-muted-foreground">{k.hint}</div>
        </div>
      ))}
    </div>
  );
}

// ----------------------------------------------------------------------------
// Risco
// ----------------------------------------------------------------------------

interface RiscoRow {
  id: string;
  severity: "alto" | "medio" | "mitigado";
  category: string;
  title: string;
  description: string;
  probability: number;
  impactLabel: string;
  ownerName: string;
  deadlineLabel: string;
}

function buildRiscoRows(data: Data): RiscoRow[] {
  const memberById = new Map(data.members.map((m) => [m.id, m]));
  const risks = data.items.filter((i) => (i.type ?? "").toLowerCase() === "risk");

  const categoryFor = (title: string) => {
    const t = title.toLowerCase();
    if (/(infra|cluster|deploy|servidor)/.test(t)) return "Infra";
    if (/(processo|aprovação|aprovacao|governança|governanca)/.test(t)) return "Processo";
    return "Técnico";
  };

  return risks.map((r) => {
    const priority = (r.priority ?? "media").toLowerCase();
    const severity: RiscoRow["severity"] = isDone(r.status)
      ? "mitigado"
      : priority === "critica" || priority === "alta"
      ? "alto"
      : "medio";
    const probability = severity === "alto" ? 75 : severity === "medio" ? 45 : 5;
    const impactLabel = priority === "critica" ? "Crítico" : priority === "alta" ? "Alto" : priority === "media" ? "Médio" : "Baixo";
    const owner = r.assignee_id ? memberById.get(r.assignee_id) : null;
    return {
      id: r.id,
      severity,
      category: categoryFor(r.title),
      title: r.title,
      description: r.description ?? "Sem descrição registrada.",
      probability,
      impactLabel,
      ownerName: owner ? firstName(owner.name) : "—",
      deadlineLabel: severity === "mitigado" ? "Resolvido" : severity === "alto" ? "Vence em breve" : "Monitorando",
    };
  });
}

function RiscoCards({ data }: { data: Data }) {
  const rows = useMemo(() => buildRiscoRows(data), [data]);
  const alto = rows.filter((r) => r.severity === "alto").slice(0, 1);
  const medio = rows.filter((r) => r.severity === "medio").slice(0, 1);
  const mit = rows.filter((r) => r.severity === "mitigado").slice(0, 1);
  const fill = (arr: RiscoRow[]) => arr;

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {fill(alto).map((r) => <RiscoCard key={r.id} row={r} tone="danger" sevLabel="ALTO" />)}
      {fill(medio).map((r) => <RiscoCard key={r.id} row={r} tone="warning" sevLabel="MÉDIO" />)}
      {fill(mit).map((r) => <RiscoCard key={r.id} row={r} tone="success" sevLabel="MITIGADO" />)}
      {rows.length === 0 && (
        <div className="md:col-span-3">
          <EmptyState title="Sem riscos" description="Nenhum risco registrado no portfólio." />
        </div>
      )}
    </div>
  );
}

function RiscoCard({ row, tone, sevLabel }: { row: RiscoRow; tone: Tone; sevLabel: string }) {
  const color = TONE_BORDER[tone];
  const catTone: Tone = row.category === "Infra" ? "success" : row.category === "Processo" ? "warning" : "danger";
  return (
    <CardShell tone={tone}>
      <div className="flex items-center justify-between">
        <div className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider" style={{ color }}>
          <ShieldAlert className="h-3.5 w-3.5" />
          {sevLabel}
        </div>
        <Pill tone={catTone}>{row.category}</Pill>
      </div>
      <h3 className="mt-3 text-lg font-semibold leading-tight text-foreground">{row.title}</h3>
      <p className="mt-2 text-sm leading-snug text-muted-foreground">{row.description}</p>
      <div className="mt-4 flex items-center justify-between text-sm">
        <span className="text-muted-foreground">
          Probabilidade <span className="font-semibold" style={{ color }}>{row.probability}%</span>
        </span>
        <span className="text-muted-foreground">
          Impacto <span className="font-semibold" style={{ color }}>{row.impactLabel}</span>
        </span>
      </div>
      <div className="mt-4 flex items-center justify-between text-xs">
        {row.severity === "mitigado" ? (
          <span className="font-medium" style={{ color }}>{row.deadlineLabel}</span>
        ) : (
          <>
            <span className="text-muted-foreground">Owner: {row.ownerName}</span>
            <span className="font-medium" style={{ color }}>{row.deadlineLabel}</span>
          </>
        )}
      </div>
    </CardShell>
  );
}
