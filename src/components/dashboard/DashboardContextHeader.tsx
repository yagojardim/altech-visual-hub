import { CalendarDays, Building2, Briefcase, Timer } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { useWorkspace } from "@/lib/workspace";
import { useDevRole, DEV_ROLES, type DevRole } from "@/lib/dev-role";
import { supabase } from "@/lib/supabase";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const SPRINT_ACTIVE = new Set([
  "ativa",
  "ativo",
  "em andamento",
  "andamento",
  "em progresso",
  "iniciada",
  "active",
  "in_progress",
]);

interface ActiveSprint {
  id: string;
  name: string;
  end_date: string | null;
}

function fmtDate(iso?: string | null) {
  if (!iso) return null;
  try {
    return new Date(iso).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
    });
  } catch {
    return null;
  }
}

function todayLabel() {
  return new Date().toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export function DashboardContextHeader() {
  const { user } = useAuth();
  const { current, organization } = useWorkspace();
  const { role, setRole } = useDevRole();
  const [sprint, setSprint] = useState<ActiveSprint | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data, error } = await supabase
          .from("sprints")
          .select("id, name, status, end_date, start_date")
          .order("start_date", { ascending: false })
          .limit(20);
        if (error) throw error;
        const active = (data ?? []).find((s) =>
          SPRINT_ACTIVE.has((s.status ?? "").toString().toLowerCase()),
        ) as ActiveSprint | undefined;
        if (!cancelled) setSprint(active ?? null);
      } catch {
        if (!cancelled) setSprint(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-wider text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays className="h-3 w-3" aria-hidden="true" />
              {todayLabel()}
            </span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Olá, {user?.name ?? "Convidado"}
          </h1>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1.5 rounded-md border border-border bg-panel px-2 py-1 text-muted-foreground">
              <Building2 className="h-3 w-3" aria-hidden="true" />
              {organization.name}
            </span>
            {current && (
              <span className="inline-flex items-center gap-1.5 rounded-md border border-border bg-panel px-2 py-1 text-muted-foreground">
                <Briefcase className="h-3 w-3" aria-hidden="true" />
                {current.name}
                <span className="text-[10px] uppercase text-muted-foreground/70">
                  · {current.plan}
                </span>
              </span>
            )}
            <Badge
              variant="outline"
              className="border-primary/30 bg-primary/10 text-primary"
            >
              Papel: {role}
            </Badge>
            {sprint ? (
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-md border border-accent/30 bg-accent/10 px-2 py-1 text-accent",
                )}
              >
                <Timer className="h-3 w-3" aria-hidden="true" />
                Sprint ativa: {sprint.name}
                {fmtDate(sprint.end_date) && (
                  <span className="text-[10px] text-accent/80">
                    · até {fmtDate(sprint.end_date)}
                  </span>
                )}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-md border border-dashed border-border px-2 py-1 text-muted-foreground">
                <Timer className="h-3 w-3" aria-hidden="true" />
                Sem sprint ativa
              </span>
            )}
          </div>
        </div>

        <div className="w-full max-w-xs shrink-0 space-y-1">
          <label
            htmlFor="dev-role-selector"
            className="text-[11px] uppercase tracking-wider text-muted-foreground"
          >
            Perfil de DEV (piloto)
          </label>
          <Select value={role} onValueChange={(v) => setRole(v as DevRole)}>
            <SelectTrigger id="dev-role-selector" aria-label="Selecionar papel de DEV">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DEV_ROLES.map((r) => (
                <SelectItem key={r} value={r}>
                  {r}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-[10px] text-muted-foreground">
            Switcher temporário — define qual dashboard renderizar.
          </p>
        </div>
      </div>
    </section>
  );
}
