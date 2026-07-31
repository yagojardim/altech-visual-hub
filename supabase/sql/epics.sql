-- Altech Project: epics
-- Rodar no SQL Editor do Supabase (projeto bjoudcfydahanbcirqcl).
-- Depende de 00_full_schema.sql (public.projects, public.team_members, public.work_items).
-- Obs.: public.projects.id é TEXT (slug) neste schema.

create table if not exists public.epics (
  id uuid primary key default gen_random_uuid(),
  project_id text not null references public.projects(id) on delete cascade,
  key text not null,
  label text not null,
  color text not null default 'inprogress',
  description text,
  quarter text,
  owner_id uuid references public.team_members(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (project_id, key)
);

create index if not exists epics_project_idx on public.epics (project_id);

-- Vínculo de work items ao épico
alter table public.work_items
  add column if not exists epic_id uuid references public.epics(id) on delete set null;

-- Story points usados no resumo do épico
alter table public.work_items
  add column if not exists story_points integer;

create index if not exists work_items_epic_idx on public.work_items (epic_id);

-- RLS permissiva (Inspection Build, sem autenticação) — mesmo padrão das
-- demais tabelas do projeto.
alter table public.epics enable row level security;

drop policy if exists "epics anon read"   on public.epics;
drop policy if exists "epics anon write"  on public.epics;
drop policy if exists "epics anon update" on public.epics;
drop policy if exists "epics anon delete" on public.epics;

create policy "epics anon read"   on public.epics for select using (true);
create policy "epics anon write"  on public.epics for insert with check (true);
create policy "epics anon update" on public.epics for update using (true) with check (true);
create policy "epics anon delete" on public.epics for delete using (true);

grant select, insert, update, delete on public.epics to anon, authenticated;
grant all on public.epics to service_role;
