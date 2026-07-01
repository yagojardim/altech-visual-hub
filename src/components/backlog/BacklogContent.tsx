import { Filter, Layers } from "lucide-react";
import { WidgetCard } from "@/components/dashboard/WidgetCard";
import { WidgetHeader } from "@/components/dashboard/WidgetHeader";
import { BacklogList } from "./BacklogList";

const TYPES = ["Épicos", "Features", "Histórias", "Tasks", "Bugs"];

export function BacklogContent() {
  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_16rem]">
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {TYPES.map((type) => (
            <span
              key={type}
              className="inline-flex items-center rounded-full border border-border bg-panel px-3 py-1 text-xs text-muted-foreground"
            >
              {type}
            </span>
          ))}
        </div>

        <div className="overflow-hidden rounded-xl border border-border bg-panel">
          <div className="flex items-center gap-2 border-b border-border bg-panel-elevated/50 px-4 py-2 text-xs uppercase tracking-wider text-muted-foreground">
            <Layers className="h-3.5 w-3.5" />
            <span>Listagem de itens</span>
          </div>
          <div className="p-4">
            <BacklogList />
          </div>
        </div>
      </div>

      <WidgetCard className="h-fit">
        <WidgetHeader title="Filtros" description="Refinar listagem" icon={Filter} />
        <div className="mt-4 space-y-3">
          <div className="h-8 rounded-md border border-dashed border-border bg-panel/40" />
          <div className="h-8 rounded-md border border-dashed border-border bg-panel/40" />
          <div className="h-8 rounded-md border border-dashed border-border bg-panel/40" />
        </div>
      </WidgetCard>
    </div>
  );
}
