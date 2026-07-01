import { MessageSquare, Send } from "lucide-react";
import { WidgetHeader } from "@/components/dashboard/WidgetHeader";
import { EmptyState } from "@/components/states";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export interface WorkItemCommentsProps {
  loading?: boolean;
  className?: string;
}

export function WorkItemComments({ loading, className }: WorkItemCommentsProps) {
  return (
    <section className={cn("space-y-3", className)}>
      <WidgetHeader
        title="Comentários"
        icon={MessageSquare}
        description="Discussões sobre este work item"
      />
      {loading ? (
        <div className="h-24 animate-pulse rounded-xl border border-border bg-panel/40" />
      ) : (
        <EmptyState
          title="Sem comentários"
          description="Os comentários aparecerão aqui."
          icon={<MessageSquare className="h-5 w-5" />}
        />
      )}
      <div className="space-y-2 rounded-xl border border-border bg-panel p-3">
        <Textarea
          placeholder="Escreva um comentário…"
          className="min-h-[72px] resize-none border-0 bg-transparent p-0 shadow-none focus-visible:ring-0"
          disabled
        />
        <div className="flex justify-end">
          <Button size="sm" disabled>
            <Send className="h-3.5 w-3.5" />
            Comentar
          </Button>
        </div>
      </div>
    </section>
  );
}
