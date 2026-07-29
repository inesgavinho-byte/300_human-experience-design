'use client';

import { useState } from 'react';
import { KpiCard } from '@/components/ui/KpiCard';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { DataTable } from '@/components/ui/DataTable';
import { ActivityChart } from '@/components/charts/ActivityChart';
import { mockAiServers, mockAiPatterns } from '@/lib/mock-data';
import { Button } from '@/components/ui/button';
import { Check, Cpu, MemoryStick, Server, X, Zap } from 'lucide-react';

const activityData = [
  { date: 'Seg', value: 42 },
  { date: 'Ter', value: 55 },
  { date: 'Qua', value: 38 },
  { date: 'Qui', value: 62 },
  { date: 'Sex', value: 48 },
  { date: 'Sáb', value: 28 },
  { date: 'Dom', value: 35 },
];

export default function AiPage() {
  const [patterns, setPatterns] = useState(mockAiPatterns);

  const handleApprove = (id: string) => {
    setPatterns((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status: 'approved' as const } : p))
    );
  };

  const handleReject = (id: string) => {
    setPatterns((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status: 'rejected' as const } : p))
    );
  };

  const server = mockAiServers[0];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Estado da IA</h1>
        <p className="text-muted-foreground">Servidores de IA local e padrões aprendidos</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title="Servidor"
          value={server?.status === 'active' ? 'Online' : 'Offline'}
          icon={Server}
          subtitle={server?.model}
        />
        <KpiCard
          title="CPU Cores"
          value={server?.cpu_cores || 0}
          icon={Cpu}
        />
        <KpiCard
          title="RAM"
          value={`${server?.ram_gb || 0} GB`}
          icon={MemoryStick}
        />
        <KpiCard
          title="Modelos Instalados"
          value={server?.installed_models.length || 0}
          icon={Zap}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ActivityChart data={activityData} title="Atividade da IA (últimos 7 dias)" />
        <div className="rounded-xl border bg-card p-4">
          <h3 className="mb-3 text-sm font-medium">Modelos Instalados</h3>
          <div className="space-y-2">
            {server?.installed_models.map((model: unknown) => (
              <div key={String(model)} className="flex items-center justify-between rounded-md bg-muted px-3 py-2">
                <span className="text-sm font-medium">{String(model)}</span>
                <Check className="h-4 w-4 text-success" />
              </div>
            )) || <p className="text-sm text-muted-foreground">Nenhum modelo instalado</p>}
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold">Padrões Aprendidos</h2>
        <p className="text-sm text-muted-foreground">Padrões sugeridos pela IA local — requerem aprovação humana</p>
      </div>

      <DataTable
        data={patterns}
        columns={[
          {
            key: 'name',
            header: 'Nome',
            cell: (row) => <span className="font-medium">{row.pattern_name}</span>,
          },
          {
            key: 'type',
            header: 'Tipo',
            cell: (row) => <span className="capitalize text-sm">{row.pattern_type}</span>,
          },
          {
            key: 'description',
            header: 'Descrição',
            cell: (row) => <span className="text-sm max-w-[300px] line-clamp-2">{row.description || '-'}</span>,
          },
          {
            key: 'confidence',
            header: 'Confiança',
            cell: (row) => (
              <span className="text-sm font-medium">
                {row.confidence_score ? `${Math.round(row.confidence_score * 100)}%` : '-'}
              </span>
            ),
          },
          {
            key: 'occurrences',
            header: 'Ocorrências',
            cell: (row) => <span className="text-sm">{row.occurrence_count}</span>,
          },
          {
            key: 'status',
            header: 'Estado',
            cell: (row) => <StatusBadge status={row.status} />,
          },
          {
            key: 'actions',
            header: 'Ações',
            cell: (row) =>
              row.status === 'suggested' ? (
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-success"
                    onClick={() => handleApprove(row.id)}
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-error"
                    onClick={() => handleReject(row.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : null,
          },
        ]}
      />
    </div>
  );
}
