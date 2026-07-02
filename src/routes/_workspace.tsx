import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Sidebar } from "@/components/workspace/Sidebar";
import { Topbar } from "@/components/workspace/Topbar";
import { CommandPalette } from "@/components/workspace/CommandPalette";
import { LoadingState, ErrorState, EmptyState, UnauthorizedState } from "@/components/states";
import { DEV_MODE, useAuth, useCan } from "@/lib/auth";
import { WorkspaceProvider, useWorkspace } from "@/lib/workspace";

export const Route = createFileRoute("/_workspace")({
  component: WorkspaceRoute,
});

function WorkspaceRoute() {
  const { status } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (status === "unauthenticated") navigate({ to: "/login" });
  }, [status, navigate]);

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <LoadingState label="Carregando sessão…" />
      </div>
    );
  }

  if (status === "unauthenticated") return null;

  return (
    <WorkspaceProvider>
      <WorkspaceLayout />
    </WorkspaceProvider>
  );
}

function WorkspaceLayout() {
  const [paletteOpen, setPaletteOpen] = useState(false);
  const canView = useCan("workspace.view");
  const ws = useWorkspace();

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar onOpenPalette={() => setPaletteOpen(true)} />
        <main className="flex-1 overflow-auto">
          <div className="mx-auto w-full max-w-7xl p-6">
            {!canView ? (
              <UnauthorizedState />
            ) : !DEV_MODE && ws.status === "loading" ? (
              <LoadingState label="Carregando workspace…" />
            ) : ws.status === "error" ? (
              <ErrorState
                title="Não foi possível carregar o workspace"
                description={ws.error ?? "Erro desconhecido ao buscar dados do workspace."}
                onRetry={ws.retry}
              />
            ) : ws.status === "empty" ? (
              <EmptyState
                title="Nenhum workspace encontrado"
                description="Você ainda não faz parte de um workspace Altech. Peça um convite ao administrador."
              />
            ) : (
              <Outlet />
            )}
          </div>
        </main>
      </div>
      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
    </div>
  );
}
