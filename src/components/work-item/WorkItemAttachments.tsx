import { Paperclip } from "lucide-react";
import { WidgetHeader } from "@/components/dashboard/WidgetHeader";
import { cn } from "@/lib/utils";
import { UploadModal } from "./UploadModal";
import { AttachmentList } from "./AttachmentList";
import { StorageIndicator } from "./StorageIndicator";
import type { AttachmentCardProps } from "./AttachmentCard";

export interface WorkItemAttachmentsProps {
  loading?: boolean;
  className?: string;
}

const MOCK_ATTACHMENTS: AttachmentCardProps[] = [
  {
    name: "especificacao-tecnica.pdf",
    size: "2,4 MB",
    type: "PDF",
    uploadedAt: "28 jun 2026",
    author: "Ana Silva",
  },
  {
    name: "wireframe-v2.png",
    size: "812 KB",
    type: "PNG",
    uploadedAt: "27 jun 2026",
    author: "Rafael Costa",
  },
  {
    name: "arquitetura-permissoes.docx",
    size: "134 KB",
    type: "DOCX",
    uploadedAt: "25 jun 2026",
    author: "Ana Silva",
  },
];

export function WorkItemAttachments({ loading, className }: WorkItemAttachmentsProps) {
  return (
    <section className={cn("space-y-3", className)}>
      <WidgetHeader
        title="Anexos"
        icon={Paperclip}
        description="Arquivos relacionados"
        action={<UploadModal />}
      />
      {loading ? (
        <div className="h-24 animate-pulse rounded-xl border border-border bg-panel/40" />
      ) : (
        <div className="space-y-3">
          <StorageIndicator />
          <AttachmentList items={MOCK_ATTACHMENTS} />
        </div>
      )}
    </section>
  );
}
