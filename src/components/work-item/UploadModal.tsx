import { useState } from "react";
import { Upload, CheckCircle2, AlertTriangle, FileUp, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Progress } from "@/components/ui/progress";
import { FormField } from "@/components/forms/FormField";
import { Input, Textarea } from "@/components/forms";
import { StorageIndicator } from "./StorageIndicator";
import { cn } from "@/lib/utils";

export interface UploadModalProps {
  trigger?: React.ReactNode;
}

/**
 * Visual-only upload experience. Prepares drag-and-drop, progress,
 * success and error states plus tenant-level limit messaging.
 * No real upload logic.
 */
export function UploadModal({ trigger }: UploadModalProps) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {trigger ?? (
          <Button size="sm">
            <Upload className="mr-1.5 h-4 w-4" />
            Adicionar Anexo
          </Button>
        )}
      </SheetTrigger>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 p-0 sm:max-w-lg"
      >
        <SheetHeader className="border-b border-border px-4 py-3 text-left">
          <SheetTitle>Adicionar Anexo</SheetTitle>
          <SheetDescription>
            Envie um arquivo para associar a este work item.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 space-y-5 overflow-y-auto p-4">
          <StorageIndicator />

          {/* Drag and drop area */}
          <div
            className={cn(
              "flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-input bg-panel/40 px-6 py-10 text-center",
              "transition-colors hover:border-primary/50 hover:bg-panel-elevated/40",
            )}
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-panel text-muted-foreground">
              <FileUp className="h-5 w-5" />
            </div>
            <p className="text-sm font-medium text-foreground">
              Arraste um arquivo ou clique para selecionar
            </p>
            <p className="text-xs text-muted-foreground">
              Tamanho máximo: 50 MB por arquivo
            </p>
            <Button variant="outline" size="sm" className="mt-2" disabled>
              Selecionar arquivo
            </Button>
          </div>

          <FormField label="Descrição" htmlFor="upload-description" description="Opcional">
            <Textarea
              id="upload-description"
              placeholder="Descreva rapidamente o conteúdo do anexo"
              rows={3}
            />
          </FormField>

          <FormField label="Etiquetas" htmlFor="upload-tags" description="Separe por vírgula">
            <Input id="upload-tags" placeholder="ex: contrato, referência" />
          </FormField>

          {/* Progress placeholder */}
          <div className="space-y-2 rounded-xl border border-border bg-panel p-4">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="truncate font-medium text-foreground">
                especificacao-tecnica.pdf
              </span>
              <span>42%</span>
            </div>
            <Progress value={42} />
            <p className="text-xs text-muted-foreground">Enviando…</p>
          </div>

          {/* Success state */}
          <div className="flex items-start gap-2 rounded-xl border border-success/30 bg-success/5 p-3 text-sm">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
            <div>
              <p className="font-medium text-foreground">Upload concluído</p>
              <p className="text-xs text-muted-foreground">
                O arquivo foi anexado com sucesso.
              </p>
            </div>
          </div>

          {/* Error states */}
          <div className="space-y-2">
            <div className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
              <div>
                <p className="font-medium text-foreground">Arquivo acima de 50 MB</p>
                <p className="text-xs text-muted-foreground">
                  Reduza o tamanho do arquivo ou divida-o em partes menores.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2 rounded-xl border border-warning/30 bg-warning/5 p-3 text-sm">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
              <div>
                <p className="font-medium text-foreground">
                  Limite de anexos deste item atingido
                </p>
                <p className="text-xs text-muted-foreground">
                  Remova um anexo existente para adicionar um novo.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-border px-4 py-3">
          <Button variant="ghost" onClick={() => setOpen(false)}>
            <X className="mr-1.5 h-4 w-4" />
            Cancelar
          </Button>
          <Button disabled>
            <Upload className="mr-1.5 h-4 w-4" />
            Enviar anexo
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
