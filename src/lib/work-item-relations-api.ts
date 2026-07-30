import { supabase } from "./supabase";
import { isMissingRelation, logSupabaseError } from "./supabase-errors";

/**
 * Relações entre work items (public.work_item_relations) — mesmo padrão dos
 * demais *-api.ts: leitura direta via @supabase/supabase-js, colunas reais (EN),
 * degrada para vazio quando a tabela ainda não foi migrada.
 *
 * Colunas: id, source_id, target_id, relation_type, created_at.
 * relation_type ∈ blocks | relates_to | duplicates | caused_by | mitigates.
 * Em 'blocks', source_id bloqueia target_id.
 */

export const RELATION_TYPES = [
  "blocks",
  "relates_to",
  "duplicates",
  "caused_by",
  "mitigates",
] as const;
export type RelationType = (typeof RELATION_TYPES)[number];

export interface WorkItemRelationRow {
  id: string;
  source_id: string;
  target_id: string;
  relation_type: string;
  created_at?: string;
}

export interface WorkItemRelationInput {
  source_id: string;
  target_id: string;
  relation_type?: RelationType;
}

const SELECT = "id, source_id, target_id, relation_type, created_at";

/** Relações cujo source ou target esteja no conjunto de ids informado. */
export async function listRelationsForItems(
  itemIds: string[],
  relationType?: RelationType,
): Promise<WorkItemRelationRow[]> {
  if (itemIds.length === 0) return [];
  const list = `(${itemIds.join(",")})`;
  let query = supabase
    .from("work_item_relations")
    .select(SELECT)
    .or(`source_id.in.${list},target_id.in.${list}`);
  if (relationType) query = query.eq("relation_type", relationType);

  const { data, error } = await query;
  if (error) {
    if (isMissingRelation(error)) {
      logSupabaseError("work-item-relations-api:listRelationsForItems", error);
      return [];
    }
    throw new Error(error.message || "Erro ao listar relações de work items.");
  }
  return (data ?? []) as WorkItemRelationRow[];
}

export async function listRelationsBySource(
  sourceId: string,
): Promise<WorkItemRelationRow[]> {
  const { data, error } = await supabase
    .from("work_item_relations")
    .select(SELECT)
    .eq("source_id", sourceId);
  if (error) {
    if (isMissingRelation(error)) {
      logSupabaseError("work-item-relations-api:listRelationsBySource", error);
      return [];
    }
    throw new Error(error.message || "Erro ao listar relações do work item.");
  }
  return (data ?? []) as WorkItemRelationRow[];
}

export async function createRelation(
  input: WorkItemRelationInput,
): Promise<WorkItemRelationRow> {
  const { data, error } = await supabase
    .from("work_item_relations")
    .insert({
      source_id: input.source_id,
      target_id: input.target_id,
      relation_type: input.relation_type ?? "blocks",
    })
    .select(SELECT)
    .single();
  if (error) throw new Error(error.message || "Erro ao criar relação.");
  return data as WorkItemRelationRow;
}

export async function deleteRelation(id: string): Promise<void> {
  const { error } = await supabase.from("work_item_relations").delete().eq("id", id);
  if (error) throw new Error(error.message || "Erro ao excluir relação.");
}
