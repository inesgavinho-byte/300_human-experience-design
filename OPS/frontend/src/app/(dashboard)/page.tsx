'use client';

import { KpiCard } from '@/components/ui/KpiCard';
import { ProjectCard } from '@/components/ui/ProjectCard';
import { ActivityChart } from '@/components/charts/ActivityChart';
import {
  mockProjects,
  mockPrescriptions,
  mockProposals,
  mockAiPatterns,
} from '@/lib/mock-data';
import {
  Activity,
  FileCheck,
  FolderOpen,
  Stethoscope,
} from 'lucide-react';

const activityData = [
  { date: 'Jan', value: 12 },
  { date: 'Fev', value: 18 },
  { date: 'Mar', value: 15 },
  { date: 'Abr', value: 22 },
  { date: 'Mai', value: 28 },
  { date: 'Jun', value: 35 },
  { date: 'Jul', value: 30 },
];

export default function DashboardHomePage() {
  const activeProjects = mockProjects.filter((p) => p.status === 'active');
  const pendingPrescriptions = mockPrescriptions.filter(
    (p) => p.status === 'draft' || p.status === 'review'
  );
  const approvedProposals = mockProposals.filter(
    (p) => p.status === 'approved'
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Visão geral da plataforma 300 OPS
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title="Projetos Ativos"
          value={activeProjects.length}
          icon={FolderOpen}
          trend={12}
        />
        <KpiCard
          title="Prescrições Pendentes"
          value={pendingPrescriptions.length}
          icon={Stethoscope}
          trend={-5}
        />
        <KpiCard
          title="Propostas Aprovadas"
          value={approvedProposals.length}
          icon={FileCheck}
          trend={8}
        />
        <KpiCard
          title="Padrões IA"
          value={mockAiPatterns.length}
          icon={Activity}
          trend={15}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ActivityChart data={activityData} title="Atividade Mensal" />
        </div>
        <div>
          <h3 className="mb-3 text-sm font-medium">Projetos Recentes</h3>
          <div className="space-y-3">
            {mockProjects.slice(0, 5).map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
