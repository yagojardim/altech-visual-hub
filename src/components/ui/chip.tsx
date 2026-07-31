import type { CSSProperties, ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { SEMANTIC_COLOR } from "@/lib/work-item-type-style";

export type ChipVariant =
  | "default"
  | "accent"
  | "success"
  | "warn"
  | "crit"
  | "purple"
  | "custom";

export type ChipSize = "xs" | "sm" | "md";

/** Cores por variant — todas lidas de tokens CSS já existentes. */
export const CHIP_VARIANT_COLOR: Record<Exclude<ChipVariant, "custom">, string> = {
  default: SEMANTIC_COLOR.backlog,
  accent: SEMANTIC_COLOR.inprogress,
  success: SEMANTIC_COLOR.healthy,
  warn: SEMANTIC_COLOR.warning,
  crit: SEMANTIC_COLOR.blocked,
  purple: "var(--purple)",
};

const SIZE_CLASS: Record<ChipSize, string> = {
  xs: "h-5 px-1.5 gap-1 text-[10px]",
  sm: "h-6 px-2 gap-1.5 text-[11px]",
  md: "h-7 px-2.5 gap-1.5 text-[12px]",
};

const DOT_SIZE: Record<ChipSize, string> = {
  xs: "h-1.5 w-1.5",
  sm: "h-1.5 w-1.5",
  md: "h-2 w-2",
};

export function chipColor(variant: ChipVariant = "default", color?: string): string {
  if (variant === "custom") return color ?? CHIP_VARIANT_COLOR.default;
  return CHIP_VARIANT_COLOR[variant];
}

export function chipStyle(variant: ChipVariant = "default", color?: string): CSSProperties {
  const c = chipColor(variant, color);
  return {
    color: c,
    background: `color-mix(in srgb, ${c} 16%, transparent)`,
    borderColor: `color-mix(in srgb, ${c} 34%, transparent)`,
  };
}

export interface ChipProps {
  label: ReactNode;
  variant?: ChipVariant;
  /** hex/valor custom — usado apenas quando variant='custom' */
  color?: string;
  size?: ChipSize;
  removable?: boolean;
  dot?: boolean;
  icon?: ReactNode;
  active?: boolean;
  onClick?: () => void;
  onRemove?: () => void;
  className?: string;
  title?: string;
}

export function Chip({
  label,
  variant = "default",
  color,
  size = "sm",
  removable = false,
  dot = false,
  icon,
  active = false,
  onClick,
  onRemove,
  className,
  title,
}: ChipProps) {
  const c = chipColor(variant, color);
  const style: CSSProperties = {
    ...chipStyle(variant, color),
    ...(active
      ? {
          background: `color-mix(in srgb, ${c} 26%, transparent)`,
          borderColor: `color-mix(in srgb, ${c} 55%, transparent)`,
        }
      : null),
  };

  return (
    <span
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
      title={title}
      style={style}
      className={cn(
        "keep-radius inline-flex shrink-0 items-center whitespace-nowrap rounded-md border font-medium leading-none",
        SIZE_CLASS[size],
        onClick && "cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
        className,
      )}
    >
      {dot ? (
        <span
          aria-hidden
          className={cn("rounded-full", DOT_SIZE[size])}
          style={{ background: c }}
        />
      ) : null}
      {icon}
      <span className="truncate">{label}</span>
      {removable ? (
        <button
          type="button"
          aria-label="Remover"
          onClick={(e) => {
            e.stopPropagation();
            onRemove?.();
          }}
          className="ml-0.5 inline-flex items-center opacity-70 transition-opacity hover:opacity-100"
        >
          <X size={size === "md" ? 12 : 10} />
        </button>
      ) : null}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* StatusBadge — status de work item                                   */
/* ------------------------------------------------------------------ */

export type WorkItemStatus =
  | "backlog"
  | "todo"
  | "in-progress"
  | "in-review"
  | "done"
  | "blocked"
  | "ready"
  | "testing"
  | "cancelled";

const STATUS_MAP: Record<WorkItemStatus, { label: string; variant: ChipVariant }> = {
  backlog: { label: "Backlog", variant: "default" },
  todo: { label: "A fazer", variant: "default" },
  "in-progress": { label: "Em progresso", variant: "accent" },
  "in-review": { label: "Em revisão", variant: "purple" },
  ready: { label: "Pronto p/ sprint", variant: "accent" },
  testing: { label: "Em teste", variant: "warn" },
  done: { label: "Concluído", variant: "success" },
  blocked: { label: "Bloqueado", variant: "crit" },
  cancelled: { label: "Cancelado", variant: "default" },
};

const STATUS_ALIAS: Record<string, WorkItemStatus> = {
  backlog: "backlog",
  "a-fazer": "todo",
  "em-progresso": "in-progress",
  "em-revisão": "in-review",
  "em-revisao": "in-review",
  revisão: "in-review",
  revisao: "in-review",
  concluído: "done",
  concluido: "done",
  pronto: "ready",
  "pronto-p-sprint": "ready",
  "em-teste": "testing",
  bloqueado: "blocked",
  cancelado: "cancelled",
};

function normalizeStatus(status?: string | null): WorkItemStatus | null {
  const key = (status ?? "").toLowerCase().trim().replace(/[\s_]+/g, "-");
  if (key in STATUS_ALIAS) return STATUS_ALIAS[key];
  return key in STATUS_MAP ? (key as WorkItemStatus) : null;
}

export function StatusBadge({
  status,
  size = "sm",
  dot = true,
  className,
}: {
  status?: string | null;
  size?: ChipSize;
  dot?: boolean;
  className?: string;
}) {
  const key = normalizeStatus(status);
  const meta = key ? STATUS_MAP[key] : { label: status ?? "—", variant: "default" as ChipVariant };
  return <Chip label={meta.label} variant={meta.variant} size={size} dot={dot} className={className} />;
}

/* ------------------------------------------------------------------ */
/* ConditionalTag                                                      */
/* ------------------------------------------------------------------ */

export type TagSeverity = "warn" | "crit" | "info" | "neutral";

const SEVERITY_VARIANT: Record<TagSeverity, ChipVariant> = {
  warn: "warn",
  crit: "crit",
  info: "accent",
  neutral: "default",
};

export function ConditionalTag({
  label,
  severity = "neutral",
  size = "xs",
  className,
}: {
  label: ReactNode;
  severity?: TagSeverity;
  size?: ChipSize;
  className?: string;
}) {
  return <Chip label={label} variant={SEVERITY_VARIANT[severity]} size={size} className={className} />;
}
