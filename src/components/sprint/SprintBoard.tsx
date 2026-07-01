import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { WorkItemCard } from "@/components/work-item/WorkItemCard";
import { WorkItemDetails } from "@/components/work-item/WorkItemDetails";
import { cn } from "@/lib/utils";

const COLUMNS = [
  { key: "todo", title: "A Fazer", accent: "bg-primary/60" },
  { key: "in-progress", title: "Em Desenvolvimento", accent: "bg-primary" },
  { key: "review", title: "Em Validação", accent: "bg-warning" },
  { key: "done", title: "Concluído", accent: "bg-success" },
] as const;

const SAMPLE_ITEMS: Record<string, { itemId: string; title: string; type: string }[]> = {
  todo: [
    { itemId: "WI-091", title: "Consolidar navegação do Projeto", type: "História" },
    { itemId: "WI-092", title: "Padronizar Context Header", type: "Task" },
  ],
  "in-progress": [{ itemId: "WI-093", title: "Criar visão da Sprint", type: "História" }],
  review: [{ itemId: "WI-094", title: "Revisar checklist", type: "Task" }],
  done: [{ itemId: "WI-095", title: "Ajuste de contraste", type: "Bug" }],
};

/**
 * Sprint Board — visual kanban for the current sprint. Reuses WorkItemCard
 * and the shared WorkItemDetails sheet. No drag-and-drop.
 */
export function SprintBoard({ className }: { className?: string }) {
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  const selected = (() => {
    if (!selectedKey) return null;
    const [col, idx] = selectedKey.split(":");
    const item = SAMPLE_ITEMS[col]?.[Number(idx)];
    if (!item) return null;
    const status = COLUMNS.find((c) => c.key === col)?.title ?? "";
    return { ...item, status };
  })();

  return (
    <>
      <div
        className={cn(
          "grid gap-3 overflow-x-auto pb-2",
          "grid-cols-[repeat(4,minmax(16rem,1fr))]",
          className,
        )}
      >
        {COLUMNS.map((column) => {
          const items = SAMPLE_ITEMS[column.key] ?? [];
          return (
            <section
              key={column.key}
              className="flex min-w-[16rem] flex-col rounded-xl border border-border bg-panel/60"
            >
              <header className="flex items-center justify-between gap-2 border-b border-border px-3 py-2">
                <div className="flex items-center gap-2">
                  <span className={cn("h-2 w-2 rounded-full", column.accent)} />
                  <h3 className="text-sm font-medium text-foreground">{column.title}</h3>
                </div>
                <span className="rounded-full bg-panel px-2 py-0.5 text-[11px] text-muted-foreground">
                  {items.length}
                </span>
              </header>
              <div className="flex flex-1 flex-col gap-2 p-3">
                {items.map((item, index) => {
                  const key = `${column.key}:${index}`;
                  return (
                    <WorkItemCard
                      key={key}
                      itemId={item.itemId}
                      type={item.type}
                      title={item.title}
                      status={column.title}
                      selected={selectedKey === key}
                      onClick={() => setSelectedKey(key)}
                    />
                  );
                })}
                {items.length === 0 && (
                  <div className="rounded-lg border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
                    Sem itens
                  </div>
                )}
              </div>
            </section>
          );
        })}
      </div>

      <Sheet open={selectedKey !== null} onOpenChange={(open) => !open && setSelectedKey(null)}>
        <SheetContent
          side="right"
          className="w-full overflow-y-auto sm:max-w-xl lg:max-w-2xl"
        >
          <SheetHeader className="sr-only">
            <SheetTitle>Detalhes do Work Item</SheetTitle>
            <SheetDescription>
              Painel lateral com detalhes do item selecionado na sprint.
            </SheetDescription>
          </SheetHeader>
          {selected && (
            <div className="pt-4">
              <WorkItemDetails
                itemId={selected.itemId}
                title={selected.title}
                type={selected.type}
                project="Altech Core"
                status={selected.status}
                priority="Média"
                description="Descrição placeholder do work item."
                owner="Ana Silva"
                dueDate="29/01/2026"
              />
            </div>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
