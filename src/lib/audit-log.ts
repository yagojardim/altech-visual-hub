import { supabase } from "./supabase";

export interface AuditEntry {
  event: string;
  actor_id?: string | null;
  actor_name?: string | null;
  entity_type?: string | null;
  entity_id?: string | null;
  before?: unknown;
  after?: unknown;
}

/**
 * Best-effort insert into public.audit_log. Missing table/columns are
 * swallowed so the UI never breaks. Run supabase/sql/audit_log.sql if
 * you want persistent logging.
 */
export async function auditLog(entry: AuditEntry): Promise<void> {
  try {
    const { error } = await supabase.from("audit_log").insert({
      event: entry.event,
      actor_id: entry.actor_id ?? null,
      actor_name: entry.actor_name ?? null,
      entity_type: entry.entity_type ?? null,
      entity_id: entry.entity_id ?? null,
      before: entry.before ?? null,
      after: entry.after ?? null,
    });
    if (error) {
      console.warn("[audit_log] falhou (ok em dev):", error.message);
    }
  } catch (e) {
    console.warn("[audit_log] exceção:", e);
  }
}
