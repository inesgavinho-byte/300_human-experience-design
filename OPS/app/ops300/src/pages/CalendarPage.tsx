import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { useGoogleCalendar } from '@/hooks/useGoogleCalendar';
import {
  ChevronLeft, ChevronRight, Calendar as CalendarIcon,
  Wrench, Package, CircleDollarSign, FolderOpen, Clock,
  AlertTriangle, MapPin, LogIn, LogOut, ExternalLink,
} from 'lucide-react';
import { toast } from 'sonner';

interface CalendarEvent {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  type: 'visit' | 'procurement' | 'invoice' | 'project';
  color: string;
  details?: string;
  projectName?: string;
  status?: string;
}

const TYPE_CONFIG: Record<CalendarEvent['type'], { label: string; color: string; bg: string; icon: React.ElementType }> = {
  visit:       { label: 'Visita',       color: 'text-emerald-700', bg: 'bg-emerald-100', icon: Wrench },
  procurement: { label: 'Entrega',      color: 'text-blue-700',    bg: 'bg-blue-100',    icon: Package },
  invoice:     { label: 'Fatura',       color: 'text-amber-700',   bg: 'bg-amber-100',   icon: CircleDollarSign },
  project:     { label: 'Projeto',      color: 'text-purple-700',  bg: 'bg-purple-100',  icon: FolderOpen },
};

/* ═════════════════════════════════════════════
   CALENDAR — Integrated ops timeline
   ═════════════════════════════════════════════ */
