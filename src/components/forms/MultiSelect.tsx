import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface MultiSelectPlaceholderProps {
  placeholder?: string;
  disabled?: boolean;
  readOnly?: boolean;
  className?: string;
}

/** Placeholder visual — no functional multi-select yet. */
export function MultiSelectPlaceholder({
  placeholder = "Selecione uma ou mais opções…",
  disabled,
  readOnly,
  className,
}: MultiSelectPlaceholderProps) {
  return (
    <button
      type="button"
      disabled={disabled || readOnly}
      aria-readonly={readOnly}
      className={cn(
        "flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm transition-colors",
        "text-muted-foreground hover:bg-accent/40",
        "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
        "disabled:cursor-not-allowed disabled:opacity-50",
        readOnly && "cursor-default opacity-80 hover:bg-transparent",
        className,
      )}
    >
      <span>{placeholder}</span>
      <ChevronDown className="h-4 w-4 opacity-50" />
    </button>
  );
}
