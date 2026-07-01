import type { ReactNode } from "react";
import { useCan, type Permission } from "@/lib/auth";

/** Permission-driven UI gate. Renders children only if user has permission. */
export function Can({
  permission,
  fallback = null,
  children,
}: {
  permission: Permission;
  fallback?: ReactNode;
  children: ReactNode;
}) {
  const allowed = useCan(permission);
  return <>{allowed ? children : fallback}</>;
}
