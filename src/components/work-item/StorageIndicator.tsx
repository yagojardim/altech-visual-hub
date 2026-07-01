import { HardDrive, AlertTriangle } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

export interface StorageIndicatorProps {
  /** Percentual usado (0-100). */
  usedPercent?: number;
  usedLabel?: string;
  totalLabel?: string;
  className?: string;
}

export function StorageIndicator({
  usedPercent = 62,
  usedLabel = "6,2 GB",
  totalLabel = "10 GB",
  className,
}: StorageIndicatorProps) {
  const level =
    usedPercent >= 100
      ? "full"
      : usedPercent >= 90
        ? "critical"
        : usedPercent >= 80
          ? "warning"
          : "ok";

  const message =
    level === "full"
      ? "Armazenamento do tenant esgotado. Libere espaço para enviar novos arquivos."
      : level === "critical"
        ? "Armazenamento em 90%. Considere remover arquivos não utilizados."
        : level === "warning"
          ? "Armazenamento em 80%. Fique de olho no consumo do tenant."
          : null;

  const tone =
    level === "full" || level === "critical"
      ? "text-destructive"
      : level === "warning"
        ? "text-warning"
        : "text-muted-foreground";

  return (
    <div
      className={cn(
        "space-y-2 rounded-xl border border-border bg-panel p-4",
        className,
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-foreground">
          <HardDrive className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">Armazenamento do tenant</span>
        </div>
        <span className={cn("text-xs font-medium", tone)}>
          {usedLabel} / {totalLabel}
        </span>
      </div>
      <Progress value={Math.min(usedPercent, 100)} />
      {message && (
        <p className={cn("flex items-start gap-1.5 text-xs", tone)}>
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>{message}</span>
        </p>
      )}
    </div>
  );
}
