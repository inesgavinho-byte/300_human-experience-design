-- Migration: create procurement_tasks table
-- Tarefas automáticas de procurement geradas a partir de proposal_item_suppliers

create table if not exists public.procurement_tasks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id) on delete cascade,
  proposal_id uuid references public.proposals(id) on delete cascade,
  proposal_experience_id uuid references public.proposal_experiences(id) on delete cascade,
  supplier_id uuid references public.suppliers(id) on delete set null,
  -- tarefa derivada
  title text not null,
  description text,
  task_type text not null check (task_type in ('purchase','installation','configuration','delivery_tracking','follow_up')),
  status text default 'todo' check (status in ('todo','in_progress','in_review','done')),
  priority text default 'medium' check (priority in ('low','medium','high','critical')),
  due_date date,
  completed_at timestamptz,
  assigned_to uuid references auth.users(id) on delete set null,
  -- comunicação
  last_contact_at timestamptz,
  last_contact_method text check (last_contact_method in ('email','phone','chat','in_person')),
  last_contact_summary text,
  next_follow_up date,
  -- prazo de entrega do fornecedor
  supplier_promised_date date,
  actual_delivery_date date,
  -- link com tarefa principal do kanban
  linked_task_id uuid references public.tasks(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- RLS
alter table public.procurement_tasks enable row level security;

create policy "Allow all" on public.procurement_tasks
  for all using (true) with check (true);

-- Indexes
create index if not exists idx_proc_tasks_project on public.procurement_tasks(project_id);
create index if not exists idx_proc_tasks_proposal on public.procurement_tasks(proposal_id);
create index if not exists idx_proc_tasks_supplier on public.procurement_tasks(supplier_id);
create index if not exists idx_proc_tasks_status on public.procurement_tasks(status);
create index if not exists idx_proc_tasks_due on public.procurement_tasks(due_date);
