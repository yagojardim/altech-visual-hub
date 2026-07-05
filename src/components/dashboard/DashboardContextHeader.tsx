import { useAuth } from "@/lib/auth";
import { useDevRole, DEV_ROLES, type DevRole } from "@/lib/dev-role";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

function todayLabel() {
  return new Date()
    .toLocaleDateString("pt-BR", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
    })
    .toUpperCase();
}

export function DashboardContextHeader() {
  const { user } = useAuth();
  const { role, setRole } = useDevRole();

  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div className="min-w-0 space-y-1">
        <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          {todayLabel()}
        </p>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Olá, {user?.name ?? "Convidado"}
        </h1>
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
      </div>
    </div>
  );
}
