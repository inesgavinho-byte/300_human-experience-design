import { useState, useEffect, useRef, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  Calendar, Wrench, AlertTriangle, Clock, FileDown, CheckCircle,
  Plus, User, MapPin, Filter, ArrowDownUp, Building2,
} from 'lucide-react';
import { toast } from 'sonner';
import type { MaintenanceTicket, MaintenanceVisit, Client, Project } from '@/types';

interface TimelineItem {
  id: string;
  type: 'visit' | 'ticket';
  date: string;
  title: string;
  subtitle: string;
  description: string | null;
  status: string | null;
  severity?: string | null;
  visitType?: string | null;
  findings?: string | null;
  assigned_to?: string | null;
  technician_id?: string | null;
}

export default function MaintenanceHistory() {
  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [visits, setVisits] = useState<MaintenanceVisit[]>([]);
  const [tickets, setTickets] = useState<MaintenanceTicket[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [exporting, setExporting] = useState(false);
  const [sortAsc, setSortAsc] = useState(false);
  const timelineRef = useRef<HTMLDivElement>(null);

  /* Create dialogs */
  const [ticketDialogOpen, setTicketDialogOpen] = useState(false);
  const [visitDialogOpen, setVisitDialogOpen] = useState(false);
  const [newTicket, setNewTicket] = useState({ title: '', description: '', severity: 'Médio', project_id: '' });
  const [newVisit, setNewVisit] = useState({ type: 'preventive', description: '', scheduled_date: '', project_id: '' });

  /* ─── Data fetch ─── */
  useEffect(() => {
    async function fetchData() {
      try {
        setIsLoading(true);
        setError('');
        const [clientsRes, projectsRes, visitsRes, ticketsRes] = await Promise.all([
          supabase.from('clients').select('*').order('name'),
          supabase.from('projects').select('*').order('name'),
          supabase.from('maintenance_visits').select('*').order('scheduled_date', { ascending: false }),
          supabase.from('maintenance_tickets').select('*').order('created_at', { ascending: false }),
        ]);
        if (clientsRes.error) throw clientsRes.error;
        if (projectsRes.error) throw projectsRes.error;
        if (visitsRes.error) throw visitsRes.error;
        if (ticketsRes.error) throw ticketsRes.error;
        setClients(clientsRes.data || []);
        setProjects(projectsRes.data || []);
        setVisits(visitsRes.data || []);
        setTickets(ticketsRes.data || []);
      } catch (err: any) {
        setError(err.message || 'Erro ao carregar histórico');
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, []);

  /* Filtered projects by client */
  const clientProjects = useMemo(() => {
    if (!selectedClientId) return projects;
    return projects.filter(p => p.client_id === selectedClientId);
  }, [projects, selectedClientId]);

  /* Final filtered items */
  const filteredVisits = useMemo(() => {
    return visits.filter(v => {
      if (selectedProjectId && v.project_id !== selectedProjectId) return false;
      if (selectedClientId && !selectedProjectId) {
        const project = projects.find(p => p.id === v.project_id);
        if (project?.client_id !== selectedClientId && v.client_id !== selectedClientId) return false;
      }
      return true;
    });
  }, [visits, selectedProjectId, selectedClientId, projects]);

  const filteredTickets = useMemo(() => {
    return tickets.filter(t => {
      if (selectedProjectId && t.project_id !== selectedProjectId) return false;
      if (selectedClientId && !selectedProjectId) {
        const project = projects.find(p => p.id === t.project_id);
        if (project?.client_id !== selectedClientId && t.client_id !== selectedClientId) return false;
      }
      return true;
    });
  }, [tickets, selectedProjectId, selectedClientId, projects]);

  const timelineItems: TimelineItem[] = useMemo(() => {
    const items: TimelineItem[] = [
      ...filteredVisits.map(v => {
        const project = projects.find(p => p.id === v.project_id);
        return {
          id: `visit-${v.id}`,
          type: 'visit' as const,
          date: v.completed_date || v.scheduled_date || v.created_at,
          title: project?.name || 'Visita',
          subtitle: v.type || 'Manutenção',
          description: v.description,
          status: v.status,
          visitType: v.type,
          findings: v.findings,
          technician_id: v.technician_id,
        };
      }),
      ...filteredTickets.map(t => {
        const project = projects.find(p => p.id === t.project_id);
        return {
          id: `ticket-${t.id}`,
          type: 'ticket' as const,
          date: t.resolved_at || t.created_at,
          title: t.title,
          subtitle: project?.name || 'Ticket',
          description: t.description,
          status: t.status,
          severity: t.severity,
          assigned_to: t.assigned_to,
        };
      }),
    ];
    items.sort((a, b) => {
      const diff = new Date(b.date).getTime() - new Date(a.date).getTime();
      return sortAsc ? -diff : diff;
    });
    return items;
  }, [filteredVisits, filteredTickets, projects, sortAsc]);

  /* Stats */
  const stats = useMemo(() => {
    const totalVisits = filteredVisits.length;
    const openTickets = filteredTickets.filter(t => t.status === 'Aberto' || t.status === 'Em atendimento').length;
    const resolvedTickets = filteredTickets.filter(t => t.resolved_at);
    const avgResolutionHours = resolvedTickets.length > 0
      ? resolvedTickets.reduce((sum, t) => {
        const created = new Date(t.created_at).getTime();
        const resolved = new Date(t.resolved_at!).getTime();
        return sum + (resolved - created) / (1000 * 60 * 60);
      }, 0) / resolvedTickets.length
      : 0;
    const criticalTickets = filteredTickets.filter(t => t.severity === 'Crítico' && (t.status === 'Aberto' || t.status === 'Em atendimento')).length;
    return { totalVisits, openTickets, avgResolutionHours, criticalTickets };
  }, [filteredVisits, filteredTickets]);

  /* ─── Create handlers ─── */
  async function handleCreateTicket() {
    if (!newTicket.title.trim()) { toast.error('Título obrigatório'); return; }
    const { error } = await supabase.from('maintenance_tickets').insert({
      title: newTicket.title,
      description: newTicket.description || null,
      severity: newTicket.severity,
      project_id: newTicket.project_id || null,
      status: 'Aberto',
    });
    if (error) { toast.error('Erro: ' + error.message); return; }
    toast.success('Ticket criado');
    setTicketDialogOpen(false);
    setNewTicket({ title: '', description: '', severity: 'Médio', project_id: '' });
    // Refresh
    const { data } = await supabase.from('maintenance_tickets').select('*').order('created_at', { ascending: false });
    if (data) setTickets(data);
  }

  async function handleCreateVisit() {
    if (!newVisit.scheduled_date) { toast.error('Data agendada obrigatória'); return; }
    const { error } = await supabase.from('maintenance_visits').insert({
      type: newVisit.type,
      description: newVisit.description || null,
      scheduled_date: newVisit.scheduled_date,
      project_id: newVisit.project_id || null,
      status: 'Pendente',
    });
    if (error) { toast.error('Erro: ' + error.message); return; }
    toast.success('Visita agendada');
    setVisitDialogOpen(false);
    setNewVisit({ type: 'preventive', description: '', scheduled_date: '', project_id: '' });
    const { data } = await supabase.from('maintenance_visits').select('*').order('scheduled_date', { ascending: false });
    if (data) setVisits(data);
  }

  /* ─── PDF Export ─── */
  async function handleExportPdf() {
    if (!timelineRef.current) return;
    setExporting(true);
    try {
      const html2pdf = (await import('html2pdf.js')).default;
      const clientName = selectedClientId ? clients.find(c => c.id === selectedClientId)?.name : 'Todos';
      const projectName = selectedProjectId ? projects.find(p => p.id === selectedProjectId)?.name : null;
      const opt = {
        margin: [15, 15, 15, 15] as [number, number, number, number],
        filename: `Historico_Manutencao_${clientName || 'Todos'}${projectName ? '_' + projectName : ''}.pdf`,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const },
      };
      await html2pdf().set(opt).from(timelineRef.current).save();
    } catch (err) {
      console.error('PDF export failed:', err);
    }
    setExporting(false);
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Skeleton className="h-24" /><Skeleton className="h-24" />
          <Skeleton className="h-24" /><Skeleton className="h-24" />
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <h1 className="font-serif text-3xl text-ink">Histórico de Manutenção</h1>
        <div className="flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md p-4">
          <AlertTriangle size={16} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-serif text-3xl text-ink">Histórico de Manutenção</h1>
          <p className="text-olive text-sm mt-1 font-sans">
            {stats.totalVisits} visitas · {stats.openTickets} tickets abertos
            {stats.criticalTickets > 0 && (
              <span className="text-red-600 font-medium ml-2">· {stats.criticalTickets} crítico(s)</span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setTicketDialogOpen(true)} className="border-line text-ink font-sans">
            <Plus size={16} className="mr-1" /> Ticket
          </Button>
          <Button variant="outline" onClick={() => setVisitDialogOpen(true)} className="border-line text-ink font-sans">
            <Calendar size={16} className="mr-1" /> Visita
          </Button>
          <Button variant="outline" onClick={handleExportPdf} disabled={exporting} className="border-line text-ink font-sans">
            <FileDown size={16} className="mr-1" />
            {exporting ? 'A exportar...' : 'PDF'}
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter size={14} className="text-olive shrink-0" />
          <Select value={selectedClientId || 'all'} onValueChange={v => {
            setSelectedClientId(v === 'all' ? null : v);
            setSelectedProjectId(null);
          }}>
            <SelectTrigger className="bg-ivory border-line text-ink w-full sm:w-56">
              <SelectValue placeholder="Todos os clientes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os clientes</SelectItem>
              {clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Building2 size={14} className="text-olive shrink-0" />
          <Select value={selectedProjectId || 'all'} onValueChange={v => setSelectedProjectId(v === 'all' ? null : v)}>
            <SelectTrigger className="bg-ivory border-line text-ink w-full sm:w-56">
              <SelectValue placeholder="Todos os projetos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os projetos</SelectItem>
              {clientProjects.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSortAsc(!sortAsc)}
          className="text-olive hover:text-ink"
        >
          <ArrowDownUp size={14} className="mr-1" />
          {sortAsc ? 'Mais antigo primeiro' : 'Mais recente primeiro'}
        </Button>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-line bg-ivory">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-olive mb-1">
              <Calendar size={14} strokeWidth={1.5} />
              <span className="text-xs font-sans uppercase tracking-wider">Visitas</span>
            </div>
            <p className="font-serif text-2xl text-ink">{stats.totalVisits}</p>
          </CardContent>
        </Card>
        <Card className="border-line bg-ivory">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-olive mb-1">
              <Clock size={14} strokeWidth={1.5} />
              <span className="text-xs font-sans uppercase tracking-wider">Tempo Médio</span>
            </div>
            <p className="font-serif text-2xl text-ink">
              {stats.avgResolutionHours > 0 ? `${Math.round(stats.avgResolutionHours)}h` : '—'}
            </p>
          </CardContent>
        </Card>
        <Card className="border-line bg-ivory">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-olive mb-1">
              <AlertTriangle size={14} strokeWidth={1.5} />
              <span className="text-xs font-sans uppercase tracking-wider">Tickets Abertos</span>
            </div>
            <p className="font-serif text-2xl text-ink">{stats.openTickets}</p>
          </CardContent>
        </Card>
        <Card className="border-line bg-ivory">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-olive mb-1">
              <CheckCircle size={14} strokeWidth={1.5} />
              <span className="text-xs font-sans uppercase tracking-wider">Críticos</span>
            </div>
            <p className={`font-serif text-2xl ${stats.criticalTickets > 0 ? 'text-red-600' : 'text-ink'}`}>
              {stats.criticalTickets}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Timeline */}
      <div ref={timelineRef} className="bg-ivory p-6 rounded-xl border border-line">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-serif text-xl text-ink">Linha Temporal</h2>
          <span className="text-xs text-olive font-sans">{timelineItems.length} registos</span>
        </div>
        {timelineItems.length === 0 ? (
          <p className="text-olive font-sans text-sm">Sem registos para os filtros selecionados.</p>
        ) : (
          <div className="relative pl-6">
            <div className="absolute left-[11px] top-0 bottom-0 w-px bg-line" />
            {timelineItems.map((item) => {
              const isVisit = item.type === 'visit';
              const date = new Date(item.date);
              const dateStr = date.toLocaleDateString('pt-PT');
              const timeStr = date.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' });

              const dotColor = isVisit
                ? (item.visitType === 'preventive' ? 'bg-emerald-500' : item.visitType === 'corrective' ? 'bg-blue-500' : 'bg-sky-500')
                : (item.severity === 'Crítico' ? 'bg-red-500' : item.severity === 'Alto' ? 'bg-amber-500' : 'bg-yellow-400');

              return (
                <div key={item.id} className="relative mb-6 last:mb-0">
                  <div className={`absolute left-[-17px] top-1.5 w-[13px] h-[13px] rounded-full border-2 border-ivory ${dotColor} z-10`} />
                  <Card className="border-line bg-white">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          {isVisit ? (
                            <Calendar size={14} className="text-emerald-600 shrink-0" />
                          ) : (
                            <Wrench size={14} className="text-red-500 shrink-0" />
                          )}
                          <span className="text-xs font-sans text-olive">{dateStr} {timeStr}</span>
                          {isVisit && item.technician_id && (
                            <span className="flex items-center gap-1 text-[10px] text-olive bg-line/20 px-1.5 py-0.5 rounded">
                              <User size={10} /> {item.technician_id}
                            </span>
                          )}
                          {!isVisit && item.assigned_to && (
                            <span className="flex items-center gap-1 text-[10px] text-olive bg-line/20 px-1.5 py-0.5 rounded">
                              <User size={10} /> {item.assigned_to}
                            </span>
                          )}
                        </div>
                        <Badge variant="outline" className="text-[10px] shrink-0">
                          {isVisit ? 'Visita' : 'Ticket'}
                        </Badge>
                      </div>

                      <h3 className="font-serif text-base text-ink mb-1">{item.title}</h3>
                      <p className="text-xs text-olive font-sans mb-2 flex items-center gap-1">
                        <MapPin size={10} /> {item.subtitle}
                      </p>

                      {item.description && (
                        <p className="text-sm text-ink font-sans mb-2">{item.description}</p>
                      )}

                      {isVisit && item.findings && (
                        <div className="bg-emerald-50 border border-emerald-100 rounded-md p-2 text-xs text-emerald-800 font-sans">
                          <strong>Constatações:</strong> {item.findings}
                        </div>
                      )}

                      {!isVisit && (
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          {item.severity && (
                            <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-medium ${
                              item.severity === 'Crítico' ? 'bg-red-50 text-red-700' :
                              item.severity === 'Alto' ? 'bg-amber-50 text-amber-700' :
                              item.severity === 'Médio' ? 'bg-yellow-50 text-yellow-700' :
                              'bg-line/40 text-olive'
                            }`}>
                              {item.severity}
                            </span>
                          )}
                          {item.status && (
                            <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-medium ${
                              item.status === 'Aberto' ? 'bg-red-50 text-red-700' :
                              item.status === 'Em atendimento' ? 'bg-olive/20 text-ink' :
                              item.status === 'Resolvido' ? 'bg-ink text-ivory' :
                              'bg-line/40 text-olive'
                            }`}>
                              {item.status}
                            </span>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ─── Create Ticket Dialog ─── */}
      <Dialog open={ticketDialogOpen} onOpenChange={setTicketDialogOpen}>
        <DialogContent className="bg-ivory border-line max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-serif text-lg text-ink flex items-center gap-2">
              <AlertTriangle size={16} /> Novo Ticket
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-olive text-xs font-sans">Título *</Label>
              <Input
                value={newTicket.title}
                onChange={e => setNewTicket({ ...newTicket, title: e.target.value })}
                placeholder="Descrição breve do problema"
                className="bg-ivory border-line text-ink mt-1"
              />
            </div>
            <div>
              <Label className="text-olive text-xs font-sans">Descrição</Label>
              <Textarea
                value={newTicket.description}
                onChange={e => setNewTicket({ ...newTicket, description: e.target.value })}
                rows={3}
                className="bg-ivory border-line text-ink mt-1"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-olive text-xs font-sans">Severidade</Label>
                <Select value={newTicket.severity} onValueChange={v => setNewTicket({ ...newTicket, severity: v })}>
                  <SelectTrigger className="bg-ivory border-line text-ink mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Baixo">Baixo</SelectItem>
                    <SelectItem value="Médio">Médio</SelectItem>
                    <SelectItem value="Alto">Alto</SelectItem>
                    <SelectItem value="Crítico">Crítico</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-olive text-xs font-sans">Projeto</Label>
                <Select value={newTicket.project_id} onValueChange={v => setNewTicket({ ...newTicket, project_id: v })}>
                  <SelectTrigger className="bg-ivory border-line text-ink mt-1">
                    <SelectValue placeholder="Selecionar..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Sem projeto</SelectItem>
                    {projects.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTicketDialogOpen(false)} className="border-line text-ink">Cancelar</Button>
            <Button onClick={handleCreateTicket} className="bg-ink text-ivory hover:bg-ink/90">Criar Ticket</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Create Visit Dialog ─── */}
      <Dialog open={visitDialogOpen} onOpenChange={setVisitDialogOpen}>
        <DialogContent className="bg-ivory border-line max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-serif text-lg text-ink flex items-center gap-2">
              <Calendar size={16} /> Nova Visita
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-olive text-xs font-sans">Tipo</Label>
              <Select value={newVisit.type} onValueChange={v => setNewVisit({ ...newVisit, type: v })}>
                <SelectTrigger className="bg-ivory border-line text-ink mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="preventive">Preventiva</SelectItem>
                  <SelectItem value="corrective">Corretiva</SelectItem>
                  <SelectItem value="inspection">Inspeção</SelectItem>
                  <SelectItem value="commissioning">Commissioning</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-olive text-xs font-sans">Data Agendada *</Label>
              <Input
                type="datetime-local"
                value={newVisit.scheduled_date}
                onChange={e => setNewVisit({ ...newVisit, scheduled_date: e.target.value })}
                className="bg-ivory border-line text-ink mt-1"
              />
            </div>
            <div>
              <Label className="text-olive text-xs font-sans">Descrição</Label>
              <Textarea
                value={newVisit.description}
                onChange={e => setNewVisit({ ...newVisit, description: e.target.value })}
                rows={2}
                className="bg-ivory border-line text-ink mt-1"
              />
            </div>
            <div>
              <Label className="text-olive text-xs font-sans">Projeto</Label>
              <Select value={newVisit.project_id} onValueChange={v => setNewVisit({ ...newVisit, project_id: v })}>
                <SelectTrigger className="bg-ivory border-line text-ink mt-1">
                  <SelectValue placeholder="Selecionar..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Sem projeto</SelectItem>
                  {projects.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setVisitDialogOpen(false)} className="border-line text-ink">Cancelar</Button>
            <Button onClick={handleCreateVisit} className="bg-ink text-ivory hover:bg-ink/90">Agendar Visita</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
