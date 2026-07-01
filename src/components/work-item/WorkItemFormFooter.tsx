import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface WorkItemFormFooterProps {
  onCancel?: () => void;
  onSubmit?: () => void;
  submitLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  className?: string;
}

/** Footer with Cancel / Create Item actions. Visual placeholder — no behavior. */
export function WorkItemFormFooter({
  onCancel,
  onSubmit,
  submitLabel = "Criar Item",
  cancelLabel = "Cancelar",
  loading,
  className,
}: WorkItemFormFooterProps) {
  return (
    <footer
      className={cn(
        "flex items-center justify-end gap-2 border-t border-border bg-panel px-4 py-3",
        className,
      )}
    >
      <Button variant="outline" size="sm" onClick={onCancel}>
        {cancelLabel}
      </Button>
      <Button size="sm" onClick={onSubmit} disabled={loading}>
        {loading ? "Criando…" : submitLabel}
      </Button>
    </footer>
  );
}
