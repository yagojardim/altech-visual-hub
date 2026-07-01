import * as React from "react";
import { cn } from "@/lib/utils";

export interface WidgetHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  description?: string;
  action?: React.ReactNode;
  icon?: React.ElementType;
}

export function WidgetHeader({
  title,
  description,
  action,
  icon: Icon,
  className,
  ...props
}: WidgetHeaderProps) {
  return (
    <div
      className={cn(
        "grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4",
        className,
      )}
      {...props}
    >
      <div className="flex min-w-0 items-start gap-2">
        {Icon && <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />}
        <div className="min-w-0">
          {title && <h3 className="truncate text-sm font-medium">{title}</h3>}
          {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
