import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from './StatusBadge';
import type { Project } from '@/types';
import Link from 'next/link';
import { Building2, Layers, Maximize, Users } from 'lucide-react';

interface ProjectCardProps {
  project: Project;
}

export function ProjectCard({ project }: ProjectCardProps) {
  return (
    <Link href={`/dashboard/projects/${project.id}`}>
      <Card className="cursor-pointer transition-shadow hover:shadow-md">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-muted-foreground">{project.code}</p>
              <CardTitle className="mt-1 text-base">{project.name}</CardTitle>
            </div>
            <StatusBadge status={project.status} />
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="h-4 w-4" />
            <span>{project.client?.name || project.client_id}</span>
          </div>
          <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Building2 className="h-3.5 w-3.5" />
              <span>{project.num_floors ?? 0} pisos</span>
            </div>
            <div className="flex items-center gap-1">
              <Layers className="h-3.5 w-3.5" />
              <span>{project.num_rooms ?? 0} div.</span>
            </div>
            <div className="flex items-center gap-1">
              <Maximize className="h-3.5 w-3.5" />
              <span>{project.total_area_m2 ?? 0} m²</span>
            </div>
          </div>
          {project.budget_total && (
            <div className="border-t pt-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Orçamento</span>
                <span className="font-semibold">
                  {new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(project.budget_total)}
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
