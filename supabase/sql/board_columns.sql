-- Altech Project: board_columns + work_items Kanban fields
-- Run in Supabase SQL Editor (project bjoudcfydahanbcirqcl).
-- Depends on boards.sql and work_items.sql.

-- 1) board_columns
create table if not exists public.board_columns (
  id uuid primary key default gen_random_uuid(),
  board_id uuid references public.boards(id) on delete cascade,
  name text not null,
  position int not null default 0
);

create index if not exists board_columns_board_idx on public.board_columns (board_id);

alter table public.board_columns enable row level security;

drop policy if exists "board_columns anon read"   on public.board_columns;
drop policy if exists "board_columns anon write"  on public.board_columns;
drop policy if exists "board_columns anon update" on public.board_columns;
drop policy if exists "board_columns anon delete" on public.board_columns;

create policy "board_columns anon read"   on public.board_columns for select using (true);
create policy "board_columns anon write"  on public.board_columns for insert with check (true);
create policy "board_columns anon update" on public.board_columns for update using (true) with check (true);
create policy "board_columns anon delete" on public.board_columns for delete using (true);

grant select, insert, update, delete on public.board_columns to anon, authenticated;

-- Seed 4 colunas por board (idempotente)
insert into public.board_columns (board_id, name, position)
select b.id, c.name, c.position
from public.boards b
cross join (values
  ('Backlog', 1),
  ('Em progresso', 2),
  ('Revisão', 3),
  ('Concluído', 4)
) as c(name, position)
where not exists (
  select 1 from public.board_columns bc
  where bc.board_id = b.id and bc.name = c.name
);

-- 2) work_items: adicionar campos de Kanban (mantém colunas existentes)
alter table public.work_items
  add column if not exists board_id uuid,
  add column if not exists column_id uuid,
  add column if not exists position int not null default 0;

create index if not exists work_items_board_idx  on public.work_items (board_id);
create index if not exists work_items_column_idx on public.work_items (column_id);

-- Backfill: ligar work_items existentes ao board do projeto e à coluna equivalente ao status
update public.work_items wi
set board_id = b.id
from public.boards b
where wi.board_id is null and b.project_id = wi.project_id;

update public.work_items wi
set column_id = bc.id
from public.board_columns bc
where wi.column_id is null
  and bc.board_id = wi.board_id
  and bc.name = case wi.status
    when 'A Fazer' then 'Backlog'
    when 'Em Progresso' then 'Em progresso'
    when 'Em Revisão' then 'Revisão'
    when 'Concluído' then 'Concluído'
    else 'Backlog'
  end;

-- Fallback: qualquer work_item ainda sem column_id cai no Backlog do seu board
update public.work_items wi
set column_id = bc.id
from public.board_columns bc
where wi.column_id is null
  and bc.board_id = wi.board_id
  and bc.name = 'Backlog';
