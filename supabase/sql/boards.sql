-- Altech Project: boards table
-- Run this in the Supabase SQL Editor for project bjoudcfydahanbcirqcl.

create table if not exists public.boards (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id) on delete cascade,
  name text not null,
  description text,
  created_at timestamptz not null default now()
);

create index if not exists boards_project_idx on public.boards (project_id);

-- Inspection Build: no auth wired, allow anon full access.
alter table public.boards enable row level security;

drop policy if exists "boards anon read"   on public.boards;
drop policy if exists "boards anon write"  on public.boards;
drop policy if exists "boards anon update" on public.boards;
drop policy if exists "boards anon delete" on public.boards;

create policy "boards anon read"   on public.boards for select using (true);
create policy "boards anon write"  on public.boards for insert with check (true);
create policy "boards anon update" on public.boards for update using (true) with check (true);
create policy "boards anon delete" on public.boards for delete using (true);

grant select, insert, update, delete on public.boards to anon, authenticated;

-- Seed: 1 board por projeto existente (idempotente).
insert into public.boards (project_id, name, description)
select p.id, 'Board principal', 'Board padrão do projeto no Altech Project.'
from public.projects p
where not exists (
  select 1 from public.boards b where b.project_id = p.id
);
