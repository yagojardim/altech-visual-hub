import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { DEV_MODE, useAuth } from "@/lib/auth";

/**
 * Workspace Context (mock)
 * -------------------------------------------------------------
 * Fornece o workspace ativo, lista de workspaces disponíveis e
 * estados (loading / error / empty). Substituível por chamada
 * real ao Supabase sem alterar a API pública.
 */

export interface Tenant {
  id: string;
  slug: string;
  name: string;
  plan: "free" | "pro" | "enterprise";
  storageLimitGb: number;
}

export interface Organization {
  id: string;
  tenantId: string;
  slug: string;
  name: string;
  membersCount: number;
}

export interface Workspace {
  id: string;
  tenantId: string;
  organizationId: string;
  slug: string;
  name: string;
  plan: "free" | "pro" | "enterprise";
  membersCount: number;
}

export interface ProjectMock {
  id: string;
  workspaceId: string;
  name: string;
  client: string;
  owner: string;
  status: string;
}

export interface BoardMock {
  id: string;
  projectId: string;
  name: string;
  columns: string[];
}

export interface BacklogMock {
  id: string;
  projectId: string;
  name: string;
  itemsCount: number;
}

export interface SprintMock {
  id: string;
  projectId: string;
  name: string;
  status: string;
}

export interface WorkItemMock {
  id: string;
  projectId: string;
  key: string;
  title: string;
  type: string;
  status: string;
}

type WorkspaceStatus = "loading" | "ready" | "empty" | "error";

interface WorkspaceContextValue {
  status: WorkspaceStatus;
  tenant: Tenant;
  organization: Organization;
  workspaces: Workspace[];
  current: Workspace | null;
  project: ProjectMock;
  board: BoardMock;
  backlog: BacklogMock;
  sprint: SprintMock;
  workItem: WorkItemMock;
  error: string | null;
  retry: () => void;
  setCurrent: (id: string) => void;
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

const MOCK_TENANT: Tenant = {
  id: "tenant-altech",
  slug: "altech",
  name: "Altech",
  plan: "enterprise",
  storageLimitGb: 100,
};

const MOCK_ORGANIZATION: Organization = {
  id: "org-altech",
  tenantId: MOCK_TENANT.id,
  slug: "altech-platform",
  name: "Altech Platform",
  membersCount: 28,
};

const MOCK_WORKSPACES: Workspace[] = [
  {
    id: "ws-altech",
    tenantId: MOCK_TENANT.id,
    organizationId: MOCK_ORGANIZATION.id,
    slug: "altech",
    name: "Altech HQ",
    plan: "enterprise",
    membersCount: 28,
  },
  {
    id: "ws-labs",
    tenantId: MOCK_TENANT.id,
    organizationId: MOCK_ORGANIZATION.id,
    slug: "labs",
    name: "Altech Labs",
    plan: "pro",
    membersCount: 7,
  },
];

const MOCK_PROJECT: ProjectMock = {
  id: "altech-core",
  workspaceId: "ws-altech",
  name: "Altech Core",
  client: "Altech",
  owner: "Ana Silva",
  status: "Em progresso",
};

const MOCK_BOARD: BoardMock = {
  id: "board-altech-core",
  projectId: MOCK_PROJECT.id,
  name: "Board Principal",
  columns: ["Backlog", "A Fazer", "Em Andamento", "Em Validação", "Concluído"],
};

const MOCK_BACKLOG: BacklogMock = {
  id: "backlog-altech-core",
  projectId: MOCK_PROJECT.id,
  name: "Backlog Altech Core",
  itemsCount: 5,
};

const MOCK_SPRINT: SprintMock = {
  id: "sprint-altech-core-01",
  projectId: MOCK_PROJECT.id,
  name: "Sprint 01",
  status: "Planejamento",
};

const MOCK_WORK_ITEM: WorkItemMock = {
  id: "wi-000",
  projectId: MOCK_PROJECT.id,
  key: "WI-000",
  title: "História ativa de exemplo",
  type: "História",
  status: "Em progresso",
};

function getInspectionStatus(workspaces: Workspace[]): WorkspaceStatus {
  return workspaces.length === 0 ? "empty" : "ready";
}

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const { status: authStatus } = useAuth();

  /**
   * Inspection Mode:
   * - never depends on Supabase-backed workspace data;
   * - resolves synchronously on SSR and hydration;
   * - keeps a complete fallback graph available for the main validation flow.
   */
  const [workspaces] = useState<Workspace[]>(MOCK_WORKSPACES);
  const [currentId, setCurrentId] = useState<string | null>(MOCK_WORKSPACES[0]?.id ?? null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<WorkspaceStatus>(() => getInspectionStatus(MOCK_WORKSPACES));

  useEffect(() => {
    if (DEV_MODE) {
      setError(null);
      setStatus(getInspectionStatus(MOCK_WORKSPACES));
      return;
    }

    if (authStatus === "unauthenticated") return;

    setError(null);
    setStatus(getInspectionStatus(workspaces));
  }, [authStatus, workspaces]);

  const value = useMemo<WorkspaceContextValue>(() => ({
    status,
    tenant: MOCK_TENANT,
    organization: MOCK_ORGANIZATION,
    workspaces,
    current: workspaces.find((w) => w.id === currentId) ?? workspaces[0] ?? null,
    project: MOCK_PROJECT,
    board: MOCK_BOARD,
    backlog: MOCK_BACKLOG,
    sprint: MOCK_SPRINT,
    workItem: MOCK_WORK_ITEM,
    error,
    retry: () => {
      setError(null);
      setStatus(getInspectionStatus(DEV_MODE ? MOCK_WORKSPACES : workspaces));
    },
    setCurrent: (id) => setCurrentId(id),
  }), [status, workspaces, currentId, error]);

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspace() {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error("useWorkspace must be used within WorkspaceProvider");
  return ctx;
}