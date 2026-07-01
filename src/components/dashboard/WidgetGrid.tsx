import * as React from "react";
import { cn } from "@/lib/utils";

export interface WidgetGridProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  columns?: 1 | 2 | 3 | 4 | 5 | 6;
}

const colsClasses: Record<number, string> = {
  1: "grid-cols-1",
  2: "grid-cols-1 sm:grid-cols-2",
  3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
  4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
  5: "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5",
  6: "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6",
};

export function WidgetGrid({ children, columns = 3, className, ...props }: WidgetGridProps) {
  return (
    <div className={cn("grid gap-4", colsClasses[columns], className)} {...props}>
      {children}
    </div>
  );
}
