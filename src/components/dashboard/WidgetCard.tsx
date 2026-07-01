import * as React from "react";
import { cn } from "@/lib/utils";

export interface WidgetCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  as?: "div" | "article" | "section";
  hover?: boolean;
}

export function WidgetCard({
  children,
  className,
  as: Tag = "div",
  hover = false,
  ...props
}: WidgetCardProps) {
  return (
    <Tag
      className={cn(
        "rounded-xl border border-border bg-panel p-5 shadow-sm",
        hover && "transition-all hover:border-primary/40 hover:bg-panel-elevated",
        className,
      )}
      {...props}
    >
      {children}
    </Tag>
  );
}
