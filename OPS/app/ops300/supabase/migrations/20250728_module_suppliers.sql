-- ============================================
-- MÓDULO FORNECEDORES & PROCUREMENT — 300
-- Aplicar no Supabase Studio → SQL Editor
-- ============================================

-- 1. TABELA: suppliers
-- Fornecedores da plataforma

create table if not exists public.suppliers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  website text,
  email text,
  phone text,
  address text,
  city text,
  country text,
  vat_number text,
  contact_name text,
  contact_email text,
  contact_phone text,
  services jsonb default '[]'::jsonb, -- ['purchase','installation','configuration','maintenance']
  lead_time_days integer,
  notes text,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.suppliers enable row level security;
create policy "Allow all" on public.suppliers for all using (true) with check (true);
create index idx_suppliers_name on public.suppliers(name);
create index idx_suppliers_services on public.suppliers using gin(services);

-- 2. TABELA: proposal_item_suppliers
-- Ligação N:M entre items de proposta e fornecedores

create table if not exists public.proposal_item_suppliers (
  id uuid primary key default gen_random_uuid(),
  proposal_experience_id uuid not null references public.proposal_experiences(id) on delete cascade,
  proposal_id uuid references public.proposals(id) on delete cascade,
  supplier_id uuid not null references public.suppliers(id) on delete restrict,
  service_type text not null check (service_type in ('purchase','installation','configuration','maintenance')),
  unit_cost numeric(12,2),
  quantity integer default 1,
  total_cost numeric(12,2),
  lead_time_days integer,
  status text default 'pending' check (status in ('pending','quoted','ordered','delivered','cancelled')),
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.proposal_item_suppliers enable row level security;
create policy "Allow all" on public.proposal_item_suppliers for all using (true) with check (true);
create index idx_pis_experience on public.proposal_item_suppliers(proposal_experience_id);
create index idx_pis_supplier on public.proposal_item_suppliers(supplier_id);

-- 3. TABELA: procurement_tasks
-- Tarefas automáticas de procurement

create table if not exists public.procurement_tasks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id) on delete cascade,
  proposal_id uuid references public.proposals(id) on delete cascade,
  proposal_experience_id uuid references public.proposal_experiences(id) on delete cascade,
  supplier_id uuid references public.suppliers(id) on delete set null,
  item_supplier_id uuid references public.proposal_item_suppliers(id) on delete cascade,
  title text not null,
  description text,
  task_type text not null check (task_type in ('purchase','installation','configuration','delivery_tracking','follow_up')),
  status text default 'todo' check (status in ('todo','in_progress','in_review','done')),
  priority text default 'medium' check (priority in ('low','medium','high','critical')),
  due_date date,
  completed_at timestamptz,
  assigned_to uuid references auth.users(id) on delete set null,
  last_contact_at timestamptz,
  last_contact_method text check (last_contact_method in ('email','phone','chat','in_person')),
  last_contact_summary text,
  next_follow_up date,
  supplier_promised_date date,
  actual_delivery_date date,
  linked_task_id uuid references public.tasks(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.procurement_tasks enable row level security;
create policy "Allow all" on public.procurement_tasks for all using (true) with check (true);
create index idx_proc_tasks_project on public.procurement_tasks(project_id);
create index idx_proc_tasks_proposal on public.procurement_tasks(proposal_id);
create index idx_proc_tasks_supplier on public.procurement_tasks(supplier_id);
create index idx_proc_tasks_status on public.procurement_tasks(status);
create index idx_proc_tasks_due on public.procurement_tasks(due_date);

-- 4. TABELA: supplier_messages
-- Chat interno com fornecedores (mensagens da plataforma)

create table if not exists public.supplier_messages (
  id uuid primary key default gen_random_uuid(),
  supplier_id uuid not null references public.suppliers(id) on delete cascade,
  proposal_id uuid references public.proposals(id) on delete cascade,
  proposal_experience_id uuid references public.proposal_experiences(id) on delete cascade,
  procurement_task_id uuid references public.procurement_tasks(id) on delete set null,
  -- autor da mensagem
  sender_type text not null check (sender_type in ('user','supplier','system')),
  sender_user_id uuid references auth.users(id) on delete set null,
  sender_name text,
  -- conteúdo
  content text not null,
  attachments jsonb default '[]'::jsonb, -- [{name, url, size}]
  -- metadados
  is_internal_note boolean default false, -- só visível para equipa interna
  message_type text default 'message' check (message_type in ('message','quote','order','delivery_update','reminder','system')),
  read_at timestamptz,
  created_at timestamptz default now()
);

alter table public.supplier_messages enable row level security;
create policy "Allow all" on public.supplier_messages for all using (true) with check (true);
create index idx_sm_supplier on public.supplier_messages(supplier_id);
create index idx_sm_proposal on public.supplier_messages(proposal_id);
create index idx_sm_task on public.supplier_messages(procurement_task_id);
create index idx_sm_created on public.supplier_messages(created_at desc);

-- 5. FUNÇÃO: auto-generate procurement tasks on item_supplier insert
-- Gera tarefas automáticas quando se adiciona um fornecedor a um item

create or replace function public.handle_new_item_supplier()
returns trigger as $$
declare
  v_project_id uuid;
  v_exp_name text;
  v_supplier_name text;
  v_supplier_lead_time integer;
  v_due_date date;
begin
  -- buscar dados relacionados
  select pe.name, p.project_id
  into v_exp_name, v_project_id
  from public.proposal_experiences pe
  join public.proposals p on p.id = pe.proposal_id
  where pe.id = new.proposal_experience_id;

  select name, lead_time_days
  into v_supplier_name, v_supplier_lead_time
  from public.suppliers where id = new.supplier_id;

  -- calcular due_date baseado no lead_time
  v_due_date := current_date + coalesce(new.lead_time_days, v_supplier_lead_time, 14);

  -- Tarefa 1: Contactar fornecedor (sempre)
  insert into public.procurement_tasks (
    project_id, proposal_id, proposal_experience_id, supplier_id, item_supplier_id,
    title, description, task_type, status, priority, due_date
  ) values (
    v_project_id, new.proposal_id, new.proposal_experience_id, new.supplier_id, new.id,
    'Contactar ' || v_supplier_name || ' · ' || v_exp_name,
    'Iniciar contacto com ' || v_supplier_name || ' para ' || new.service_type || ' do item ' || v_exp_name,
    'follow_up', 'todo', 'high', current_date + 2
  );

  -- Tarefa 2: Acompanhar entrega (se tiver lead_time)
  if new.lead_time_days is not null or v_supplier_lead_time is not null then
    insert into public.procurement_tasks (
      project_id, proposal_id, proposal_experience_id, supplier_id, item_supplier_id,
      title, description, task_type, status, priority, due_date, supplier_promised_date
    ) values (
      v_project_id, new.proposal_id, new.proposal_experience_id, new.supplier_id, new.id,
      'Entrega · ' || v_exp_name || ' · ' || v_supplier_name,
      'Confirmar entrega de ' || v_exp_name || ' por ' || v_supplier_name || '. Prazo: ' || coalesce(new.lead_time_days, v_supplier_lead_time) || ' dias.',
      'delivery_tracking', 'todo', 'medium', v_due_date, v_due_date
    );
  end if;

  -- Mensagem de sistema
  insert into public.supplier_messages (
    supplier_id, proposal_id, proposal_experience_id,
    sender_type, sender_name, content, message_type
  ) values (
    new.supplier_id, new.proposal_id, new.proposal_experience_id,
    'system', 'Sistema 300',
    'Novo fornecedor associado: ' || v_supplier_name || ' para ' || new.service_type || ' do item ' || v_exp_name || '. Prazo estimado: ' || coalesce(new.lead_time_days, v_supplier_lead_time, 14) || ' dias.',
    'system'
  );

  return new;
end;
$$ language plpgsql security definer;

-- Trigger: execute after insert on proposal_item_suppliers
-- (para ativar, descomentar a linha abaixo após confirmar que a função está correta)
-- create trigger trg_auto_procurement_tasks
--   after insert on public.proposal_item_suppliers
--   for each row execute function public.handle_new_item_supplier();

-- 6. SEED: Fornecedores reais
insert into public.suppliers (name, website, email, country, services, lead_time_days, notes)
values
  ('Prado', 'https://prado.eu', 'info@prado.eu', 'Bélgica',
   '["purchase","installation"]'::jsonb, 14,
   'Iluminação + ventilação + sensores de movimento. Produtos: light+ventilation, light+motion.'),
  ('Basalte', 'https://www.basalte.be', 'info@basalte.be', 'Bélgica',
   '["purchase","installation","configuration"]'::jsonb, 21,
   'Áudio e domótica de luxo. Produtos: Aalto F5 speakers, KNX.'),
  ('Lutron', 'https://www.lutron.com', 'info@lutron.com', 'EUA',
   '["purchase","installation","configuration"]'::jsonb, 30,
   'Sistemas de controlo de iluminação e estores. DALI, ClearConnect.'),
  ('Crestron', 'https://www.crestron.com', 'info@crestron.com', 'EUA',
   '["purchase","installation","configuration","maintenance"]'::jsonb, 28,
   'Automação residencial e corporativa. Controlos, áudio, vídeo.'),
  ('Savant', 'https://www.savant.com', 'info@savant.com', 'EUA',
   '["purchase","installation","configuration"]'::jsonb, 25,
   'Smart home luxury. Iluminação, clima, áudio, vídeo, segurança.'),
  ('Basalte Home', 'https://www.basaltehome.com', 'info@basaltehome.com', 'Bélgica',
   '["purchase","installation"]'::jsonb, 14,
   'Design minimalista KNX. Teclas, sensores, comandos.')
on conflict do nothing;
