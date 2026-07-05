/**
 * Altech Project — Hook do Dashboard.
 *
 * Fina camada React sobre `fetchDashboardMetrics`. Resolve o escopo
 * (tenant + assignee opcional) e expõe estado padrão de loading/erro/refresh.
 * Sem UI. Reutilizável por qualquer widget do dashboard.
 */
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { useWorkspace } from "@/lib/workspace";
import {
  fetchDashboardMetrics,
  type DashboardMetrics,
  type DashboardScope,
} from "@/lib/dashboard-metrics";
import { formatSupabaseError } from "@/lib/supabase-errors";

export interface UseDashboardMetricsOptions {
  /** Sobrescreve o tenant resolvido pelo workspace. */
  tenantId?: string;
  /** Sobrescreve o membro (project_members.member_id) para filtrar projetos. */
  memberId?: string | null;
  /** Sobrescreve o assignee (work_items.assignee_id) para "meus itens". */
  assigneeId?: string | null;
  /** Desabilita a busca automática. */
  enabled?: boolean;
}

export interface UseDashboardMetricsResult {
  data: DashboardMetrics | null;
  loading: boolean;
  error: string | null;
  scope: DashboardScope | null;
  refresh: () => Promise<void>;
}

export function useDashboardMetrics(
  options: UseDashboardMetricsOptions = {},
): UseDashboardMetricsResult {
  const { user } = useAuth();
  const { tenant } = useWorkspace();

  const tenantId = options.tenantId ?? tenant?.id ?? null;
  const memberId = options.memberId ?? user?.id ?? null;
  const assigneeId = options.assigneeId ?? user?.id ?? null;
  const enabled = options.enabled ?? true;

  const [data, setData] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState<boolean>(enabled && !!tenantId);
  const [error, setError] = useState<string | null>(null);

  const scope: DashboardScope | null = tenantId
    ? { tenantId, memberId, assigneeId }
    : null;

  const load = useCallback(async () => {
    if (!scope) return;
    setLoading(true);
    setError(null);
    try {
      const metrics = await fetchDashboardMetrics(scope);
      setData(metrics);
    } catch (e) {
      setError(formatSupabaseError(e) || "Falha ao carregar métricas do dashboard");
      setData(null);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantId, memberId, assigneeId]);

  useEffect(() => {
    if (!enabled) return;
    if (!scope) {
      setLoading(false);
      return;
    }
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, tenantId, memberId, assigneeId]);

  return { data, loading, error, scope, refresh: load };
}
