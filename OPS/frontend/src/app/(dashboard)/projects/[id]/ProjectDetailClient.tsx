'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import { KpiCard } from '@/components/ui/KpiCard';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { DataTable } from '@/components/ui/DataTable';
import { PrescriptionTable } from '@/components/ui/PrescriptionTable';
import { BuildingList } from '@/components/ui/BuildingList';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import {
  mockProjects,
  mockBuildings,
  mockFloors,
  mockRooms,
  mockRequirements,
  mockPrescriptions,
} from '@/lib/mock-data';
import {
  Building2,
  ChevronLeft,
  Edit,
  Layers,
  Lightbulb,
  Maximize,
  Shield,
  Stethoscope,
  Thermometer,
  Volume2,
  Wifi,
  Zap,
} from 'lucide-react';

const categoryIcons: Record<string, React.ReactNode> = {
  iluminacao: <Lightbulb className="h-4 w-4 text-warning" />,
  cortinas: <Layers className="h-4 w-4 text-primary" />,
  climatizacao: <Thermometer className="h-4 w-4 text-info" />,
  vmc: <Zap className="h-4 w-4 text-success" />,
  piso_radiante: <Thermometer className="h-4 w-4 text-error" />,
  piscina: <Zap className="h-4 w-4 text-info" />,
  spa: <Thermometer className="h-4 w-4 text-success" />,
  sauna: <Thermometer className="h-4 w-4 text-warning" />,
  ice_bath: <Thermometer className="h-4 w-4 text-info" />,
  audio: <Volume2 className="h-4 w-4 text-primary" />,
  video: <Wifi className="h-4 w-4 text-info" />,
  cinema: <Zap className="h-4 w-4 text-warning" />,
  controlo_voz: <Volume2 className="h-4 w-4 text-success" />,
  tablets: <Wifi className="h-4 w-4 text-primary" />,
  seguranca: <Shield className="h-4 w-4 text-error" />,
  cctv: <Shield className="h-4 w-4 text-error" />,
  controlo_acessos: <Shield className="h-4 w-4 text-warning" />,
  carregamento_eletrico: <Zap className="h-4 w-4 text-success" />,
  fotovoltaico: <Lightbulb className="h-4 w-4 text-success" />,
  baterias: <Zap className="h-4 w-4 text-info" />,
  rega: <Zap className="h-4 w-4 text-primary" />,
  agua: <Zap className="h-4 w-4 text-info" />,
  rede: <Wifi className="h-4 w-4 text-primary" />,
  ia_local: <Wifi className="h-4 w-4 text-success" />,
  aprendizagem: <Lightbulb className="h-4 w-4 text-primary" />,
  atuacao_preditiva: <Zap className="h-4 w-4 text-warning" />,
};

interface ProjectDetailClientProps {
  projectId: string;
}

