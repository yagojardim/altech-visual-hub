// Utilities to normalize Supabase / PostgREST errors into safe UI strings.
// Prevents "[object Object]" in ErrorState and lets fetchers treat
// "missing relation" as an empty state instead of a hard error.

type MaybeSupabaseError = {
  message?: unknown;
  code?: unknown;
  details?: unknown;
  hint?: unknown;
  error_description?: unknown;
  status?: unknown;
} | null | undefined;

export function formatSupabaseError(err: unknown, fallback = "Erro ao carregar dados."): string {
  if (!err) return fallback;
  if (typeof err === "string") return err;
  if (err instanceof Error && err.message) return err.message;

  const e = err as MaybeSupabaseError;
  const msg =
    (typeof e?.message === "string" && e.message) ||
    (typeof e?.error_description === "string" && e.error_description) ||
    (typeof e?.details === "string" && e.details) ||
    (typeof e?.hint === "string" && e.hint) ||
    "";
  if (msg) return msg;

  try {
    return JSON.stringify(err);
  } catch {
    return fallback;
  }
}

// PGRST205 = "Could not find the table ... in the schema cache"
// PGRST106 = "The schema must be one of the following ..."
// 42P01    = Postgres "undefined_table"
const MISSING_RELATION_CODES = new Set(["PGRST205", "PGRST106", "42P01"]);

export function isMissingRelation(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const e = err as MaybeSupabaseError;
  const code = typeof e?.code === "string" ? e.code : "";
  if (MISSING_RELATION_CODES.has(code)) return true;
  const message = typeof e?.message === "string" ? e.message : "";
  return /schema cache|does not exist|undefined_table/i.test(message);
}

// Log helper that shows the actual error shape, not "[object Object]".
export function logSupabaseError(scope: string, err: unknown) {
  // eslint-disable-next-line no-console
  console.warn(`[${scope}]`, formatSupabaseError(err), err);
}
