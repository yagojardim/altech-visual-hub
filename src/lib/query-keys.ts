// Namespace único de cache do piloto (Inspection Mode, sem multi-tenant no schema).
const DEFAULT_TENANT_ID = "default";

/**
 * Central TanStack Query keys, scoped by tenant so future multi-tenant
 * switches don't cause cache collisions.
 *
 * Convention:
 *   ["projects", tenantId]
 *   ["work_items", tenantId, "byProject", projectRef]
 *   ["work_items", tenantId, "detail", id]
 */
export const qk = {
  projects: (tenantId: string = DEFAULT_TENANT_ID) =>
    ["projects", tenantId] as const,

  workItems: (tenantId: string = DEFAULT_TENANT_ID) =>
    ["work_items", tenantId] as const,

  workItemsByProject: (
    projectRef: string,
    tenantId: string = DEFAULT_TENANT_ID,
  ) => ["work_items", tenantId, "byProject", projectRef] as const,

  workItem: (id: string, tenantId: string = DEFAULT_TENANT_ID) =>
    ["work_items", tenantId, "detail", id] as const,

  workItemsByBoard: (
    boardId: string,
    tenantId: string = DEFAULT_TENANT_ID,
  ) => ["work_items", tenantId, "byBoard", boardId] as const,

  workItemsBacklog: (tenantId: string = DEFAULT_TENANT_ID) =>
    ["work_items", tenantId, "backlog"] as const,

  teamMembers: (tenantId: string = DEFAULT_TENANT_ID) =>
    ["team_members", tenantId] as const,
};

