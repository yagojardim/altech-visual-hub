/**
 * Altech Project — Dashboards por papel.
 *
 * Renderiza o layout de dashboard para PM e PO usando o hook
 * `useDashboardMetrics` (P2) e os widgets reutilizáveis (P3).
 * Sem lógica de auth. Dados do Supabase.
 */
import { useNavigate } from "@tanstack/react-router";
import {
  AlertTriangle,
  Bug,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  FileWarning,
  FolderKanban,
  ListChecks,
  Plus,
  Rocket,
  ShieldAlert,
  Sparkles,
  Target,
  Timer,
  UserX,
} from "lucide-react";
import type { WorkItem } from "@/lib/work-item-map";
import { useDashboardMetrics } from "@/lib/use-dashboard-metrics";
import { LoadingState } from "@/components/states";
import { WidgetGrid } from "./WidgetGrid";
import { WidgetCard } from "./WidgetCard";
import { WidgetHeader } from "./WidgetHeader";
import { KpiCard } from "./KpiCard";
import { ListWidget, type ListWidgetItem } from "./ListWidget";
import { QuickActions } from "./QuickActions";
import { Progress } from "@/components/ui/progress";

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
      {children}
    </h2>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div
      className="rounded-lg border p-4 text-sm"
      style={{
        borderColor: "color-mix(in oklab, var(--danger-500) 30%, transparent)",
        backgroundColor: "color-mix(in oklab, var(--danger-500) 8%, transparent)",
        color: "var(--danger-500)",
      }}
    >
      {message}
    </div>
  );
}

/** Converte WorkItem em item de lista, com handler de clique. */
function toListItems(items: WorkItem[], limit = 6): ListWidgetItem[] {
  return items.slice(0, limit).map((it) => ({
    id: it.id,
    title: it.title,
    itemKey: it.itemKey,
    type: it.type,
    priority: it.priority,
    status: it.status,
    assignee: it.assignee,
  }));
}

function useOpenWorkItem(from: string) {
  const navigate = useNavigate();
  return (item: ListWidgetItem) => {
    navigate({
      to: "/work-items/$itemId",
      params: { itemId: item.id },
      search: { from },
    });
  };
}

// ================================================================
// PM Dashboard
// ================================================================
export function PMDashboard() {
  const { data, loading, error } = useDashboardMetrics();
  const openItem = useOpenWorkItem("/dashboard");

  if (loading) return <LoadingState label="Carregando dashboard do PM…" variant="skeleton" rows={4} />;
  if (error) return <ErrorState message={error} />;
  if (!data) return null;

  const active = data.activeSprint;

  return (
    <div className="space-y-8">
      {/* HOJE */}
      <section className="space-y-4">
        <SectionTitle>Hoje</SectionTitle>
        <WidgetGrid columns={4}>
          <KpiCard
            label="Entregas de hoje"
            value={data.dueToday.length}
            icon={CalendarDays}
            severity="info"
          />
          <KpiCard
            label="Itens atrasados"
            value={data.overdue.length}
            icon={AlertTriangle}
            severity={data.overdue.length > 0 ? "danger" : "success"}
          />
          <KpiCard
            label="Itens bloqueados"
            value={data.blocked.length}
            icon={ShieldAlert}
            severity={data.blocked.length > 0 ? "warning" : "success"}
          />
          <KpiCard
            label="Sem responsável"
            value={data.unassigned.length}
            icon={UserX}
            severity={data.unassigned.length > 0 ? "warning" : "success"}
          />
        </WidgetGrid>

        <WidgetGrid columns={2}>
          <ListWidget
            title="Entregas de hoje"
            description="Work items com due_date = hoje"
            icon={CalendarDays}
            items={toListItems(data.dueToday)}
            onItemClick={openItem}
            emptyDescription="Sem entregas previstas para hoje."
          />
          <ListWidget
            title="Bloqueios ativos"
            description="Itens com status Bloqueado"
            icon={ShieldAlert}
            items={toListItems(data.blocked)}
            onItemClick={openItem}
            emptyDescription="Nenhum bloqueio no momento."
          />
        </WidgetGrid>

        <WidgetGrid columns={2}>
          <ListWidget
            title="Itens atrasados"
            description="due_date anterior a hoje"
            icon={AlertTriangle}
            items={toListItems(data.overdue)}
            onItemClick={openItem}
            emptyDescription="Nenhum item atrasado."
          />
          <ListWidget
            title="Sem responsável"
            description="Itens em aberto sem assignee"
            icon={UserX}
            items={toListItems(data.unassigned)}
            onItemClick={openItem}
            emptyDescription="Todos os itens abertos têm responsável."
          />
        </WidgetGrid>
      </section>

      {/* ESTA SPRINT */}
      <section className="space-y-4">
        <SectionTitle>Esta sprint</SectionTitle>
        {active ? (
          <WidgetCard className="!rounded-lg keep-radius">
            <WidgetHeader
              title={active.sprintName ?? "Sprint atual"}
              description={`${active.done} de ${active.planned} itens concluídos`}
              icon={Timer}
            />
            <div className="mt-4 space-y-2">
              <Progress value={active.percent} />
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{active.percent}% concluído</span>
                <span>{active.planned - active.done} em andamento</span>
              </div>
            </div>
          </WidgetCard>
        ) : (
          <WidgetCard className="!rounded-lg keep-radius">
            <WidgetHeader
              title="Nenhuma sprint ativa"
              description="Nenhuma sprint em andamento nos projetos do seu escopo."
              icon={Timer}
            />
          </WidgetCard>
        )}

        <WidgetGrid columns={3}>
          <KpiCard
            label="Bugs críticos"
            value={data.criticalBugs.length}
            icon={Bug}
            severity={data.criticalBugs.length > 0 ? "danger" : "success"}
          />
          <KpiCard
            label="Itens da sprint"
            value={data.activeSprintItems.length}
            icon={ListChecks}
            severity="info"
          />
          <KpiCard
            label="Concluídos na sprint"
            value={active?.done ?? 0}
            icon={CheckCircle2}
            severity="success"
          />
        </WidgetGrid>

        <ListWidget
          title="Bugs críticos"
          description="type=bug com prioridade crítica"
          icon={Bug}
          items={toListItems(data.criticalBugs, 8)}
          onItemClick={openItem}
          emptyDescription="Sem bugs críticos abertos."
        />
      </section>

      {/* AÇÕES */}
      <QuickActions
        title="Ações rápidas"
        icon={Sparkles}
        actions={[
          { id: "create", label: "Criar work item", icon: Plus, href: "/backlog", variant: "default" },
          { id: "board", label: "Abrir board", icon: FolderKanban, href: "/boards" },
          { id: "sprint", label: "Abrir sprint", icon: Timer, href: "/sprints" },
          { id: "blocks", label: "Ver bloqueios", icon: ShieldAlert, href: "/backlog" },
        ]}
      />
    </div>
  );
}

