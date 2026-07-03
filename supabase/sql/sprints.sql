-- Altech Project: sprints table + sprint_id em work_items
-- Rodar no SQL Editor do projeto bjoudcfydahanbcirqcl.
-- Depende de projects.sql e work_items.sql.

create table if not exists public.sprints (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  tenant_id uuid,
  nome text not null,
  meta text,
  data_inicio date,
  data_fim date,
  status text not null default 'Planejada',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists sprints_project_idx on public.sprints (project_id);
create index if not exists sprints_tenant_idx  on public.sprints (tenant_id);

drop trigger if exists trg_sprints_updated_at on public.sprints;
create trigger trg_sprints_updated_at
  before update on public.sprints
  for each row execute function public.set_updated_at();

alter table public.sprints enable row level security;

drop policy if exists "sprints anon read"   on public.sprints;
drop policy if exists "sprints anon write"  on public.sprints;
drop policy if exists "sprints anon update" on public.sprints;
drop policy if exists "sprints anon delete" on public.sprints;

create policy "sprints anon read"   on public.sprints for select using (true);
create policy "sprints anon write"  on public.sprints for insert with check (true);
create policy "sprints anon update" on public.sprints for update using (true) with check (true);
create policy "sprints anon delete" on public.sprints for delete using (true);

grant select, insert, update, delete on public.sprints to anon, authenticated;
grant all on public.sprints to service_role;

-- Relação: work_items.sprint_id
alter table public.work_items
  add column if not exists sprint_id uuid references public.sprints(id) on delete set null;

create index if not exists work_items_sprint_idx on public.work_items (sprint_id);
