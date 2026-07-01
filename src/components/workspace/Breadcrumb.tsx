import { Link } from "@tanstack/react-router";
import { ChevronRight, Home } from "lucide-react";

const LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  boards: "Boards",
  projects: "Projetos",
  "work-items": "Work Items",
  "altech-core": "Altech Core",
};

export function Breadcrumbs({ pathname }: { pathname: string }) {
  const parts = pathname.split("/").filter(Boolean);
  if (parts.length === 0) return null;

  return (
    <nav className="flex items-center gap-1.5 text-sm text-muted-foreground overflow-hidden">
      <Link to="/dashboard" className="flex items-center hover:text-foreground">
        <Home className="h-3.5 w-3.5" />
      </Link>
      {parts.map((part, i) => {
        const isLast = i === parts.length - 1;
        const label = LABELS[part] ?? decodeURIComponent(part);
        return (
          <div key={i} className="flex items-center gap-1.5 min-w-0">
            <ChevronRight className="h-3.5 w-3.5 shrink-0 opacity-50" />
            <span className={isLast ? "text-foreground font-medium truncate" : "truncate"}>
              {label}
            </span>
          </div>
        );
      })}
    </nav>
  );
}
