'use client';

import { useState, useMemo } from 'react';
import { DataTable } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { ProjectForm } from '@/components/ui/ProjectForm';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { mockProjects } from '@/lib/mock-data';
import { useRouter } from 'next/navigation';
import type { Project } from '@/types';
import { Plus, Search } from 'lucide-react';

const buildingTypeLabels: Record<string, string> = {
  apartamento: 'Apartamento',
  penthouse: 'Penthouse',
  moradia: 'Moradia',
  villa_grande: 'Villa Grande',
  edificio_multifamiliar: 'Edifício Multifamiliar',
  hotel: 'Hotel',
  aparthotel: 'Aparthotel',
  resort: 'Resort',
  escritorio: 'Escritório',
  retail: 'Retail',
  espaco_saude: 'Espaço Saúde',
  residencia_senior: 'Residência Sénior',
};

export default function ProjectsPage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [formOpen, setFormOpen] = useState(false);

  const filtered = useMemo(() => {
    return mockProjects.filter((p) => {
      const matchesSearch =
        !search ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.code.toLowerCase().includes(search.toLowerCase()) ||
        (p.client?.name || '').toLowerCase().includes(search.toLowerCase());
      const matchesType = typeFilter === 'all' || p.building_type === typeFilter;
      const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
      return matchesSearch && matchesType && matchesStatus;
    });
  }, [search, typeFilter, statusFilter]);

  const handleCreate = (_data: Partial<Project>) => {
    console.log('Create project:', _data);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Projetos</h1>
          <p className="text-muted-foreground">Gerir todos os projetos 300 OPS</p>
        </div>
        <Button onClick={() => setFormOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Projeto
        </Button>
        <ProjectForm open={formOpen} onOpenChange={setFormOpen} onSubmit={handleCreate} />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Pesquisar por nome, código ou cliente..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v ?? 'all')}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os tipos</SelectItem>
            {Object.entries(buildingTypeLabels).map(([value, label]) => (
              <SelectItem key={value} value={value}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v ?? 'all')}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os estados</SelectItem>
            <SelectItem value="draft">Rascunho</SelectItem>
            <SelectItem value="active">Ativo</SelectItem>
            <SelectItem value="on_hold">Em Pausa</SelectItem>
            <SelectItem value="completed">Concluído</SelectItem>
            <SelectItem value="archived">Arquivado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <DataTable
        data={filtered}
        onRowClick={(row) => router.push(`/dashboard/projects/${row.id}`)}
        columns={[
          {
            key: 'code',
            header: 'Código',
            cell: (row) => <span className="font-mono text-xs">{row.code}</span>,
          },
          {
            key: 'name',
            header: 'Nome',
            cell: (row) => <span className="font-medium">{row.name}</span>,
          },
          {
            key: 'client',
            header: 'Cliente',
            cell: (row) => <span className="text-sm">{row.client?.name || '-'}</span>,
          },
          {
            key: 'building_type',
            header: 'Tipo',
            cell: (row) => <span className="text-sm">{buildingTypeLabels[row.building_type] || row.building_type}</span>,
          },
          {
            key: 'status',
            header: 'Estado',
            cell: (row) => <StatusBadge status={row.status} />,
          },
          {
            key: 'area',
            header: 'Área',
            cell: (row) => <span className="text-sm">{row.total_area_m2 ? `${row.total_area_m2} m²` : '-'}</span>,
          },
          {
            key: 'budget',
            header: 'Orçamento',
            cell: (row) => (
              <span className="text-sm">
                {row.budget_total
                  ? new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(row.budget_total)
                  : '-'}
              </span>
            ),
          },
        ]}
      />
    </div>
  );
}
