import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle, ArrowLeft, Settings2, ChevronRight } from 'lucide-react';
import type { SystemConfiguration, Project } from '@/types';

const statusColors: Record<string, string> = {
  draft: 'bg-line/40 text-ink',
  review: 'bg-amber-100 text-amber-800',
  approved: 'bg-green-100 text-green-800',
  implemented: 'bg-ink text-ivory',
};

const statusLabels: Record<string, string> = {
  draft: 'Rascunho',
  review: 'Revisão',
  approved: 'Aprovado',
  implemented: 'Implementado',
};

const templateLabels: Record<string, string> = {
  basalte_knx: 'Basalte KNX',
  lutron_dali: 'Lutron DALI',
  crestron: 'Crestron',
  savant: 'Savant',
  custom: 'Personalizado',
};

export default function SystemConfig() {
  const [configs, setConfigs] = useState<SystemConfiguration[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchData() {
      try {
        setIsLoading(true);
        setError('');
        const [configsRes, projectsRes] = await Promise.all([
          supabase.from('system_configurations').select('*').order('updated_at', { ascending: false }),
          supabase.from('projects').select('*'),
        ]);
        if (configsRes.error) throw configsRes.error;
        if (projectsRes.error) throw projectsRes.error;
        setConfigs((configsRes.data || []) as unknown as SystemConfiguration[]);
        setProjects(projectsRes.data || []);
      } catch (err: any) {
        setError(err.message || 'Erro ao carregar configurações');
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, []);

  function getProjectName(projectId: string) {
    return projects.find(p => p.id === projectId)?.name || '—';
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-40" />)}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <h1 className="font-serif text-3xl text-ink">Configurações de Sistema</h1>
        <div className="flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md p-4">
          <AlertTriangle size={16} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl text-ink">Configurações de Sistema</h1>
          <p className="text-olive text-sm mt-1 font-sans">Sistemas inteligentes configurados por projeto</p>
        </div>
      </div>

      {configs.length === 0 ? (
        <Card className="border-line bg-ivory">
          <CardContent className="p-8 text-center">
            <Settings2 size={32} className="text-olive mx-auto mb-3" strokeWidth={1.5} />
            <h3 className="font-serif text-lg text-ink">Sem configurações</h3>
            <p className="text-sm text-olive font-sans mt-1">As configurações de sistema são criadas a partir da página de detalhe de cada projeto.</p>
            <Link to="/projetos">
              <Button className="mt-4 bg-ink text-ivory hover:bg-dark">
                <ArrowLeft size={14} className="mr-1" /> Ver Projetos
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {configs.map(config => (
            <Link key={config.id} to={`/configuracoes-sistema/${config.id}`}>
              <Card className="border-line bg-ivory hover:border-ink transition-colors cursor-pointer h-full">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <CardTitle className="font-serif text-base text-ink">{config.name}</CardTitle>
                    <Badge variant="outline" className={`text-[10px] ${statusColors[config.status] || ''}`}>
                      {statusLabels[config.status] || config.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center justify-between text-sm font-sans">
                    <span className="text-olive">Projeto</span>
                    <span className="text-ink">{getProjectName(config.project_id)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm font-sans">
                    <span className="text-olive">Template</span>
                    <span className="text-ink">{templateLabels[config.template_type] || config.template_type}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm font-sans">
                    <span className="text-olive">Divisões</span>
                    <span className="text-ink">{(config.rooms as unknown[])?.length || 0}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm font-sans">
                    <span className="text-olive">Cenários</span>
                    <span className="text-ink">{(config.scenes as unknown[])?.length || 0}</span>
                  </div>
                  <div className="pt-2 flex items-center gap-1 text-xs text-olive font-sans">
                    <span>Editar configuração</span>
                    <ChevronRight size={12} />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
