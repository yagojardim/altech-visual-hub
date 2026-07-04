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
