'use client';

import { DataTable } from './DataTable';
import { StatusBadge } from './StatusBadge';
import { Button } from '@/components/ui/button';
import type { Prescription } from '@/types';
import { Check, Eye, X } from 'lucide-react';

interface PrescriptionTableProps {
  prescriptions: Prescription[];
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
  onView?: (id: string) => void;
}

export function PrescriptionTable({ prescriptions, onApprove, onReject, onView }: PrescriptionTableProps) {
  return (
    <DataTable
      data={prescriptions}
      columns={[
        {
          key: 'code',
          header: 'Código',
          cell: (row) => <span className="font-mono text-xs">{row.code}</span>,
        },
        {
          key: 'functional_requirement',
          header: 'Requisito Funcional',
          cell: (row) => (
            <span className="line-clamp-2 max-w-[300px] text-sm">{row.functional_requirement}</span>
          ),
        },
        {
          key: 'selected_equipment_brand',
          header: 'Equipamento',
          cell: (row) => (
            <span className="text-sm">
              {row.selected_equipment_brand ? `${row.selected_equipment_brand} ${row.selected_equipment_ref || ''}` : '-'}
            </span>
          ),
        },
        {
          key: 'status',
          header: 'Estado',
          cell: (row) => <StatusBadge status={row.status} />,
        },
        {
          key: 'priority',
          header: 'Prioridade',
          cell: (row) => (
            <span className={`text-xs font-medium ${row.priority <= 2 ? 'text-error' : row.priority === 3 ? 'text-warning' : 'text-muted-foreground'}`}>
              P{row.priority}
            </span>
          ),
        },
        {
          key: 'estimated_cost',
          header: 'Custo Est.',
          cell: (row) => (
            <span className="text-sm">
              {row.estimated_cost
                ? new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(row.estimated_cost)
                : '-'}
            </span>
          ),
        },
        {
          key: 'actions',
          header: 'Ações',
          cell: (row) => (
            <div className="flex items-center gap-1">
              {onView && (
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onView(row.id)}>
                  <Eye className="h-4 w-4" />
                </Button>
              )}
              {row.status === 'draft' || row.status === 'review' ? (
                <>
                  {onApprove && (
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-success" onClick={() => onApprove(row.id)}>
                      <Check className="h-4 w-4" />
                    </Button>
                  )}
                  {onReject && (
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-error" onClick={() => onReject(row.id)}>
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </>
              ) : null}
            </div>
          ),
        },
      ]}
    />
  );
}
