-- Altech Project: work_items table
-- Run in the Supabase SQL Editor (project bjoudcfydahanbcirqcl).
-- Depends on projects.sql (public.projects must exist).

create table if not exists public.work_items (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  tenant_id uuid,
  item_key text,
  titulo text not null,
  tipo text not null default 'Tarefa',
  status text not null default 'A Fazer',
  responsavel text,
  descricao text,
  prioridade text not null default 'Média',
  ordem integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists work_items_project_idx on public.work_items (project_id);
create index if not exists work_items_project_status_idx on public.work_items (project_id, status);
create index if not exists work_items_project_ordem_idx on public.work_items (project_id, ordem);
create index if not exists work_items_tenant_idx on public.work_items (tenant_id);

-- Keep updated_at fresh
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_work_items_updated_at on public.work_items;
create trigger trg_work_items_updated_at
  before update on public.work_items
  for each row execute function public.set_updated_at();

-- RLS por tenant.
-- Como a Inspection Build roda sem autenticação, as políticas são permissivas
-- e o escopo por tenant é aplicado no cliente (todas as queries filtram
-- por tenant_id). Ao habilitar login, troque por policies que leiam
-- auth.jwt() ->> 'tenant_id' e comparem com tenant_id.
alter table public.work_items enable row level security;

drop policy if exists "work_items anon read"   on public.work_items;
drop policy if exists "work_items anon write"  on public.work_items;
drop policy if exists "work_items anon update" on public.work_items;
drop policy if exists "work_items anon delete" on public.work_items;

create policy "work_items anon read"   on public.work_items for select using (true);
create policy "work_items anon write"  on public.work_items for insert with check (true);
create policy "work_items anon update" on public.work_items for update using (true) with check (true);
create policy "work_items anon delete" on public.work_items for delete using (true);

grant select, insert, update, delete on public.work_items to anon, authenticated;
grant all on public.work_items to service_role;

-- Seed inicial (idempotente): 3 itens por projeto seed
insert into public.work_items (project_id, tenant_id, item_key, titulo, tipo, status, responsavel, ordem)
select p.id, p.tenant_id, seed.item_key, seed.titulo, seed.tipo, seed.status, seed.responsavel, seed.ordem
from public.projects p
join (values
  ('CORE-1',  'altech-core',   'Definir estrutura visual do MVP',       'História', 'A Fazer',       'Ana Silva',    1),
  ('CORE-2',  'altech-core',   'Configurar Design System base',         'Tarefa',   'Em Progresso',  'Ana Silva',    2),
  ('CORE-3',  'altech-core',   'Revisar navegação principal',           'Tarefa',   'Em Revisão',    'Ana Silva',    3),
  ('LABS-1',  'altech-labs',   'Prototipar capacidade de automação',    'Épico',    'A Fazer',       'Bruno Costa',  1),
  ('LABS-2',  'altech-labs',   'Explorar integração IA',                'História', 'A Fazer',       'Bruno Costa',  2),
  ('LABS-3',  'altech-labs',   'Documentar experimentos',               'Tarefa',   'Em Progresso',  'Bruno Costa',  3),
  ('LAUNCH-1','altech-launch', 'Preparar landing de lançamento',        'História', 'Em Progresso',  'Camila Rocha', 1),
  ('LAUNCH-2','altech-launch', 'Configurar analytics de release',       'Tarefa',   'A Fazer',       'Camila Rocha', 2),
  ('LAUNCH-3','altech-launch', 'Ajustar copy do onboarding',            'Tarefa',   'Concluído',     'Camila Rocha', 3)
) as seed(item_key, slug, titulo, tipo, status, responsavel, ordem)
  on seed.slug = p.slug
where not exists (
  select 1 from public.work_items wi where wi.item_key = seed.item_key
);
