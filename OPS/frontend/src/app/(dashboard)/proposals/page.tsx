'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { KpiCard } from '@/components/ui/KpiCard';
import { ProposalCard } from '@/components/ui/ProposalCard';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { getProposals } from '@/lib/api';
import { mockProjects } from '@/lib/mock-data';
import type { Proposal } from '@/types';
import { FileText, Plus, TrendingUp } from 'lucide-react';

export default function ProposalsPage() {
  const router = useRouter();
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProposals();
  }, []);

  async function loadProposals() {
    try {
      // Fetch all proposals across projects
      const allProposals: Proposal[] = [];
      for (const project of mockProjects) {
        const projectProposals = await getProposals(project.id);
        allProposals.push(...projectProposals);
      }
      setProposals(allProposals);
    } catch (error) {
      console.error('Error loading proposals:', error);
    } finally {
      setLoading(false);
    }
  }

  const totalValue = proposals.reduce((sum, p) => sum + p.total_cost, 0);
  const approvedCount = proposals.filter((p) => p.status === 'approved').length;
  const pendingCount = proposals.filter((p) => p.status === 'draft' || p.status === 'review').length;

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <p className="text-muted-foreground">A carregar propostas...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Propostas</h1>
          <p className="text-muted-foreground">
            Gerir e gerar propostas comerciais
          </p>
        </div>
        <Button onClick={() => router.push('/dashboard/projects')}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Proposta
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title="Total Propostas"
          value={proposals.length}
          icon={FileText}
          trend={12}
        />
        <KpiCard
          title="Valor Total"
          value={new Intl.NumberFormat('pt-PT', {
            style: 'currency',
            currency: 'EUR',
            maximumFractionDigits: 0,
          }).format(totalValue)}
          icon={TrendingUp}
          trend={8}
        />
        <KpiCard
          title="Aprovadas"
          value={approvedCount}
          icon={FileText}
          trend={approvedCount > 0 ? 100 : 0}
        />
        <KpiCard
          title="Pendentes"
          value={pendingCount}
          icon={FileText}
          trend={-5}
        />
      </div>

      <div>
        <h3 className="mb-3 text-sm font-medium">Propostas Recentes</h3>
        {proposals.length === 0 ? (
          <div className="rounded-xl border bg-card p-8 text-center">
            <FileText className="mx-auto h-12 w-12 text-muted-foreground/50" />
            <h3 className="mt-4 text-lg font-medium">Nenhuma proposta</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Crie uma nova proposta a partir de um projeto existente.
            </p>
            <Button
              className="mt-4"
              onClick={() => router.push('/dashboard/projects')}
            >
              <Plus className="mr-2 h-4 w-4" />
              Criar Proposta
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {proposals.map((proposal) => (
              <ProposalCard
                key={proposal.id}
                proposal={proposal}
                onClick={() => router.push(`/dashboard/proposals/${proposal.id}`)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
