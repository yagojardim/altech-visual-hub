import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useAuth } from "@/lib/auth";

/**
 * Workspace Context (mock)
 * -------------------------------------------------------------
 * Fornece o workspace ativo, lista de workspaces disponíveis e
 * estados (loading / error / empty). Substituível por chamada
 * real ao Supabase sem alterar a API pública.
 */

export interface Workspace {
  id: string;
  slug: string;
  name: string;
  plan: "free" | "pro" | "enterprise";
  membersCount: number;
}

type WorkspaceStatus = "loading" | "ready" | "empty" | "error";

interface WorkspaceContextValue {
  status: WorkspaceStatus;
  workspaces: Workspace[];
  current: Workspace | null;
  error: string | null;
  retry: () => void;
  setCurrent: (id: string) => void;
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

const MOCK_WORKSPACES: Workspace[] = [
  { id: "ws-altech", slug: "altech", name: "Altech HQ", plan: "enterprise", membersCount: 28 },
  { id: "ws-labs", slug: "labs", name: "Altech Labs", plan: "pro", membersCount: 7 },
];

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const { status: authStatus } = useAuth();
  // Inspection Mode: workspace is fully mocked and available synchronously,
  // so the UI never gets stuck on "Carregando workspace…" during SSR or
  // hydration. Replace with a real fetch when Supabase-backed workspaces
  // are wired in.
  const [workspaces] = useState<Workspace[]>(MOCK_WORKSPACES);
  const [currentId, setCurrentId] = useState<string | null>(MOCK_WORKSPACES[0]?.id ?? null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<WorkspaceStatus>(
    MOCK_WORKSPACES.length === 0 ? "empty" : "ready",
  );

  useEffect(() => {
    if (authStatus === "unauthenticated") return;
    setError(null);
    setStatus(workspaces.length === 0 ? "empty" : "ready");
  }, [authStatus, workspaces]);

  const value = useMemo<WorkspaceContextValue>(() => ({
    status,
    workspaces,
    current: workspaces.find((w) => w.id === currentId) ?? workspaces[0] ?? null,
    error,
    retry: () => setStatus(workspaces.length === 0 ? "empty" : "ready"),
    setCurrent: (id) => setCurrentId(id),
  }), [status, workspaces, currentId, error]);

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}


export function useWorkspace() {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error("useWorkspace must be used within WorkspaceProvider");
  return ctx;
}
