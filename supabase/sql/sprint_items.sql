-- Altech Project: sprint_items (junção sprints × work_items)
-- Rode no SQL Editor do Supabase.

create table if not exists public.sprint_items (
  sprint_id uuid not null references public.sprints(id) on delete cascade,
  work_item_id uuid not null references public.work_items(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (sprint_id, work_item_id)
);

create index if not exists sprint_items_sprint_idx on public.sprint_items (sprint_id);
create index if not exists sprint_items_work_item_idx on public.sprint_items (work_item_id);

alter table public.sprint_items enable row level security;

drop policy if exists sprint_items_all on public.sprint_items;
create policy sprint_items_all on public.sprint_items
  for all using (true) with check (true);

grant select, insert, update, delete on public.sprint_items to anon, authenticated;

-- Seed: vincula até 5 work_items de cada projeto à sprint Ativa desse projeto.
insert into public.sprint_items (sprint_id, work_item_id)
select s.id, wi.id
from public.sprints s
join public.work_items wi on wi.project_id = s.project_id
where s.status = 'Ativa'
  and wi.id in (
    select id from public.work_items w
    where w.project_id = s.project_id
    order by w.ordem, w.created_at
    limit 5
  )
on conflict (sprint_id, work_item_id) do nothing;