export default function CalendarPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [activeFilters, setActiveFilters] = useState<Set<CalendarEvent['type']>>(new Set(['visit', 'procurement', 'invoice', 'project']));
  const { isSignedIn, googleEvents, signIn, signOut, createGoogleEvent } = useGoogleCalendar();

  /* ─── Fetch all date-relevant data ─── */
  useEffect(() => {
    async function fetchData() {
      try {
        setIsLoading(true);
        setError('');
        const [visitsRes, procRes, invoicesRes, projectsRes] = await Promise.all([
          supabase.from('maintenance_visits').select('id, scheduled_date, type, description, status, project_id').not('scheduled_date', 'is', null),
          supabase.from('procurement_tasks').select('id, due_date, title, status, project_id').not('due_date', 'is', null),
          supabase.from('invoices').select('id, due_date, number, amount, status, project_id').not('due_date', 'is', null),
          supabase.from('projects').select('id, name, start_date, end_date, status'),
        ]);

        if (visitsRes.error) throw visitsRes.error;
        if (procRes.error) throw procRes.error;
        if (invoicesRes.error) throw invoicesRes.error;
        if (projectsRes.error) throw projectsRes.error;

        const projectMap = new Map((projectsRes.data || []).map(p => [p.id, p.name]));

        const allEvents: CalendarEvent[] = [
          ...(visitsRes.data || []).map((v: any) => ({
            id: `v-${v.id}`,
            title: v.type === 'preventive' ? 'Visita Preventiva' : v.type === 'corrective' ? 'Visita Corretiva' : 'Visita',
            date: v.scheduled_date!.split('T')[0],
            type: 'visit' as const,
            color: 'emerald',
            details: v.description || '',
            projectName: projectMap.get(v.project_id) || undefined,
            status: v.status || undefined,
          })),
          ...(procRes.data || []).map((t: any) => ({
            id: `p-${t.id}`,
            title: t.title,
            date: t.due_date!.split('T')[0],
            type: 'procurement' as const,
            color: 'blue',
            details: t.status || '',
            projectName: projectMap.get(t.project_id) || undefined,
            status: t.status || undefined,
          })),
          ...(invoicesRes.data || []).map((i: any) => ({
            id: `i-${i.id}`,
            title: `Fatura ${i.number}`,
            date: i.due_date!.split('T')[0],
            type: 'invoice' as const,
            color: 'amber',
            details: `${(i.amount || 0).toLocaleString('pt-PT')}€ · ${i.status || ''}`,
            projectName: projectMap.get(i.project_id) || undefined,
            status: i.status || undefined,
          })),
          ...(projectsRes.data || []).flatMap((p: any) => {
            const items: CalendarEvent[] = [];
            if (p.start_date) {
              items.push({
                id: `pr-s-${p.id}`,
                title: `Início: ${p.name}`,
                date: p.start_date.split('T')[0],
                type: 'project' as const,
                color: 'purple',
                details: p.status || '',
                projectName: p.name,
              });
            }
            if (p.end_date) {
              items.push({
                id: `pr-e-${p.id}`,
                title: `Entrega: ${p.name}`,
                date: p.end_date.split('T')[0],
                type: 'project' as const,
                color: 'purple',
                details: p.status || '',
                projectName: p.name,
              });
            }
            return items;
          }),
        ];

        setEvents(allEvents);
      } catch (err: any) {
        setError(err.message || 'Erro ao carregar calendário');
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, []);

  /* ─── Calendar grid helpers ─── */
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const monthName = currentDate.toLocaleDateString('pt-PT', { month: 'long', year: 'numeric' });

  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const startDay = firstDayOfMonth.getDay(); // 0 = Sun
  const daysInMonth = lastDayOfMonth.getDate();

  const filteredEvents = useMemo(() =>
    events.filter(e => activeFilters.has(e.type)),
    [events, activeFilters]
  );

  function getEventsForDay(day: number): CalendarEvent[] {
    const dayStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const localEvents = filteredEvents.filter(e => e.date === dayStr);
    const googleDayEvents = googleEvents
      .filter(ge => {
        const date = ge.start?.date || ge.start?.dateTime?.split('T')[0];
        return date === dayStr;
      })
      .map(ge => ({
        id: `g-${ge.id}`,
        title: ge.summary,
        date: dayStr,
        type: 'project' as const,
        color: 'purple',
        details: ge.description || 'Google Calendar',
        projectName: 'Google Calendar',
      }));
    return [...localEvents, ...googleDayEvents].sort((a, b) => a.type.localeCompare(b.type));
  }

  const isToday = (day: number) => {
    const t = new Date();
    return t.getFullYear() === year && t.getMonth() === month && t.getDate() === day;
  };

  const isPast = (day: number) => {
    const t = new Date(); t.setHours(0, 0, 0, 0);
    const d = new Date(year, month, day);
    return d < t;
  };

  /* ─── Upcoming events sidebar ─── */
  const upcomingEvents = useMemo(() => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    return filteredEvents
      .filter(e => new Date(e.date) >= today)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 10);
  }, [filteredEvents]);

  const overdueCount = filteredEvents.filter(e => {
    if (e.type === 'invoice') return e.status !== 'paga' && new Date(e.date) < new Date();
    if (e.type === 'procurement') return e.status !== 'done' && new Date(e.date) < new Date();
    return false;
  }).length;

  /* ─── Toggle filter ─── */
  function toggleFilter(type: CalendarEvent['type']) {
    setActiveFilters(prev => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <Skeleton className="h-[520px] lg:col-span-3" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <h1 className="font-serif text-3xl text-ink">Calendário</h1>
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
          <h1 className="font-serif text-3xl text-ink">Calendário</h1>
          <p className="text-olive text-sm mt-1 font-sans">Visão integrada de visitas, entregas, faturas e projetos</p>
        </div>
        <div className="flex items-center gap-2">
          {isSignedIn ? (
            <Button variant="ghost" size="sm" onClick={signOut} className="text-olive font-sans text-xs flex items-center gap-1">
              <LogOut size={12} /> Google
            </Button>
          ) : (
            <Button variant="ghost" size="sm" onClick={signIn} className="text-olive font-sans text-xs flex items-center gap-1">
              <LogIn size={12} /> Ligar Google Calendar
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => setCurrentDate(d => { const n = new Date(d); n.setMonth(n.getMonth() - 1); return n; })} className="border-line text-ink">
            <ChevronLeft size={16} />
          </Button>
          <span className="font-serif text-lg text-ink min-w-[180px] text-center capitalize">{monthName}</span>
          <Button variant="outline" size="sm" onClick={() => setCurrentDate(d => { const n = new Date(d); n.setMonth(n.getMonth() + 1); return n; })} className="border-line text-ink">
            <ChevronRight size={16} />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setCurrentDate(new Date())} className="text-olive font-sans text-xs">
            Hoje
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {(Object.keys(TYPE_CONFIG) as CalendarEvent['type'][]).map(type => {
          const cfg = TYPE_CONFIG[type];
          const active = activeFilters.has(type);
          return (
            <button
              key={type}
              onClick={() => toggleFilter(type)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-sans border transition-colors ${
                active ? `${cfg.bg} ${cfg.color} border-transparent` : 'border-line text-olive bg-ivory opacity-50'
              }`}
            >
              <cfg.icon size={12} strokeWidth={1.5} />
              {cfg.label}
            </button>
          );
        })}
        {overdueCount > 0 && (
          <span className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-sans bg-red-50 text-red-700 border border-red-200">
            <Clock size={12} /> {overdueCount} em atraso
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* ─── Calendar Grid ─── */}
        <Card className="border-line bg-ivory lg:col-span-3">
          <CardContent className="p-4">
            {/* Weekday headers */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(d => (
                <div key={d} className="text-center text-[10px] uppercase tracking-wider text-olive font-sans py-1">{d}</div>
              ))}
            </div>

            {/* Days grid */}
            <div className="grid grid-cols-7 gap-1">
              {/* Empty cells before first day */}
              {Array.from({ length: startDay }).map((_, i) => (
                <div key={`empty-${i}`} className="h-24 rounded-md bg-line/10" />
              ))}

              {/* Day cells */}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const dayEvents = getEventsForDay(day);
                const today = isToday(day);
                const past = isPast(day);
                return (
                  <div
                    key={day}
                    className={`h-24 rounded-md border p-1.5 transition-colors cursor-pointer ${
                      today ? 'border-ink bg-ink/5' : past ? 'border-line/40 bg-line/5' : 'border-line bg-ivory hover:bg-line/10'
                    }`}
                    onClick={() => dayEvents.length > 0 && setSelectedEvent(dayEvents[0])}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-xs font-sans font-medium ${today ? 'text-ink bg-ink text-ivory w-5 h-5 rounded-full flex items-center justify-center' : past ? 'text-olive/50' : 'text-ink'}`}>
                        {day}
                      </span>
                      {dayEvents.length > 0 && (
                        <span className="text-[9px] text-olive font-sans">{dayEvents.length}</span>
                      )}
                    </div>
                    <div className="space-y-0.5">
                      {dayEvents.slice(0, 3).map(ev => {
                        const cfg = TYPE_CONFIG[ev.type];
                        return (
                          <div
                            key={ev.id}
                            className={`text-[9px] font-sans truncate px-1 py-0.5 rounded ${cfg.bg} ${cfg.color} cursor-pointer`}
                            onClick={e => { e.stopPropagation(); setSelectedEvent(ev); }}
                            title={ev.title}
                          >
                            {ev.title}
                          </div>
                        );
                      })}
                      {dayEvents.length > 3 && (
                        <div className="text-[9px] text-olive font-sans pl-1">+{dayEvents.length - 3} mais</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* ─── Sidebar: Upcoming ─── */}
        <div className="space-y-4">
          <Card className="border-line bg-ivory">
            <CardHeader className="pb-2">
              <CardTitle className="font-serif text-base text-ink flex items-center gap-2">
                <CalendarIcon size={14} strokeWidth={1.5} />
                Próximos Eventos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 max-h-[420px] overflow-y-auto">
              {upcomingEvents.length === 0 ? (
                <p className="text-xs text-olive font-sans">Sem eventos futuros.</p>
              ) : (
                upcomingEvents.map(ev => {
                  const cfg = TYPE_CONFIG[ev.type];
                  const isOverdue = new Date(ev.date) < new Date();
                  return (
                    <button
                      key={ev.id}
                      onClick={() => setSelectedEvent(ev)}
                      className="w-full text-left p-2.5 rounded-md border border-line bg-white hover:bg-line/20 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full shrink-0 ${cfg.bg.replace('bg-', 'bg-').replace('100', '500')}`} />
                        <span className="text-xs font-sans text-ink truncate flex-1">{ev.title}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-[10px] font-sans ${isOverdue ? 'text-red-600 font-medium' : 'text-olive'}`}>
                          {new Date(ev.date).toLocaleDateString('pt-PT', { day: 'numeric', month: 'short' })}
                        </span>
                        {ev.projectName && (
                          <span className="text-[10px] text-olive font-sans truncate flex items-center gap-0.5">
                            <MapPin size={8} /> {ev.projectName}
                          </span>
                        )}
                      </div>
                      {ev.details && (
                        <p className="text-[10px] text-olive/70 font-sans mt-0.5 truncate">{ev.details}</p>
                      )}
                    </button>
                  );
                })
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ─── Event Detail Modal ─── */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/30 backdrop-blur-sm" onClick={() => setSelectedEvent(null)}>
          <div className="bg-ivory border border-line rounded-xl shadow-2xl max-w-sm w-full p-5" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-2 mb-3">
              {(() => {
                const cfg = TYPE_CONFIG[selectedEvent.type];
                return <cfg.icon size={16} className={cfg.color} strokeWidth={1.5} />;
              })()}
              <span className="font-serif text-lg text-ink">{selectedEvent.title}</span>
            </div>
            <div className="space-y-2 text-sm font-sans">
              <div className="flex items-center gap-2">
                <CalendarIcon size={13} className="text-olive" />
                <span className="text-ink">{new Date(selectedEvent.date).toLocaleDateString('pt-PT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
              </div>
              {selectedEvent.projectName && (
                <div className="flex items-center gap-2">
                  <MapPin size={13} className="text-olive" />
                  <span className="text-ink">{selectedEvent.projectName}</span>
                </div>
              )}
              {selectedEvent.status && (
                <div className="flex items-center gap-2">
                  <Clock size={13} className="text-olive" />
                  <span className="text-ink">{selectedEvent.status}</span>
                </div>
              )}
              {selectedEvent.details && (
                <div className="pt-2 border-t border-line/50 mt-2">
                  <p className="text-xs text-olive font-sans">{selectedEvent.details}</p>
                </div>
              )}
            </div>
            <div className="mt-4 flex justify-between">
              {isSignedIn && selectedEvent && !selectedEvent.id.startsWith('g-') && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={async () => {
                    const res = await createGoogleEvent({
                      title: selectedEvent.title,
                      date: selectedEvent.date,
                      type: selectedEvent.type,
                      description: selectedEvent.details,
                      projectName: selectedEvent.projectName,
                    });
                    if (res.error) toast.error('Erro ao exportar: ' + res.error);
                    else toast.success('Evento exportado para Google Calendar');
                  }}
                  className="text-olive font-sans text-xs flex items-center gap-1"
                >
                  <ExternalLink size={12} /> Exportar Google
                </Button>
              )}
              <Button size="sm" variant="outline" onClick={() => setSelectedEvent(null)} className="border-line text-ink font-sans">
                Fechar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
