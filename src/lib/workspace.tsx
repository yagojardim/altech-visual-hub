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
  const [status, setStatus] = useState<WorkspaceStatus>("loading");
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (authStatus !== "authenticated") {
      setStatus("loading");
      return;
    }
    let cancelled = false;
    setStatus("loading");
    setError(null);

    // TODO(supabase): substituir por fetch real dos workspaces do usuário.
    const t = setTimeout(() => {
      if (cancelled) return;
      try {
        const list = MOCK_WORKSPACES;
        setWorkspaces(list);
        if (list.length === 0) {
          setStatus("empty");
        } else {
          setCurrentId((prev) => prev ?? list[0].id);
          setStatus("ready");
        }
      } catch (e) {
        setError((e as Error).message);
        setStatus("error");
      }
    }, 200);

    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [authStatus, tick]);

  const value = useMemo<WorkspaceContextValue>(() => ({
    status,
    workspaces,
    current: workspaces.find((w) => w.id === currentId) ?? null,
    error,
    retry: () => setTick((n) => n + 1),
    setCurrent: (id) => setCurrentId(id),
  }), [status, workspaces, currentId, error]);

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspace() {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error("useWorkspace must be used within WorkspaceProvider");
  return ctx;
}
