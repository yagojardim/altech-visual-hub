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
import { getProjectById } from "@/lib/mock-projects";
import { cn } from "@/lib/utils";

const COLUMNS = [
  { key: "backlog", title: "Backlog", accent: "bg-muted-foreground" },
  { key: "todo", title: "A Fazer", accent: "bg-primary/60" },
  { key: "in-progress", title: "Em Andamento", accent: "bg-primary" },
  { key: "review", title: "Em Validação", accent: "bg-warning" },
  { key: "done", title: "Concluído", accent: "bg-success" },
] as const;

const SAMPLE_ITEMS: Record<string, { title: string; type: string }[]> = {
  backlog: [
    { title: "Item de backlog", type: "História" },
    { title: "Refinamento pendente", type: "Task" },
  ],
  todo: [{ title: "Preparar sprint", type: "Task" }],
  "in-progress": [{ title: "Implementar tela", type: "História" }],
  review: [{ title: "Revisar PR", type: "Task" }],
  done: [{ title: "Ajuste concluído", type: "Bug" }],
};

export function BoardContent({ className, projectId }: { className?: string; projectId?: string }) {
  const project = getProjectById(projectId);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  const selectedItem = (() => {
    if (!selectedKey) return null;
    const [col, idx] = selectedKey.split(":");
    return SAMPLE_ITEMS[col]?.[Number(idx)] ?? null;
  })();
  const selectedStatus = selectedKey
    ? COLUMNS.find((c) => c.key === selectedKey.split(":")[0])?.title
    : undefined;

  return (
    <>
      <div
        className={cn(
          "grid gap-3 overflow-x-auto pb-2",
          "grid-cols-[repeat(5,minmax(16rem,1fr))]",
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
            <SheetDescription>Painel lateral com detalhes do item selecionado</SheetDescription>
          </SheetHeader>
          {selectedItem && (
            <div className="pt-4">
              <WorkItemDetails
                itemId="WI-000"
                title={selectedItem.title}
                type={selectedItem.type}
                project={project.name}
                status={selectedStatus ?? "Em progresso"}
                priority="Média"
                description="Descrição placeholder do work item."
                owner={project.owner}
                dueDate={project.dueDate}
              />
            </div>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
