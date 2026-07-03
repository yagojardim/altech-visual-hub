import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { AuthProvider } from "@/lib/auth";
import { ThemeProvider } from "@/lib/theme";
import { Toaster } from "@/components/ui/sonner";

const themeInitScript = `(function(){try{var s=localStorage.getItem('altech_theme');var t=(s==='light'||s==='dark')?s:(window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'dark');var r=document.documentElement;r.classList.toggle('dark',t==='dark');r.classList.toggle('light',t==='light');r.setAttribute('data-theme',t);}catch(e){document.documentElement.classList.add('dark');}})();`;

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold">Página não encontrada</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          O recurso que você procura não existe ou foi movido.
        </p>
        <div className="mt-6">
          <Link
            to="/dashboard"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Ir ao Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold">Esta página não carregou</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Ocorreu um erro ao carregar. Tente novamente.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => { router.invalidate(); reset(); }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Tentar novamente
          </button>
          <a
            href="/dashboard"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent"
          >
            Ir ao Dashboard
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Altech Project" },
      { name: "description", content: "Altech Project — workspace, boards e projetos da Altech." },
      { property: "og:title", content: "Altech Project" },
      { property: "og:description", content: "Altech Project — workspace, boards e projetos da Altech." },
      { property: "og:type", content: "website" },
      { name: "twitter:title", content: "Altech Project" },
      { name: "twitter:description", content: "Altech Project — workspace, boards e projetos da Altech." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/50226c9a-2e82-40aa-8b54-05da9e2f98c9/id-preview-f8066acb--32cf8952-e448-435c-aef7-22a633dc1547.lovable.app-1782865600575.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/50226c9a-2e82-40aa-8b54-05da9e2f98c9/id-preview-f8066acb--32cf8952-e448-435c-aef7-22a633dc1547.lovable.app-1782865600575.png" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      {
        rel: "icon",
        type: "image/svg+xml",
        href: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' rx='14' fill='%232F6BFF'/%3E%3Ctext x='50%25' y='54%25' text-anchor='middle' dominant-baseline='middle' font-family='Sora,Arial,sans-serif' font-size='34' font-weight='700' fill='white'%3EA%3C/text%3E%3C/svg%3E",
      },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700&family=Manrope:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;600&display=swap",
      },
    ],

  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <Outlet />
          <Toaster />
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
