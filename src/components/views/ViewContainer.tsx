import type { ReactNode } from "react";

export function ViewContainer({
  header,
  toolbar,
  children,
}: {
  header?: ReactNode;
  toolbar?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="flex min-h-[60vh] flex-col overflow-hidden rounded-xl border border-border bg-panel">
      {header}
      {toolbar && (
        <div className="flex items-center justify-between gap-3 border-b border-border bg-panel-elevated/40 px-4 py-2">
          {toolbar}
        </div>
      )}
      <div className="flex-1 overflow-auto p-4">{children}</div>
    </section>
  );
}
