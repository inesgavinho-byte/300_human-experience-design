import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { showNotification, getNotificationPermission } from '@/lib/notifications';
import { playCriticalSound } from '@/lib/sounds';
import { sendSlackAlert } from '@/lib/slack';
import { sendTelegramAlert } from '@/lib/telegram';
import { toast } from 'sonner';

interface UrgentTask {
  id: string;
  title: string;
  priority: string;
  due_date: string | null;
  projectName: string | null;
  daysUntilDue: number | null;
}

interface UrgentTicket {
  id: string;
  title: string;
  severity: string;
  status: string;
  projectName: string | null;
}

interface UseNotificationsReturn {
  urgentCount: number;
  urgentTasks: UrgentTask[];
  urgentTickets: UrgentTicket[];
  permission: NotificationPermission;
  requestPermission: () => Promise<void>;
  lastChecked: Date | null;
}

function isSlackEnabled(): boolean {
  const stored = localStorage.getItem('300-slack-enabled');
  return stored === 'true';
}

function isTelegramEnabled(): boolean {
  const stored = localStorage.getItem('300-telegram-enabled');
  return stored === 'true';
}

export function useNotifications(checkInterval = 60000): UseNotificationsReturn {
  const [urgentCount, setUrgentCount] = useState(0);
  const [urgentTasks, setUrgentTasks] = useState<UrgentTask[]>([]);
  const [urgentTickets, setUrgentTickets] = useState<UrgentTicket[]>([]);
  const [permission, setPermission] = useState<NotificationPermission>(getNotificationPermission());
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const notifiedIds = useRef<Set<string>>(new Set());

  const fetchUrgentTasks = useCallback(async () => {
    try {
      const now = new Date();
      const threeDaysFromNow = new Date(now);
      threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

      // Fetch urgent tasks and maintenance tickets in parallel
      const [taskResult, ticketResult] = await Promise.all([
        supabase
          .from('tasks')
          .select(`
            id,
            title,
            priority,
            due_date,
            status,
            projects:project_id(name)
          `)
          .in('priority', ['high', 'critical'])
          .not('status', 'eq', 'done')
          .or(`due_date.is.null,due_date.lte.${threeDaysFromNow.toISOString()}`),
        supabase
          .from('maintenance_tickets')
          .select(`
            id,
            title,
            severity,
            status,
            projects:project_id(name)
          `)
          .in('severity', ['critical', 'high'])
          .in('status', ['open', 'in_progress']),
      ]);

      if (taskResult.error) throw taskResult.error;
      if (ticketResult.error) throw ticketResult.error;

      const tasks = (taskResult.data || []) as unknown as Array<{
        id: string;
        title: string;
        priority: string;
        due_date: string | null;
        status: string;
        projects: { name: string } | null;
      }>;

      const tickets = (ticketResult.data || []) as unknown as Array<{
        id: string;
        title: string;
        severity: string;
        status: string;
        projects: { name: string } | null;
      }>;

      const urgentTaskList: UrgentTask[] = tasks.map(t => {
        const daysUntilDue = t.due_date
          ? Math.ceil((new Date(t.due_date).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
          : null;
        return {
          id: t.id,
          title: t.title,
          priority: t.priority,
          due_date: t.due_date,
          projectName: t.projects?.name || null,
          daysUntilDue,
        };
      });

      const urgentTicketList: UrgentTicket[] = tickets.map(t => ({
        id: t.id,
        title: t.title,
        severity: t.severity,
        status: t.status,
        projectName: t.projects?.name || null,
      }));

      setUrgentTasks(urgentTaskList);
      setUrgentTickets(urgentTicketList);
      setUrgentCount(urgentTaskList.length + urgentTicketList.length);
      setLastChecked(now);

      // Show browser notifications, sound, toast and slack for new urgent tasks
      if (permission === 'granted') {
        urgentTaskList.forEach(task => {
          if (!notifiedIds.current.has(`task-${task.id}`)) {
            notifiedIds.current.add(`task-${task.id}`);
            const dueText = task.daysUntilDue !== null
              ? task.daysUntilDue <= 0
                ? 'VENCIDA'
                : task.daysUntilDue === 1
                  ? 'vence amanhã'
                  : `vence em ${task.daysUntilDue} dias`
              : 'sem prazo definido';

            showNotification(`300 OPS · Tarefa ${task.priority === 'critical' ? 'Crítica' : 'Urgente'}`, {
              body: `${task.title} ${dueText}${task.projectName ? ` · ${task.projectName}` : ''}`,
              tag: `task-${task.id}`,
              requireInteraction: task.priority === 'critical',
            });

            if (task.priority === 'critical') {
              playCriticalSound();
              toast.error(`Tarefa crítica: ${task.title}`, {
                description: dueText,
                duration: 6000,
              });
              if (isSlackEnabled()) {
                void sendSlackAlert(
                  `*Tarefa Crítica*\n>${task.title}\n>${dueText}${task.projectName ? `\n>Projeto: ${task.projectName}` : ''}`
                );
              }
              if (isTelegramEnabled()) {
                void sendTelegramAlert(
                  `<b>300 OPS · Tarefa Crítica</b>\n\n${task.title}\n${dueText}${task.projectName ? `\nProjeto: ${task.projectName}` : ''}`,
                  { parse_mode: 'HTML' }
                );
              }
            }
          }
        });

        // Show browser notifications, sound, toast and slack for new critical tickets
        urgentTicketList.forEach(ticket => {
          if (!notifiedIds.current.has(`ticket-${ticket.id}`)) {
            notifiedIds.current.add(`ticket-${ticket.id}`);

            showNotification(
              `300 OPS · Manutenção ${ticket.severity === 'critical' ? 'Crítica' : 'Alta'}`,
              {
                body: `${ticket.title}${ticket.projectName ? ` · ${ticket.projectName}` : ''}`,
                tag: `ticket-${ticket.id}`,
                requireInteraction: ticket.severity === 'critical',
              }
            );

            if (ticket.severity === 'critical') {
              playCriticalSound();
              toast.error(`Manutenção crítica: ${ticket.title}`, {
                description: `Status: ${ticket.status}`,
                duration: 6000,
              });
              if (isSlackEnabled()) {
                void sendSlackAlert(
                  `*Manutenção Crítica*\n>${ticket.title}\n>Status: ${ticket.status}${ticket.projectName ? `\n>Projeto: ${ticket.projectName}` : ''}`
                );
              }
              if (isTelegramEnabled()) {
                void sendTelegramAlert(
                  `<b>300 OPS · Manutenção Crítica</b>\n\n${ticket.title}\nStatus: ${ticket.status}${ticket.projectName ? `\nProjeto: ${ticket.projectName}` : ''}`,
                  { parse_mode: 'HTML' }
                );
              }
            }
          }
        });
      }
    } catch (err) {
      console.error('Error fetching urgent tasks:', err);
    }
  }, [permission]);

  const requestPermission = useCallback(async () => {
    const { requestNotificationPermission } = await import('@/lib/notifications');
    const result = await requestNotificationPermission();
    setPermission(result);
    if (result === 'granted') {
      await fetchUrgentTasks();
    }
  }, [fetchUrgentTasks]);

  useEffect(() => {
    fetchUrgentTasks();

    const intervalId = setInterval(fetchUrgentTasks, checkInterval);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchUrgentTasks();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [fetchUrgentTasks, checkInterval]);

  return {
    urgentCount,
    urgentTasks,
    urgentTickets,
    permission,
    requestPermission,
    lastChecked,
  };
}
