import * as React from "react";
import { cn } from "@/lib/utils";

export interface DashboardContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function DashboardContainer({ children, className, ...props }: DashboardContainerProps) {
  return (
    <div className={cn("space-y-8", className)} {...props}>
      {children}
    </div>
  );
}
