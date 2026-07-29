import { mockProjects } from '@/lib/mock-data';
import ProjectDetailClient from './ProjectDetailClient';

export function generateStaticParams() {
  return mockProjects.map((project) => ({
    id: project.id,
  }));
}

export default function ProjectDetailPage({ params }: { params: { id: string } }) {
  return <ProjectDetailClient projectId={params.id} />;
}
