import { Paperclip, Upload } from "lucide-react";
import { WidgetHeader } from "@/components/dashboard/WidgetHeader";
import { EmptyState } from "@/components/states";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface WorkItemAttachmentsProps {
  loading?: boolean;
  className?: string;
}

export function WorkItemAttachments({ loading, className }: WorkItemAttachmentsProps) {
  return (
    <section className={cn("space-y-3", className)}>
      <div className="flex items-start justify-between gap-3">
        <WidgetHeader
          title="Anexos"
          icon={Paperclip}
          description="Arquivos relacionados"
        />
        <Button variant="outline" size="sm" disabled>
          <Upload className="h-3.5 w-3.5" />
          Enviar arquivo
        </Button>
      </div>
      {loading ? (
        <div className="h-24 animate-pulse rounded-xl border border-border bg-panel/40" />
      ) : (
        <EmptyState
          title="Sem anexos"
          description="Os arquivos anexados aparecerão aqui."
          icon={<Paperclip className="h-5 w-5" />}
        />
      )}
    </section>
  );
}
