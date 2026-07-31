import { supabase } from "./supabase";
import { logSupabaseError } from "./supabase-errors";

export interface BoardRow {
  id: string;
  project_id: string | null;
  name: string;
  description: string | null;
  created_at?: string;
}

export async function listBoards(): Promise<BoardRow[]> {
  const { data, error } = await supabase
    .from("boards")
    .select("id, project_id, name, description, created_at")
    .order("created_at", { ascending: false });
  if (error) {
    logSupabaseError("boards-api:listBoards", error);
    throw error;
  }
  return (data ?? []) as BoardRow[];
}

export interface BoardCounts {
  columns: number;
  items: number;
}

/** Contagem de colunas e itens por board (agregado em memória). */
export async function listBoardCounts(): Promise<Record<string, BoardCounts>> {
  const [cols, items] = await Promise.all([
    supabase.from("board_columns").select("id, board_id"),
    supabase.from("work_items").select("id, board_id"),
  ]);

  if (cols.error) logSupabaseError("boards-api:listBoardCounts:columns", cols.error);
  if (items.error) logSupabaseError("boards-api:listBoardCounts:items", items.error);

  const map: Record<string, BoardCounts> = {};
  const bump = (boardId: string | null, key: keyof BoardCounts) => {
    if (!boardId) return;
    map[boardId] ??= { columns: 0, items: 0 };
    map[boardId][key] += 1;
  };
  for (const c of (cols.data ?? []) as { board_id: string | null }[]) bump(c.board_id, "columns");
  for (const i of (items.data ?? []) as { board_id: string | null }[]) bump(i.board_id, "items");
  return map;
}

export async function getBoard(id: string): Promise<BoardRow | null> {
  const { data, error } = await supabase
    .from("boards")
    .select("id, project_id, name, description, created_at")
    .eq("id", id)
    .maybeSingle();
  if (error) {
    logSupabaseError("boards-api:getBoard", error);
    throw error;
  }
  return (data as BoardRow | null) ?? null;
}
