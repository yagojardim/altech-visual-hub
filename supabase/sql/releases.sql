-- Altech Project: releases
-- Rodar no SQL Editor do Supabase (projeto bjoudcfydahanbcirqcl).
-- Depende de 00_full_schema.sql (public.projects, public.work_items).
-- Obs.: public.projects.id é TEXT (slug) neste schema.

create table if not exists public.releases (
  id uuid primary key default gen_random_uuid(),
  project_id text not null references public.projects(id) on delete cascade,
  version text not null,
  name text,
  release_date date,
  state text not null default 'planned'
    check (state in ('planned', 'in-progress', 'released')),
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists releases_project_idx on public.releases (project_id);
create index if not exists releases_date_idx on public.releases (release_date desc);

-- Vínculo de work items à release
alter table public.work_items
  add column if not exists release_id uuid references public.releases(id) on delete set null;

create index if not exists work_items_release_idx on public.work_items (release_id);

-- RLS permissiva (Inspection Build, sem autenticação) — mesmo padrão das
-- demais tabelas do projeto.
alter table public.releases enable row level security;

drop policy if exists "releases anon read"   on public.releases;
drop policy if exists "releases anon write"  on public.releases;
drop policy if exists "releases anon update" on public.releases;
drop policy if exists "releases anon delete" on public.releases;

create policy "releases anon read"   on public.releases for select using (true);
create policy "releases anon write"  on public.releases for insert with check (true);
create policy "releases anon update" on public.releases for update using (true) with check (true);
create policy "releases anon delete" on public.releases for delete using (true);

grant select, insert, update, delete on public.releases to anon, authenticated;
grant all on public.releases to service_role;
