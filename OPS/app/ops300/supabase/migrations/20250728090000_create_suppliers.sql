-- Migration: create suppliers table
-- Fornecedores da plataforma 300

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
  -- tipo de serviço que fornece (pode ser múltiplo)
  services jsonb default '[]'::jsonb, -- ['purchase','installation','configuration','maintenance']
  lead_time_days integer, -- prazo médio de entrega em dias
  notes text,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- RLS
alter table public.suppliers enable row level security;

create policy "Allow all" on public.suppliers
  for all using (true) with check (true);

-- Indexes
create index if not exists idx_suppliers_name on public.suppliers(name);
create index if not exists idx_suppliers_services on public.suppliers using gin(services);
