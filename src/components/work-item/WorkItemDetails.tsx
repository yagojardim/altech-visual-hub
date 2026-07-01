import { useCan } from "@/lib/auth";
import { UnauthorizedState, LoadingState, ErrorState } from "@/components/states";
import { WorkItemHeader, type WorkItemHeaderProps } from "./WorkItemHeader";
import { WorkItemContent, type WorkItemContentProps } from "./WorkItemContent";
import { WorkItemFooter, type WorkItemFooterProps } from "./WorkItemFooter";
import { WorkItemChecklist } from "./WorkItemChecklist";
import { WorkItemComments } from "./WorkItemComments";
import { WorkItemAttachments } from "./WorkItemAttachments";
import { WorkItemHistory } from "./WorkItemHistory";
import { cn } from "@/lib/utils";

export interface WorkItemDetailsProps
  extends WorkItemHeaderProps,
    WorkItemContentProps,
    WorkItemFooterProps {
  loading?: boolean;
  error?: Error | null;
  onRetry?: () => void;
  className?: string;
}

export function WorkItemDetails({
  itemId,
  title,
  project,
  status,
  priority,
  description,
  owner,
  dueDate,
  type,
  onSave,
  onCancel,
  loading,
  error,
  onRetry,
  className,
}: WorkItemDetailsProps) {
  const canView = useCan("workitem.view");

  if (!canView) return <UnauthorizedState />;
  if (loading) return <LoadingState label="Carregando work item…" />;
  if (error) return <ErrorState onRetry={onRetry} />;

  return (
    <div className={cn("space-y-6", className)}>
      <WorkItemHeader
        itemId={itemId}
        title={title}
        project={project}
        status={status}
        priority={priority}
      />
      <WorkItemContent
        description={description}
        owner={owner}
        dueDate={dueDate}
        type={type}
      />
      <WorkItemChecklist />
      <WorkItemComments />
      <WorkItemAttachments />
      <WorkItemHistory />
      <WorkItemFooter onSave={onSave} onCancel={onCancel} />
    </div>
  );
}
