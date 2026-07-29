-- Migration: create proposal_item_suppliers table
-- Ligação N:M entre proposal_experiences (items) e suppliers

create table if not exists public.proposal_item_suppliers (
  id uuid primary key default gen_random_uuid(),
  proposal_experience_id uuid not null references public.proposal_experiences(id) on delete cascade,
  supplier_id uuid not null references public.suppliers(id) on delete restrict,
  -- tipo de serviço deste fornecedor para este item
  service_type text not null check (service_type in ('purchase','installation','configuration','maintenance')),
  unit_cost numeric(12,2), -- custo unitário negociado com fornecedor
  quantity integer default 1,
  total_cost numeric(12,2), -- unit_cost * quantity
  lead_time_days integer, -- prazo específico para este item
  status text default 'pending' check (status in ('pending','quoted','ordered','delivered','cancelled')),
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- RLS
alter table public.proposal_item_suppliers enable row level security;

create policy "Allow all" on public.proposal_item_suppliers
  for all using (true) with check (true);

-- Indexes
create index if not exists idx_pis_experience on public.proposal_item_suppliers(proposal_experience_id);
create index if not exists idx_pis_supplier on public.proposal_item_suppliers(supplier_id);
