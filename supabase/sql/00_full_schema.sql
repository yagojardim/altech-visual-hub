-- Altech Project — schema completo (idempotente).
-- Rodar UMA vez no SQL Editor do Supabase (projeto bjoudcfydahanbcirqcl).

-- =========================================================
-- projects
-- =========================================================
create table if not exists public.projects (
  id text primary key,
  name text not null,
  slug text unique,
  status text default 'planejamento' check (status in ('planejamento','em_progresso','concluido','arquivado')),
  description text,
  team text,
  owner text,
  start_date date,
  end_date date,
  created_at timestamptz default now()
);

-- =========================================================
-- team_members
-- =========================================================
create table if not exists public.team_members (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text,
  role text check (role in ('PMO','PM','PO','Tech Lead','Dev','QA','Stakeholder')),
  avatar_color text,
  created_at timestamptz default now()
);

-- =========================================================
-- project_members
-- =========================================================
create table if not exists public.project_members (
  project_id text references public.projects(id) on delete cascade,
  member_id uuid references public.team_members(id) on delete cascade,
  primary key (project_id, member_id)
);

-- =========================================================
-- boards
-- =========================================================
create table if not exists public.boards (
  id uuid primary key default gen_random_uuid(),
  project_id text references public.projects(id) on delete cascade,
  name text not null,
  description text,
  created_at timestamptz default now()
);

-- =========================================================
-- board_columns
-- =========================================================
create table if not exists public.board_columns (
  id uuid primary key default gen_random_uuid(),
  board_id uuid references public.boards(id) on delete cascade,
  name text,
  position int
);

-- =========================================================
-- work_items
-- =========================================================
create table if not exists public.work_items (
  id uuid primary key default gen_random_uuid(),
  board_id uuid references public.boards(id) on delete set null,
  column_id uuid references public.board_columns(id) on delete set null,
  project_id text references public.projects(id) on delete cascade,
  title text not null,
  description text,
  type text default 'task' check (type in ('story','task','bug','risk')),
  priority text default 'media' check (priority in ('baixa','media','alta','critica')),
  assignee_id uuid references public.team_members(id) on delete set null,
  status text,
  position int,
  created_at timestamptz default now()
);

-- =========================================================
-- sprints
-- =========================================================
create table if not exists public.sprints (
  id uuid primary key default gen_random_uuid(),
  project_id text references public.projects(id) on delete cascade,
  name text not null,
  goal text,
  status text default 'planejada' check (status in ('planejada','ativa','concluida')),
  start_date date,
  end_date date,
  created_at timestamptz default now()
);

-- =========================================================
-- sprint_items
-- =========================================================
create table if not exists public.sprint_items (
  sprint_id uuid references public.sprints(id) on delete cascade,
  work_item_id uuid references public.work_items(id) on delete cascade,
  primary key (sprint_id, work_item_id)
);

-- =========================================================
-- RLS + policies permissivas (Inspection Build sem auth)
-- =========================================================
do $$
declare
  t text;
  tables text[] := array[
    'projects','team_members','project_members',
    'boards','board_columns','work_items',
    'sprints','sprint_items'
  ];
begin
  foreach t in array tables loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists %I on public.%I', t || '_all', t);
    execute format(
      'create policy %I on public.%I for all to anon, authenticated using (true) with check (true)',
      t || '_all', t
    );
    execute format('grant select, insert, update, delete on public.%I to anon, authenticated', t);
    execute format('grant all on public.%I to service_role', t);
  end loop;
end $$;
