-- Altech Project: Timeline / Gantt
-- Rodar no SQL Editor do Supabase (projeto bjoudcfydahanbcirqcl).
-- Depende de 00_full_schema.sql, 03_work_item_behavior.sql (due_date, progress,
-- work_item_relations), epics.sql (epic_id) e sprints.sql (sprint_id).

-- Data de início real do work item (par de due_date).
alter table public.work_items add column if not exists start_date date;

create index if not exists work_items_start_date_idx on public.work_items (start_date);
create index if not exists work_items_due_date_idx on public.work_items (due_date);
