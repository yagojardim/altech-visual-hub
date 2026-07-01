import { Paperclip } from "lucide-react";
import { EmptyState } from "@/components/states";
import { AttachmentCard, type AttachmentCardProps } from "./AttachmentCard";
import { cn } from "@/lib/utils";

export interface AttachmentListProps {
  items?: AttachmentCardProps[];
  className?: string;
}

export function AttachmentList({ items = [], className }: AttachmentListProps) {
  if (items.length === 0) {
    return (
      <EmptyState
        title="Sem anexos"
        description="Os arquivos anexados aparecerão aqui."
        icon={<Paperclip className="h-5 w-5" />}
      />
    );
  }

  return (
    <ul className={cn("space-y-2", className)}>
      {items.map((item) => (
        <li key={`${item.name}-${item.uploadedAt}`}>
          <AttachmentCard {...item} />
        </li>
      ))}
    </ul>
  );
}
