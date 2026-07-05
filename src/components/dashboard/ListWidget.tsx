import * as React from "react";
import { Link } from "@tanstack/react-router";
import { User, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { typeMeta, typeBadgeStyle, priorityMeta } from "@/lib/work-item-type-style";
import { pickAvatarColor } from "@/lib/team-members-api";
import { WidgetCard } from "./WidgetCard";
import { WidgetHeader } from "./WidgetHeader";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { EmptyState } from "@/components/states";

export interface ListWidgetItem {
  id: string;
  title: string;
  itemKey?: string | null;
  type?: string | null;
  priority?: string | null;
  status?: string | null;
  assignee?: string | null;
  /** Caminho absoluto interno (ex.: /work-items/$id?from=/dashboard). */
  href?: string;
  onClick?: () => void;
}

export interface ListWidgetProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  description?: string;
  icon?: LucideIcon;
  items: ListWidgetItem[];
  emptyTitle?: string;
  emptyDescription?: string;
  onItemClick?: (item: ListWidgetItem) => void;
}

function initials(name?: string | null) {
  if (!name) return null;
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("") || null;
}

function ItemRow({
  item,
  onItemClick,
}: {
  item: ListWidgetItem;
  onItemClick?: (item: ListWidgetItem) => void;
}) {
  const type = typeMeta(item.type);
  const priority = item.priority ? priorityMeta(item.priority) : null;
  const assigneeInitials = initials(item.assignee);
  const avatarColor = pickAvatarColor(item.assignee ?? item.id);

  const content = (
    <div className="flex min-w-0 items-center justify-between gap-3">
      <div className="flex min-w-0 flex-col gap-1">
        <div className="flex items-center gap-2">
          {item.itemKey && (
            <span className="shrink-0 font-mono text-[10px] text-muted-foreground">
              {item.itemKey}
            </span>
          )}
          <span className="truncate text-sm font-medium text-foreground">{item.title}</span>
        </div>
        {item.status && (
          <span className="text-[11px] text-muted-foreground">{item.status}</span>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <Badge
          variant="outline"
          className="text-[10px] uppercase"
          style={typeBadgeStyle(item.type)}
        >
          {type.label}
        </Badge>
        {priority && (
          <Badge
            variant="outline"
            className={cn("text-[10px] uppercase", priority.className)}
          >
            {priority.label}
          </Badge>
        )}
        <Avatar className="h-6 w-6" title={item.assignee ?? "Sem responsável"}>
          <AvatarFallback
            className="text-[10px] font-medium text-white"
            style={{ backgroundColor: avatarColor }}
          >
            {assigneeInitials ?? <User className="h-3 w-3" />}
          </AvatarFallback>
        </Avatar>
      </div>
    </div>
  );

  const baseClasses =
    "flex items-center gap-2 rounded-md px-2 py-2.5 transition-colors hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

  if (item.href) {
    return (
      <li>
        <Link
          to={item.href}
          className={baseClasses}
          onClick={() => onItemClick?.(item)}
        >
          {content}
        </Link>
      </li>
    );
  }

  if (item.onClick || onItemClick) {
    return (
      <li>
        <button
          type="button"
          className={cn("w-full text-left", baseClasses)}
          onClick={() => {
            item.onClick?.();
            onItemClick?.(item);
          }}
        >
          {content}
        </button>
      </li>
    );
  }

  return <li className={cn("px-2 py-2.5", baseClasses)}>{content}</li>;
}

export function ListWidget({
  title,
  description,
  icon: Icon,
  items,
  emptyTitle = "Nada por aqui ainda",
  emptyDescription = "Nenhum item encontrado.",
  onItemClick,
  className,
  ...props
}: ListWidgetProps) {
  return (
    <WidgetCard className={cn("rounded-lg keep-radius", className)} {...props}>
      <WidgetHeader title={title} description={description} icon={Icon} />
      {items.length === 0 ? (
        <EmptyState title={emptyTitle} description={emptyDescription} className="mt-4" />
      ) : (
        <ul className="mt-3 space-y-1">
          {items.map((item) => (
            <ItemRow key={item.id} item={item} onItemClick={onItemClick} />
          ))}
        </ul>
      )}
    </WidgetCard>
  );
}
