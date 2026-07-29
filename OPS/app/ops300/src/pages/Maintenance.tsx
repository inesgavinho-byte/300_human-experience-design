import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Wrench, Calendar, Clock, AlertTriangle, History } from 'lucide-react';
import type { MaintenanceTicket, MaintenanceVisit, Project } from '@/types';

const priorityColors: Record<string, string> = {
  'Baixo': 'border-line text-olive',
  'Médio': 'border-olive text-ink',
  'Alto': 'border-ink text-ink',
  'Crítico': 'border-red-400 text-red-700 bg-red-50',
};

const ticketStatusColors: Record<string, string> = {
  'Aberto': 'bg-red-50 text-red-700',
  'Em atendimento': 'bg-olive/20 text-ink',
  'Resolvido': 'bg-ink text-ivory',
  'Fechado': 'bg-line/40 text-olive',
};

export default function Maintenance() {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState<MaintenanceTicket[]>([]);
  const [visits, setVisits] = useState<MaintenanceVisit[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchData() {
      try {
        setIsLoading(true);
        setError('');

        const [ticketsRes, visitsRes, projectsRes] = await Promise.all([
          supabase.from('maintenance_tickets').select('*'),
          supabase.from('maintenance_visits').select('*'),
          supabase.from('projects').select('*'),
        ]);

        if (ticketsRes.error) throw ticketsRes.error;
        if (visitsRes.error) throw visitsRes.error;
        if (projectsRes.error) throw projectsRes.error;

        setTickets(ticketsRes.data || []);
        setVisits(visitsRes.data || []);
        setProjects(projectsRes.data || []);
      } catch (err: any) {
        setError(err.message || 'Erro ao carregar manutenção');
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <h1 className="font-serif text-3xl text-ink">Manutenção</h1>
        <div className="flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md p-4">
          <AlertTriangle size={16} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-serif text-3xl text-ink">Manutenção</h1>
          <p className="text-olive text-sm mt-1 font-sans">Visitas preventivas e tickets de suporte</p>
        </div>
        <Button variant="outline" onClick={() => navigate('/manutencao/historico')} className="border-line text-ink font-sans">
          <History size={16} className="mr-1.5" />
          Histórico
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tickets */}
        <Card className="border-line bg-ivory">
          <CardHeader>
            <CardTitle className="font-serif text-lg text-ink flex items-center gap-2">
              <Wrench size={16} strokeWidth={1.5} /> Tickets de Suporte
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {tickets.map(tk => {
                const project = projects.find(p => p.id === tk.project_id);
                return (
                  <div key={tk.id} className="border border-line rounded-md p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-medium text-ink font-sans">{tk.title}</p>
                        <p className="text-xs text-olive font-sans mt-0.5">{project?.name || '—'} · {tk.created_at ? new Date(tk.created_at).toLocaleDateString('pt-PT') : '—'}</p>
                      </div>
                      <div className="flex gap-1.5">
                        <Badge variant="outline" className={`text-[10px] ${priorityColors[tk.severity || ''] || ''}`}>{tk.severity || '—'}</Badge>
                        <Badge variant="outline" className={`text-[10px] ${ticketStatusColors[tk.status || ''] || ''}`}>{tk.status || '—'}</Badge>
                      </div>
                    </div>
                    {tk.description && <p className="text-xs text-olive mt-2 font-sans">{tk.description}</p>}
                  </div>
                );
              })}
              {tickets.length === 0 && (
                <p className="text-sm text-olive font-sans">Sem tickets de suporte.</p>
              )}
            </div>

            <div className="mt-4 pt-4 border-t border-line">
              <p className="text-[10px] uppercase tracking-wider text-olive font-sans mb-2">SLAs</p>
              <div className="grid grid-cols-2 gap-2 text-xs font-sans">
                <div className="flex items-center gap-1.5"><Clock size={12} strokeWidth={1.5} /> <span className="text-ink">Crítico: 2h</span></div>
                <div className="flex items-center gap-1.5"><Clock size={12} strokeWidth={1.5} /> <span className="text-ink">Alto: 4h</span></div>
                <div className="flex items-center gap-1.5"><Clock size={12} strokeWidth={1.5} /> <span className="text-ink">Médio: 24h</span></div>
                <div className="flex items-center gap-1.5"><Clock size={12} strokeWidth={1.5} /> <span className="text-ink">Baixo: 72h</span></div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Visitas */}
        <Card className="border-line bg-ivory">
          <CardHeader>
            <CardTitle className="font-serif text-lg text-ink flex items-center gap-2">
              <Calendar size={16} strokeWidth={1.5} /> Visitas Preventivas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border border-line rounded-md overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="border-line">
                    <TableHead className="text-olive font-sans">Data</TableHead>
                    <TableHead className="text-olive font-sans">Projeto</TableHead>
                    <TableHead className="text-olive font-sans">Tipo</TableHead>
                    <TableHead className="text-olive font-sans">Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visits.map(v => {
                    const project = projects.find(p => p.id === v.project_id);
                    const isCompleted = v.status === 'Concluída' || v.completed_date;
                    return (
                      <TableRow key={v.id} className="border-line/50">
                        <TableCell className="text-ink font-sans text-sm">{v.scheduled_date ? new Date(v.scheduled_date).toLocaleDateString('pt-PT') : '—'}</TableCell>
                        <TableCell className="text-olive font-sans text-xs">{project?.name || '—'}</TableCell>
                        <TableCell className="text-ink font-sans text-xs">{v.type || '—'}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`text-[10px] ${isCompleted ? 'bg-ink text-ivory' : 'bg-line/40 text-ink'}`}>
                            {isCompleted ? 'Concluída' : 'Agendada'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
            {visits.length === 0 && (
              <p className="text-sm text-olive font-sans mt-4">Sem visitas agendadas.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
