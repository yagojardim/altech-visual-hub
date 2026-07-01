import { File, FileImage, FileText, FileArchive, Download, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface AttachmentCardProps {
  name: string;
  size: string;
  type: string;
  uploadedAt: string;
  author: string;
  className?: string;
}

function iconFor(type: string) {
  const t = type.toLowerCase();
  if (t.includes("image") || t.includes("png") || t.includes("jpg")) return FileImage;
  if (t.includes("pdf") || t.includes("doc") || t.includes("text")) return FileText;
  if (t.includes("zip") || t.includes("rar")) return FileArchive;
  return File;
}

export function AttachmentCard({
  name,
  size,
  type,
  uploadedAt,
  author,
  className,
}: AttachmentCardProps) {
  const Icon = iconFor(type);
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-xl border border-border bg-panel p-3 transition-colors hover:border-primary/40",
        className,
      )}
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-panel-elevated text-muted-foreground">
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-medium text-foreground">{name}</span>
          <Badge variant="outline" className="text-[10px] uppercase">
            {type}
          </Badge>
        </div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
          <span>{size}</span>
          <span>•</span>
          <span>{uploadedAt}</span>
          <span>•</span>
          <span>{author}</span>
        </div>
      </div>
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" disabled aria-label="Baixar anexo">
          <Download className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" disabled aria-label="Mais ações">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
