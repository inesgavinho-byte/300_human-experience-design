import { useState, useRef, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Bell, X, AlertTriangle, Wrench, Clock, BellOff } from 'lucide-react';

interface NotificationItem {
  id: string;
  type: 'task' | 'ticket';
  title: string;
  subtitle: string;
  priority: string;
  dueText?: string;
  projectName?: string | null;
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastCount, setLastCount] = useState(0);
  const panelRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  async function fetchNotifications() {
    setLoading(true);
    try {
      const now = new Date();
      const threeDaysFromNow = new Date(now);
      threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

      const [taskResult, ticketResult] = await Promise.all([
        supabase
          .from('tasks')
          .select('id, title, priority, due_date, status, projects:project_id(name)')
          .in('priority', ['high', 'critical'])
          .not('status', 'eq', 'done')
          .or(`due_date.is.null,due_date.lte.${threeDaysFromNow.toISOString()}`),
        supabase
          .from('maintenance_tickets')
          .select('id, title, severity, status, projects:project_id(name)')
          .in('severity', ['critical', 'high'])
          .in('status', ['open', 'in_progress']),
      ]);

      const taskData = (taskResult.data || []) as unknown as Array<{
        id: string; title: string; priority: string; due_date: string | null;
        status: string; projects: { name: string } | null;
      }>;

      const ticketData = (ticketResult.data || []) as unknown as Array<{
        id: string; title: string; severity: string; status: string;
        projects: { name: string } | null;
      }>;

      const taskItems: NotificationItem[] = taskData.map(t => {
        const daysUntilDue = t.due_date
          ? Math.ceil((new Date(t.due_date).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
          : null;
        const dueText = daysUntilDue !== null
          ? daysUntilDue <= 0
            ? 'VENCIDA'
            : daysUntilDue === 1
              ? 'vence amanhã'
              : `vence em ${daysUntilDue} dias`
          : 'sem prazo';

        return {
          id: `task-${t.id}`,
          type: 'task',
          title: t.title,
          subtitle: dueText,
          priority: t.priority,
          dueText,
          projectName: t.projects?.name,
        };
      });

      const ticketItems: NotificationItem[] = ticketData.map(t => ({
        id: `ticket-${t.id}`,
        type: 'ticket',
        title: t.title,
        subtitle: `Manutenção ${t.severity === 'critical' ? 'Crítica' : 'Alta'}`,
        priority: t.severity,
        projectName: t.projects?.name,
      }));

      const all = [...taskItems, ...ticketItems];
      setItems(all);
      setLastCount(all.length);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  }

  function handleOpen() {
    const willOpen = !open;
    setOpen(willOpen);
    if (willOpen) {
      fetchNotifications();
    }
  }

  const criticalCount = items.filter(i => i.priority === 'critical').length;
  const highCount = items.filter(i => i.priority === 'high').length;

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={handleOpen}
        className="relative p-2 rounded-md hover:bg-line/40 transition-colors"
        aria-label="Notificações"
      >
        <Bell size={16} strokeWidth={1.5} className="text-ink" />
        {lastCount > 0 && (
          <span className={`absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full text-[9px] font-medium flex items-center justify-center ${
            criticalCount > 0 ? 'bg-red-600 text-white' : 'bg-amber-500 text-white'
          }`}>
            {lastCount > 9 ? '9+' : lastCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-ivory border border-line rounded-lg shadow-lg z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-line">
            <h3 className="text-sm font-medium text-ink font-sans">Notificações</h3>
            <button
              onClick={() => setOpen(false)}
              className="p-1 rounded hover:bg-line/40 transition-colors"
            >
              <X size={14} className="text-olive" strokeWidth={1.5} />
            </button>
          </div>

          {/* Content */}
          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <div className="p-6 text-center">
                <div className="animate-spin w-5 h-5 border-2 border-ink border-t-transparent rounded-full mx-auto" />
                <p className="text-xs text-olive font-sans mt-2">A carregar...</p>
              </div>
            ) : items.length === 0 ? (
              <div className="p-6 text-center">
                <BellOff size={20} className="mx-auto text-olive/40 mb-2" strokeWidth={1.5} />
                <p className="text-sm text-olive font-sans">Sem notificações urgentes</p>
                <p className="text-[11px] text-olive/60 font-sans mt-0.5">
                  Tarefas críticas e tickets de manutenção aparecem aqui.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-line/50">
                {items.map(item => {
                  const isCritical = item.priority === 'critical';
                  return (
                    <div
                      key={item.id}
                      className={`px-4 py-3 hover:bg-line/20 transition-colors ${
                        isCritical ? 'border-l-2 border-l-red-500' : 'border-l-2 border-l-amber-500'
                      }`}
                    >
                      <div className="flex items-start gap-2.5">
                        {item.type === 'task' ? (
                          <Clock size={14} className={`mt-0.5 shrink-0 ${isCritical ? 'text-red-500' : 'text-amber-500'}`} strokeWidth={1.5} />
                        ) : (
                          <Wrench size={14} className={`mt-0.5 shrink-0 ${isCritical ? 'text-red-500' : 'text-amber-500'}`} strokeWidth={1.5} />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-ink font-sans truncate">{item.title}</p>
                          <p className="text-[11px] text-olive font-sans mt-0.5">
                            {item.subtitle}
                            {item.projectName ? ` · ${item.projectName}` : ''}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          {items.length > 0 && (
            <div className="px-4 py-2 border-t border-line bg-line/10">
              <div className="flex items-center gap-1 text-[10px] text-olive font-sans">
                <AlertTriangle size={10} strokeWidth={1.5} />
                <span>
                  {criticalCount > 0 && `${criticalCount} crítica${criticalCount > 1 ? 's' : ''}`}
                  {criticalCount > 0 && highCount > 0 && ' · '}
                  {highCount > 0 && `${highCount} alta${highCount > 1 ? 's' : ''}`}
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
