import { cn } from '@/lib/utils';
import type { ProjectStatus, PrescriptionStatus, RequirementStatus, PatternStatus, RuleApprovalStatus, AiServerStatus } from '@/types';

const statusStyles: Record<string, string> = {
  // Project
  draft: 'bg-muted text-muted-foreground',
  active: 'bg-success/15 text-success',
  on_hold: 'bg-warning/15 text-warning',
  completed: 'bg-success/15 text-success',
  archived: 'bg-muted text-muted-foreground',
  // Prescription
  review: 'bg-warning/15 text-warning',
  approved: 'bg-success/15 text-success',
  rejected: 'bg-error/15 text-error',
  superseded: 'bg-muted text-muted-foreground',
  // Requirement
  pending: 'bg-warning/15 text-warning',
  confirmed: 'bg-success/15 text-success',
  // Pattern
  suggested: 'bg-info/15 text-info',
  // Rule
  // AI
  inactive: 'bg-muted text-muted-foreground',
  maintenance: 'bg-warning/15 text-warning',
  error: 'bg-error/15 text-error',
};

const statusLabels: Record<string, string> = {
  draft: 'Rascunho',
  active: 'Ativo',
  on_hold: 'Em Pausa',
  completed: 'Concluído',
  archived: 'Arquivado',
  review: 'Revisão',
  approved: 'Aprovado',
  rejected: 'Rejeitado',
  superseded: 'Substituído',
  pending: 'Pendente',
  confirmed: 'Confirmado',
  suggested: 'Sugerido',
  inactive: 'Inativo',
  maintenance: 'Manutenção',
  error: 'Erro',
};

interface StatusBadgeProps {
  status: ProjectStatus | PrescriptionStatus | RequirementStatus | PatternStatus | RuleApprovalStatus | AiServerStatus | string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        statusStyles[status] || 'bg-muted text-muted-foreground',
        className
      )}
    >
      {statusLabels[status] || status}
    </span>
  );
}
