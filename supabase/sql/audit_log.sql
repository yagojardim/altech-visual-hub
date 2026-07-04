-- Altech Project — audit_log
-- Rodar UMA vez no SQL Editor (projeto bjoudcfydahanbcirqcl).
create table if not exists public.audit_log (
  id uuid primary key default gen_random_uuid(),
  event text not null,
  actor_id text,
  actor_name text,
  entity_type text,
  entity_id text,
  before jsonb,
  after jsonb,
  created_at timestamptz not null default now()
);

create index if not exists audit_log_event_idx on public.audit_log (event);
create index if not exists audit_log_entity_idx on public.audit_log (entity_type, entity_id);
create index if not exists audit_log_created_idx on public.audit_log (created_at desc);

alter table public.audit_log enable row level security;

drop policy if exists audit_log_all on public.audit_log;
create policy audit_log_all on public.audit_log
  for all to anon, authenticated using (true) with check (true);

grant select, insert on public.audit_log to anon, authenticated;
grant all on public.audit_log to service_role;
