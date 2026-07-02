import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { WorkItemDetails } from "@/components/work-item/WorkItemDetails";
import { getProjectById } from "@/lib/mock-projects";
import { BacklogGroup } from "./BacklogGroup";
import { BacklogItemContainer } from "./BacklogItemContainer";
import { BacklogRow } from "./BacklogRow";

interface BacklogItem {
  type: string;
  title: string;
  level: number;
  active?: boolean;
}

const EPIC_ITEMS: BacklogItem[] = [
  { type: "Épico", title: "Épico de exemplo", level: 0 },
  { type: "Feature", title: "Feature de exemplo", level: 1 },
  { type: "História", title: "História ativa de exemplo", level: 2, active: true },
  { type: "Task", title: "Task selecionada de exemplo", level: 3 },
];

const BUG_ITEMS: BacklogItem[] = [{ type: "Bug", title: "Bug de exemplo", level: 0 }];

const ALL_ITEMS: BacklogItem[] = [...EPIC_ITEMS, ...BUG_ITEMS];

export function BacklogList({ projectId }: { projectId?: string } = {}) {
  const project = getProjectById(projectId);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  const selectedItem =
    selectedKey !== null ? ALL_ITEMS.find((_, i) => `item-${i}` === selectedKey) : null;

  const isSelected = (key: string) => selectedKey === key;
  const handleSelect = (key: string) => () => setSelectedKey(key);

  return (
    <>
      <div className="space-y-3">
        <BacklogGroup title="Épico 1" count={EPIC_ITEMS.length} expanded>
          {EPIC_ITEMS.map((item, index) => {
            const key = `item-${index}`;
            return (
              <BacklogItemContainer
                key={key}
                type={item.type}
                level={item.level}
                active={item.active}
                selected={isSelected(key)}
              >
                <BacklogRow
                  type={item.type}
                  title={item.title}
                  selected={isSelected(key)}
                  active={item.active}
                  onClick={handleSelect(key)}
                />
              </BacklogItemContainer>
            );
          })}
        </BacklogGroup>

        <BacklogGroup title="Bugs" count={BUG_ITEMS.length} expanded={false}>
          {BUG_ITEMS.map((item, index) => {
            const key = `item-${EPIC_ITEMS.length + index}`;
            return (
              <BacklogItemContainer
                key={key}
                type={item.type}
                level={item.level}
                selected={isSelected(key)}
              >
                <BacklogRow
                  type={item.type}
                  title={item.title}
                  selected={isSelected(key)}
                  onClick={handleSelect(key)}
                />
              </BacklogItemContainer>
            );
          })}
        </BacklogGroup>
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
                status="Em progresso"
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
