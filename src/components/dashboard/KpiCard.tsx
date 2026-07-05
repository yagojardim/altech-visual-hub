import * as React from "react";
import { TrendingUp, TrendingDown, Minus, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { WidgetCard } from "./WidgetCard";
import { WidgetHeader } from "./WidgetHeader";

export type KpiSeverity = "default" | "info" | "success" | "warning" | "danger";

export interface KpiTrend {
  value: number;
  direction: "up" | "down" | "neutral";
  label?: string;
}

export interface KpiCardProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string;
  value: number | string;
  icon?: LucideIcon;
  severity?: KpiSeverity;
  trend?: KpiTrend;
}

const severityClass: Record<KpiSeverity, string> = {
  default: "bg-primary text-primary",
  info: "bg-[var(--blue-500)] text-[var(--blue-500)]",
  success: "bg-[var(--success-500)] text-[var(--success-500)]",
  warning: "bg-[var(--warning-500)] text-[var(--warning-500)]",
  danger: "bg-[var(--danger-500)] text-[var(--danger-500)]",
};

const TrendIcon: Record<KpiTrend["direction"], LucideIcon> = {
  up: TrendingUp,
  down: TrendingDown,
  neutral: Minus,
};

const trendClass: Record<KpiTrend["direction"], string> = {
  up: "text-[var(--success-500)]",
  down: "text-[var(--danger-500)]",
  neutral: "text-muted-foreground",
};

export function KpiCard({
  label,
  value,
  icon: Icon,
  severity = "default",
  trend,
  className,
  ...props
}: KpiCardProps) {
  const accent = severityClass[severity];
  const Trend = trend ? TrendIcon[trend.direction] : null;

  return (
    <WidgetCard className={cn("relative overflow-hidden rounded-lg keep-radius p-0", className)} {...props}>
      <div className={cn("absolute left-0 top-0 h-1 w-full", accent.split(" ")[0])} />
      <div className="p-5 pt-6">
        <WidgetHeader
          title={label}
          icon={Icon}
          className="text-muted-foreground"
        />
        <div className="mt-3 flex items-end justify-between gap-4">
          <span className={cn("text-3xl font-semibold tracking-tight", accent.split(" ")[1])}>
            {value}
          </span>
          {trend && Trend && (
            <div className={cn("flex items-center gap-1 text-xs font-medium", trendClass[trend.direction])}>
              <Trend className="h-3.5 w-3.5" aria-hidden="true" />
              <span>
                {trend.direction === "up" && "+"}
                {trend.value}%
              </span>
              {trend.label && (
                <span className="ml-1 text-[10px] text-muted-foreground">{trend.label}</span>
              )}
            </div>
          )}
        </div>
      </div>
    </WidgetCard>
  );
}
