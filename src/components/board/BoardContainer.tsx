import type { ReactNode } from "react";
import { BoardHeader } from "./BoardHeader";
import { BoardToolbar } from "./BoardToolbar";
import { ViewContainer } from "@/components/views/ViewContainer";
import { ViewHeader } from "@/components/views/ViewHeader";
import { ViewSwitcher, type ViewKey } from "@/components/views/ViewSwitcher";

export type BoardContainerProps = {
  title: string;
  description?: string;
  boardActions?: ReactNode;
  viewTitle: string;
  viewDescription?: string;
  activeView: ViewKey;
  onViewChange: (view: ViewKey) => void;
  toolbarRight?: ReactNode;
  empty?: ReactNode;
  children: ReactNode;
};

export function BoardContainer({
  title,
  description,
  boardActions,
  viewTitle,
  viewDescription,
  activeView,
  onViewChange,
  toolbarRight,
  empty,
  children,
}: BoardContainerProps) {
  return (
    <div className="space-y-6">
      <BoardHeader title={title} description={description} actions={boardActions} />

      <ViewContainer
        header={
          <ViewHeader
            title={viewTitle}
            description={viewDescription}
            actions={<ViewSwitcher value={activeView} onChange={onViewChange} />}
          />
        }
        toolbar={<BoardToolbar right={toolbarRight} />}
        empty={empty}
      >
        {children}
      </ViewContainer>
    </div>
  );
}
