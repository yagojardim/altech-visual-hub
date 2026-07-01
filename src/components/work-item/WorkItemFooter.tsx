import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export interface WorkItemFooterProps {
  onSave?: () => void;
  onCancel?: () => void;
  className?: string;
}

export function WorkItemFooter({
  onSave,
  onCancel,
  className,
}: WorkItemFooterProps) {
  return (
    <footer
      className={cn(
        "flex items-center justify-end gap-2 rounded-xl border border-border bg-panel p-4",
        className,
      )}
    >
      <Button variant="outline" size="sm" onClick={onCancel}>
        Cancelar
      </Button>
      <Button size="sm" onClick={onSave}>
        Salvar
      </Button>
    </footer>
  );
}
