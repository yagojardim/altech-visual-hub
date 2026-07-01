import * as React from "react";
import { Layers } from "lucide-react";
import { cn } from "@/lib/utils";
import { WidgetCard } from "./WidgetCard";
import { WidgetHeader } from "./WidgetHeader";

export interface WidgetPlaceholderProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  description?: string;
  icon?: React.ElementType;
}

export function WidgetPlaceholder({
  title = "Widget",
  description = "Conteúdo em desenvolvimento.",
  icon: Icon = Layers,
  className,
  ...props
}: WidgetPlaceholderProps) {
  return (
    <WidgetCard className={cn("min-h-[160px]", className)} {...props}>
      <WidgetHeader title={title} description={description} icon={Icon} />
      <div className="mt-4 rounded-lg border border-dashed border-border bg-background/50 p-4">
        <div className="flex flex-col items-center justify-center gap-2 text-center text-muted-foreground">
          <Icon className="h-6 w-6 opacity-40" />
          <span className="text-xs">Placeholder de widget</span>
        </div>
      </div>
    </WidgetCard>
  );
}
