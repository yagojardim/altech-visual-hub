-- Altech Project: comments on work_items
-- Run in the Supabase SQL Editor (project bjoudcfydahanbcirqcl).
-- Depends on work_items.sql.

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  work_item_id uuid not null references public.work_items(id) on delete cascade,
  author text,
  body text not null,
  created_at timestamptz not null default now()
);

create index if not exists comments_work_item_idx on public.comments (work_item_id, created_at desc);

alter table public.comments enable row level security;

drop policy if exists "comments anon read"   on public.comments;
drop policy if exists "comments anon write"  on public.comments;
drop policy if exists "comments anon update" on public.comments;
drop policy if exists "comments anon delete" on public.comments;

create policy "comments anon read"   on public.comments for select using (true);
create policy "comments anon write"  on public.comments for insert with check (true);
create policy "comments anon update" on public.comments for update using (true) with check (true);
create policy "comments anon delete" on public.comments for delete using (true);

grant select, insert, update, delete on public.comments to anon, authenticated;
grant all on public.comments to service_role;
