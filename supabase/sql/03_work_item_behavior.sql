-- Altech Project — Work Item behavior (types, hierarchy, relations, extras)
-- Rodar UMA vez no SQL Editor do Supabase (projeto bjoudcfydahanbcirqcl).
-- Depende de 00_full_schema.sql, comments.sql e audit_log.sql.

-- =========================================================
-- work_items: extended type set + campos condicionais + parent_id
-- =========================================================
alter table public.work_items drop constraint if exists work_items_type_check;
alter table public.work_items
  add constraint work_items_type_check
  check (type in ('epic','feature','story','task','subtask','bug','risk'));

alter table public.work_items
  add column if not exists parent_id uuid references public.work_items(id) on delete set null;
alter table public.work_items add column if not exists acceptance_criteria text;
alter table public.work_items add column if not exists due_date date;
alter table public.work_items add column if not exists progress int
  check (progress is null or (progress >= 0 and progress <= 100));
alter table public.work_items add column if not exists severity text;
alter table public.work_items add column if not exists probability text;
alter table public.work_items add column if not exists impact text;
alter table public.work_items add column if not exists mitigation_plan text;

create index if not exists work_items_parent_idx on public.work_items(parent_id);

-- =========================================================
-- work_item_relations
-- =========================================================
create table if not exists public.work_item_relations (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references public.work_items(id) on delete cascade,
  target_id uuid not null references public.work_items(id) on delete cascade,
  relation_type text not null
    check (relation_type in ('blocks','relates_to','duplicates','caused_by','mitigates')),
  created_at timestamptz not null default now(),
  unique (source_id, target_id, relation_type),
  check (source_id <> target_id)
);

create index if not exists work_item_relations_source_idx on public.work_item_relations(source_id);
create index if not exists work_item_relations_target_idx on public.work_item_relations(target_id);

alter table public.work_item_relations enable row level security;
drop policy if exists work_item_relations_all on public.work_item_relations;
create policy work_item_relations_all on public.work_item_relations
  for all to anon, authenticated using (true) with check (true);
grant select, insert, update, delete on public.work_item_relations to anon, authenticated;
grant all on public.work_item_relations to service_role;

-- =========================================================
-- comments: identificar autor (para editar/excluir próprios)
-- =========================================================
alter table public.comments add column if not exists author_id text;
