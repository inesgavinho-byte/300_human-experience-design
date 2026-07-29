'use client';

import { usePathname } from 'next/navigation';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Fragment } from 'react';

const labelMap: Record<string, string> = {
  dashboard: 'Dashboard',
  projects: 'Projetos',
  equipment: 'Equipamentos',
  rules: 'Regras',
  ai: 'IA',
  buildings: 'Edifícios',
  floors: 'Pisos',
  rooms: 'Divisões',
  requirements: 'Requisitos',
  prescriptions: 'Prescrições',
  proposals: 'Propostas',
};

export function Breadcrumbs() {
  const pathname = usePathname();
  const segments = pathname.split('/').filter(Boolean);

  if (segments.length <= 1) return null;

  return (
    <Breadcrumb className="mb-4">
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
        </BreadcrumbItem>
        {segments.slice(1).map((segment, index) => {
          const isLast = index === segments.length - 2;
          const href = '/' + segments.slice(0, index + 2).join('/');
          const label = labelMap[segment] || segment;

          return (
            <Fragment key={segment + index}>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                {isLast ? (
                  <BreadcrumbPage>{label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink href={href}>{label}</BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
