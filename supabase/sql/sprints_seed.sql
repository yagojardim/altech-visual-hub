-- Altech Project: seed de sprints (Ativa + Concluída) por projeto
-- Depende de sprints.sql (a tabela public.sprints já existe).
-- Executa idempotentemente no SQL Editor do Supabase.

insert into public.sprints (project_id, tenant_id, nome, meta, data_inicio, data_fim, status)
select p.id, p.tenant_id, 'Sprint atual', 'Meta em execução no ciclo corrente.',
       (current_date - interval '3 days')::date,
       (current_date + interval '11 days')::date,
       'Ativa'
from public.projects p
where not exists (
  select 1 from public.sprints s where s.project_id = p.id and s.status = 'Ativa'
);

insert into public.sprints (project_id, tenant_id, nome, meta, data_inicio, data_fim, status)
select p.id, p.tenant_id, 'Sprint anterior', 'Ciclo concluído do projeto.',
       (current_date - interval '17 days')::date,
       (current_date - interval '4 days')::date,
       'Concluída'
from public.projects p
where not exists (
  select 1 from public.sprints s where s.project_id = p.id and s.status = 'Concluída'
);
