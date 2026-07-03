import { createFileRoute, Outlet, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Sidebar, SidebarContent as SidebarNavContent } from "@/components/workspace/Sidebar";
import { Topbar } from "@/components/workspace/Topbar";
import { Breadcrumbs } from "@/components/workspace/Breadcrumb";
import { CommandPalette } from "@/components/workspace/CommandPalette";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { WorkspaceProvider } from "@/lib/workspace";
import { ensureSeed } from "@/lib/projects-api";

export const Route = createFileRoute("/_workspace")({
  component: WorkspaceRoute,
});

function WorkspaceRoute() {
  return (
    <WorkspaceProvider>
      <WorkspaceLayout />
    </WorkspaceProvider>
  );
}

function WorkspaceLayout() {
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />

      <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
        <SheetContent side="left" className="w-64 p-0 bg-sidebar">
          <SidebarNavContent onNavigate={() => setMobileNavOpen(false)} />
        </SheetContent>
      </Sheet>

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar
          onOpenPalette={() => setPaletteOpen(true)}
          onOpenMobileNav={() => setMobileNavOpen(true)}
        />
        <div className="border-b border-border bg-background/60 px-4 py-2">
          <div className="mx-auto w-full max-w-7xl">
            <Breadcrumbs pathname={pathname} />
          </div>
        </div>
        <main className="flex-1 overflow-auto">
          <div className="mx-auto w-full max-w-7xl p-6">
            <Outlet />
          </div>
        </main>
      </div>

      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
    </div>
  );
}
