import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { WorkItemForm } from "./WorkItemForm";
import { WorkItemFormFooter } from "./WorkItemFormFooter";

export interface CreateWorkItemModalProps {
  trigger?: React.ReactNode;
}

/**
 * Visual-only Create Work Item flow. Opens a side sheet with the form
 * foundation and standard footer actions. No persistence.
 */
export function CreateWorkItemModal({ trigger }: CreateWorkItemModalProps) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {trigger ?? (
          <Button size="sm">
            <Plus className="mr-1.5 h-4 w-4" />
            Novo Item
          </Button>
        )}
      </SheetTrigger>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 p-0 sm:max-w-xl lg:max-w-2xl"
      >
        <SheetHeader className="border-b border-border px-4 py-3 text-left">
          <SheetTitle>Novo Work Item</SheetTitle>
          <SheetDescription>
            Preencha os campos abaixo para registrar um novo item no backlog.
          </SheetDescription>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto p-4">
          <WorkItemForm />
        </div>
        <WorkItemFormFooter onCancel={() => setOpen(false)} />
      </SheetContent>
    </Sheet>
  );
}