export default function ProjectDetailClient({ projectId }: ProjectDetailClientProps) {
  const router = useRouter();
  const { setSelectedProject } = useAppStore();

  const project = mockProjects.find((p) => p.id === projectId);
  const buildings = mockBuildings.filter((b) => b.project_id === projectId);
  const floors = mockFloors.filter((f) =>
    buildings.some((b) => b.id === f.building_id)
  );
  const rooms = mockRooms.filter((r) =>
    floors.some((f) => f.id === r.floor_id)
  );
  const requirements = mockRequirements.filter((r) => r.project_id === projectId);
  const prescriptions = mockPrescriptions.filter((p) => p.project_id === projectId);

  useEffect(() => {
    if (project) {
      setSelectedProject(project);
    }
    return () => setSelectedProject(null);
  }, [project, setSelectedProject]);

  if (!project) {
    return (
      <div className="flex h-96 items-center justify-center">
        <p className="text-muted-foreground">Projeto não encontrado</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <Button
            variant="ghost"
            size="sm"
            className="mb-1 -ml-2"
            onClick={() => router.push('/dashboard/projects')}
          >
            <ChevronLeft className="mr-1 h-4 w-4" />
            Voltar
          </Button>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">
              {project.name}
            </h1>
            <StatusBadge status={project.status} />
          </div>
          <p className="text-sm text-muted-foreground">{project.code}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Edit className="mr-2 h-4 w-4" />
            Editar
          </Button>
        </div>
      </div>

      <div className="grid gap-4 rounded-xl border bg-card p-4 sm:grid-cols-4">
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Cliente</p>
          <p className="text-sm font-medium">
            {project.client?.name || '-'}
          </p>
        </div>
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Tipologia</p>
          <p className="text-sm font-medium capitalize">
            {project.building_type.replace(/_/g, ' ')}
          </p>
        </div>
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Orçamento</p>
          <p className="text-sm font-medium">
            {project.budget_total
              ? new Intl.NumberFormat('pt-PT', {
                  style: 'currency',
                  currency: 'EUR',
                }).format(project.budget_total)
              : '-'}
          </p>
        </div>
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Nível</p>
          <p className="text-sm font-medium capitalize">
            {project.solution_level}
          </p>
        </div>
      </div>

      <Tabs defaultValue="overview">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="buildings">Edifícios</TabsTrigger>
          <TabsTrigger value="requirements">Requisitos</TabsTrigger>
          <TabsTrigger value="prescriptions">Prescrições</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <KpiCard
              title="Edifícios"
              value={buildings.length}
              icon={Building2}
            />
            <KpiCard title="Pisos" value={floors.length} icon={Layers} />
            <KpiCard
              title="Divisões"
              value={rooms.length}
              icon={Maximize}
            />
            <KpiCard
              title="Prescrições"
              value={prescriptions.length}
              icon={Stethoscope}
            />
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-xl border bg-card p-4">
              <h3 className="mb-3 text-sm font-medium">Área Total</h3>
              <p className="text-2xl font-bold">
                {project.total_area_m2
                  ? `${project.total_area_m2} m²`
                  : '-'}
              </p>
            </div>
            <div className="rounded-xl border bg-card p-4">
              <h3 className="mb-3 text-sm font-medium">Orçamento</h3>
              <p className="text-2xl font-bold">
                {project.budget_total
                  ? new Intl.NumberFormat('pt-PT', {
                      style: 'currency',
                      currency: 'EUR',
                    }).format(project.budget_total)
                  : '-'}
              </p>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="buildings" className="space-y-4">
          <BuildingList buildings={buildings} />
        </TabsContent>

        <TabsContent value="requirements" className="space-y-4">
          <DataTable
            data={requirements}
            columns={[
              {
                key: 'category',
                header: 'Categoria',
                cell: (row) => (
                  <div className="flex items-center gap-2">
                    {categoryIcons[row.category] || (
                      <Zap className="h-4 w-4 text-muted-foreground" />
                    )}
                    <span className="capitalize text-sm">
                      {row.category.replace(/_/g, ' ')}
                    </span>
                  </div>
                ),
              },
              {
                key: 'description',
                header: 'Descrição',
                cell: (row) => (
                  <span className="text-sm max-w-[400px] line-clamp-2">
                    {row.description}
                  </span>
                ),
              },
              {
                key: 'level',
                header: 'Níveis',
                cell: (row) => (
                  <div className="flex gap-1 text-xs">
                    {row.level_essential && (
                      <span className="rounded bg-muted px-1.5 py-0.5">E</span>
                    )}
                    {row.level_recommended && (
                      <span className="rounded bg-primary/10 px-1.5 py-0.5 text-primary">
                        R
                      </span>
                    )}
                    {row.level_signature && (
                      <span className="rounded bg-warning/10 px-1.5 py-0.5 text-warning">
                        S
                      </span>
                    )}
                  </div>
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
                  <span className="text-sm">P{row.priority}</span>
                ),
              },
            ]}
          />
        </TabsContent>

        <TabsContent value="prescriptions" className="space-y-4">
          <PrescriptionTable
            prescriptions={prescriptions}
            onApprove={(id) => console.log('approve', id)}
            onReject={(id) => console.log('reject', id)}
            onView={(id) => console.log('view', id)}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
