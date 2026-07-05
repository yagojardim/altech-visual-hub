import * as React from "react";
import { Link } from "@tanstack/react-router";
import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { WidgetCard } from "./WidgetCard";
import { WidgetHeader } from "./WidgetHeader";
import { Button, type ButtonProps } from "@/components/ui/button";

export interface QuickAction {
  id: string;
  label: string;
  icon?: LucideIcon;
  variant?: ButtonProps["variant"];
  onClick?: () => void;
  /** Caminho absoluto interno. Renderizado como <Link> dentro do botão. */
  href?: string;
  disabled?: boolean;
}

export interface QuickActionsProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  description?: string;
  icon?: LucideIcon;
  actions: QuickAction[];
}

export function QuickActions({
  title,
  description,
  icon: Icon,
  actions,
  className,
  ...props
}: QuickActionsProps) {
  const body = (
    <div className="flex flex-wrap items-center gap-2">
      {actions.map((action) => {
        const ActionIcon = action.icon;
        const button = (
          <Button
            variant={action.variant ?? "outline"}
            size="sm"
            disabled={action.disabled}
            onClick={action.href ? undefined : action.onClick}
            asChild={!!action.href}
          >
            {action.href ? (
              <Link to={action.href}>
                {ActionIcon && <ActionIcon className="h-4 w-4" aria-hidden="true" />}
                <span>{action.label}</span>
              </Link>
            ) : (
              <>
                {ActionIcon && <ActionIcon className="h-4 w-4" aria-hidden="true" />}
                <span>{action.label}</span>
              </>
            )}
          </Button>
        );
        return <React.Fragment key={action.id}>{button}</React.Fragment>;
      })}
    </div>
  );

  if (!title) {
    return (
      <div className={cn("flex flex-wrap items-center gap-2", className)} {...props}>
        {actions.map((action) => {
          const ActionIcon = action.icon;
          return (
            <Button
              key={action.id}
              variant={action.variant ?? "outline"}
              size="sm"
              disabled={action.disabled}
              onClick={action.href ? undefined : action.onClick}
              asChild={!!action.href}
            >
              {action.href ? (
                <Link to={action.href}>
                  {ActionIcon && <ActionIcon className="h-4 w-4" aria-hidden="true" />}
                  <span>{action.label}</span>
                </Link>
              ) : (
                <>
                  {ActionIcon && <ActionIcon className="h-4 w-4" aria-hidden="true" />}
                  <span>{action.label}</span>
                </>
              )}
            </Button>
          );
        })}
      </div>
    );
  }

  return (
    <WidgetCard className={cn("!rounded-lg keep-radius", className)} {...props}>
      <WidgetHeader title={title} description={description} icon={Icon} />
      <div className="mt-3">{body}</div>
    </WidgetCard>
  );
}
