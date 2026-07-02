import { Link } from "@tanstack/react-router";
import { ChevronRight, Home } from "lucide-react";
import { MOCK_PROJECTS } from "@/lib/mock-projects";

const LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  boards: "Boards",
  projects: "Projetos",
  "work-items": "Work Items",
  automation: "Automação",
  ...Object.fromEntries(MOCK_PROJECTS.map((p) => [p.projectId, p.name])),
};

function formatSegment(segment: string) {
  const decoded = decodeURIComponent(segment);
  if (LABELS[decoded]) return LABELS[decoded];
  return decoded
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function Breadcrumbs({ pathname }: { pathname: string }) {
  const parts = pathname.split("/").filter(Boolean);
  if (parts.length === 0) return null;

  return (
    <nav
      aria-label="Breadcrumb"
      className="flex min-w-0 items-center gap-1.5 overflow-hidden text-sm text-muted-foreground"
    >
      <Link
        to="/dashboard"
        className="flex items-center rounded-sm p-0.5 transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        aria-label="Dashboard"
      >
        <Home className="h-3.5 w-3.5" />
      </Link>
      {parts.map((part, i) => {
        const isLast = i === parts.length - 1;
        const label = formatSegment(part);
        return (
          <div key={i} className="flex min-w-0 items-center gap-1.5">
            <ChevronRight className="h-3.5 w-3.5 shrink-0 opacity-50" aria-hidden />
            <span
              className={
                isLast
                  ? "truncate font-medium text-foreground"
                  : "truncate"
              }
              aria-current={isLast ? "page" : undefined}
            >
              {label}
            </span>
          </div>
        );
      })}
    </nav>
  );
}