// ================================================================
// PO Dashboard
// ================================================================
export function PODashboard() {
  const { data, loading, error } = useDashboardMetrics();
  const openItem = useOpenWorkItem("/dashboard");

  if (loading) return <LoadingState label="Carregando dashboard do PO…" variant="skeleton" rows={4} />;
  if (error) return <ErrorState message={error} />;
  if (!data) return null;

  const active = data.activeSprint;
  const valueItems = data.activeSprintItems.filter((it) => {
    const t = (it.type || "").toLowerCase();
    return t === "story" || t === "epic" || t === "feature" || t === "história" || t === "historia";
  });
  const valueDone = valueItems.filter((it) => {
    const s = (it.status || "").toLowerCase();
    return ["done", "concluido", "concluído", "completed", "closed", "resolved"].includes(s);
  }).length;
  const valuePercent = valueItems.length > 0 ? Math.round((valueDone / valueItems.length) * 100) : 0;

  return (
    <div className="space-y-8">
      {/* HOJE */}
      <section className="space-y-4">
        <SectionTitle>Hoje</SectionTitle>
        <WidgetGrid columns={4}>
          <KpiCard
            label="Histórias sem critério"
            value={data.storiesMissingAcceptance.length}
            icon={FileWarning}
            severity={data.storiesMissingAcceptance.length > 0 ? "warning" : "success"}
          />
          <KpiCard
            label="Sem prioridade"
            value={data.missingPriority.length}
            icon={Target}
            severity={data.missingPriority.length > 0 ? "warning" : "success"}
          />
          <KpiCard
            label="Prontos para sprint"
            value={data.readyForSprint.length}
            icon={Rocket}
            severity="info"
          />
          <KpiCard
            label="Aguardando validação"
            value={data.awaitingValidation.length}
            icon={ClipboardList}
            severity="info"
          />
        </WidgetGrid>

        <WidgetGrid columns={2}>
          <ListWidget
            title="Histórias sem critério de aceite"
            description="type=story sem acceptance_criteria"
            icon={FileWarning}
            items={toListItems(data.storiesMissingAcceptance)}
            onItemClick={openItem}
            emptyDescription="Todas as histórias têm critérios definidos."
          />
          <ListWidget
            title="Sem prioridade"
            description="Itens abertos sem priority definida"
            icon={Target}
            items={toListItems(data.missingPriority)}
            onItemClick={openItem}
            emptyDescription="Todos os itens abertos têm prioridade."
          />
        </WidgetGrid>

        <WidgetGrid columns={2}>
          <ListWidget
            title="Prontos para sprint"
            description="Histórias/épicos/features refinados e livres"
            icon={Rocket}
            items={toListItems(data.readyForSprint)}
            onItemClick={openItem}
            emptyDescription="Nenhum item pronto para entrar em sprint."
          />
          <ListWidget
            title="Aguardando validação"
            description="Itens em review/QA/validação"
            icon={ClipboardList}
            items={toListItems(data.awaitingValidation)}
            onItemClick={openItem}
            emptyDescription="Nenhum item aguardando validação."
          />
        </WidgetGrid>
      </section>

      {/* ESTA SPRINT */}
      <section className="space-y-4">
        <SectionTitle>Esta sprint</SectionTitle>
        {active ? (
          <WidgetCard className="!rounded-lg keep-radius">
            <WidgetHeader
              title={`Progresso por valor — ${active.sprintName ?? "Sprint atual"}`}
              description={`${valueDone} de ${valueItems.length} itens de valor concluídos (histórias, épicos, features)`}
              icon={Sparkles}
            />
            <div className="mt-4 space-y-2">
              <Progress value={valuePercent} />
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{valuePercent}% de valor entregue</span>
                <span>{active.done}/{active.planned} itens totais</span>
              </div>
            </div>
          </WidgetCard>
        ) : (
          <WidgetCard className="!rounded-lg keep-radius">
            <WidgetHeader
              title="Nenhuma sprint ativa"
              description="Sem sprint em andamento para acompanhar entrega de valor."
              icon={Timer}
            />
          </WidgetCard>
        )}
      </section>

      {/* AÇÕES */}
      <QuickActions
        title="Ações rápidas"
        icon={Sparkles}
        actions={[
          { id: "story", label: "Criar história/épico", icon: Plus, href: "/backlog", variant: "default" },
          { id: "prio", label: "Priorizar backlog", icon: Target, href: "/backlog" },
          { id: "criteria", label: "Ver itens sem critério", icon: FileWarning, href: "/backlog" },
        ]}
      />
    </div>
  );
}
