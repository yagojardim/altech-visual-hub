-- Altech Project: projects table
-- Run this in the Supabase SQL Editor for project bjoudcfydahanbcirqcl.

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  nome text not null,
  status text not null default 'Planejamento',
  responsavel text,
  cliente text,
  descricao text,
  data_inicio date,
  data_fim date,
  tenant_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists projects_tenant_idx on public.projects (tenant_id);
create index if not exists projects_status_idx on public.projects (status);

-- Inspection Build: no auth wired, allow anon full access.
alter table public.projects enable row level security;

drop policy if exists "projects anon read"  on public.projects;
drop policy if exists "projects anon write" on public.projects;
drop policy if exists "projects anon update" on public.projects;
drop policy if exists "projects anon delete" on public.projects;

create policy "projects anon read"   on public.projects for select using (true);
create policy "projects anon write"  on public.projects for insert with check (true);
create policy "projects anon update" on public.projects for update using (true) with check (true);
create policy "projects anon delete" on public.projects for delete using (true);

grant select, insert, update, delete on public.projects to anon, authenticated;
