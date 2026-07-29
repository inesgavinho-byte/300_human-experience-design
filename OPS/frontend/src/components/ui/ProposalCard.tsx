import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from './StatusBadge';
import { Check, X, ArrowRight } from 'lucide-react';
import type { Proposal, SolutionLevel } from '@/types';
import { cn } from '@/lib/utils';

const levelStyles: Record<SolutionLevel, string> = {
  essential: 'border-l-4 border-l-muted',
  recommended: 'border-l-4 border-l-primary',
  signature: 'border-l-4 border-l-warning',
};

const levelLabels: Record<SolutionLevel, string> = {
  essential: 'Essential',
  recommended: 'Recommended',
  signature: 'Signature',
};

interface ProposalCardProps {
  proposal: Proposal;
  isSelected?: boolean;
  onSelect?: () => void;
  onClick?: () => void;
}

export function ProposalCard({ proposal, isSelected, onSelect, onClick }: ProposalCardProps) {
  return (
    <Card 
      className={cn('relative transition-shadow hover:shadow-md cursor-pointer', levelStyles[proposal.level], isSelected && 'ring-2 ring-primary')}
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <Badge variant="outline">{levelLabels[proposal.level]}</Badge>
          <div className="flex items-center gap-2">
            <StatusBadge status={proposal.status} />
            {isSelected && <Check className="h-5 w-5 text-success" />}
          </div>
        </div>
        <CardTitle className="mt-2 text-lg">{proposal.title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">{proposal.description}</p>

        <div className="text-3xl font-bold tracking-tight">
          {new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(proposal.total_cost)}
        </div>

        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Equipamentos</span>
            <span>{new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(proposal.equipment_cost)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Instalação</span>
            <span>{new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(proposal.installation_cost)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Programação</span>
            <span>{new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(proposal.programming_cost)}</span>
          </div>
          <div className="flex justify-between border-t pt-1">
            <span className="text-muted-foreground">Manutenção/ano</span>
            <span>{new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(proposal.maintenance_cost_annual)}</span>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Sistemas incluídos</p>
          <div className="flex flex-wrap gap-1">
            {proposal.included_systems.map((s) => (
              <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Duração estimada</p>
          <p className="text-sm">{proposal.estimated_duration_weeks} semanas</p>
        </div>

        {onSelect && (
          <Button
            variant={isSelected ? 'outline' : 'default'}
            className="w-full"
            onClick={(e) => {
              e.stopPropagation();
              onSelect();
            }}
          >
            {isSelected ? (
              <>
                <X className="mr-2 h-4 w-4" />
                Desselecionar
              </>
            ) : (
              'Selecionar'
            )}
          </Button>
        )}

        {onClick && !onSelect && (
          <div className="flex items-center text-sm text-primary">
            <span>Ver detalhes</span>
            <ArrowRight className="ml-1 h-4 w-4" />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
