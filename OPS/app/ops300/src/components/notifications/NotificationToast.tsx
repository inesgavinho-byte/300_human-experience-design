import { useState, useEffect } from 'react';
import { useNotifications } from '@/hooks/useNotifications';
import { AlertTriangle, X, Bell, Wrench } from 'lucide-react';

export default function NotificationToast() {
  const { urgentTasks, urgentTickets, permission, requestPermission } = useNotifications(60000);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [showPermissionPrompt, setShowPermissionPrompt] = useState(false);

  useEffect(() => {
    if (permission === 'default' && (urgentTasks.length > 0 || urgentTickets.length > 0)) {
      setShowPermissionPrompt(true);
    }
  }, [permission, urgentTasks.length, urgentTickets.length]);

  const visibleTasks = urgentTasks.filter(t => !dismissed.has(t.id)).slice(0, 3);
  const visibleTickets = urgentTickets.filter(t => !dismissed.has(t.id)).slice(0, 3);

  const handleDismiss = (id: string) => {
    setDismissed(prev => new Set(prev).add(id));
  };

  const handleDismissPermission = () => {
    setShowPermissionPrompt(false);
  };

  if (visibleTasks.length === 0 && visibleTickets.length === 0 && !showPermissionPrompt) return null;

  return (
    <div className="fixed top-4 right-4 z-[60] space-y-2 max-w-sm">
      {/* Permission prompt */}
      {showPermissionPrompt && (
        <div className="bg-ink text-ivory rounded-lg shadow-lg p-4 animate-in slide-in-from-right">
          <div className="flex items-start gap-3">
            <Bell size={18} className="mt-0.5 shrink-0" strokeWidth={1.5} />
            <div className="flex-1">
              <p className="text-sm font-medium">Ativar notificações?</p>
              <p className="text-xs text-olive mt-1">
                Receba alertas para tarefas urgentes, críticas e manutenção em tempo real.
              </p>
              <div className="flex gap-2 mt-3">
                <button
                  onClick={requestPermission}
                  className="px-3 py-1.5 bg-ivory text-ink text-xs rounded-md font-medium hover:bg-white transition-colors"
                >
                  Ativar
                </button>
                <button
                  onClick={handleDismissPermission}
                  className="px-3 py-1.5 text-olive text-xs hover:text-ivory transition-colors"
                >
                  Agora não
                </button>
              </div>
            </div>
            <button onClick={handleDismissPermission} className="text-olive hover:text-ivory">
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Urgent task toasts */}
      {visibleTasks.map(task => (
        <div
          key={task.id}
          className={`rounded-lg shadow-lg p-4 animate-in slide-in-from-right ${
            task.priority === 'critical'
              ? 'bg-red-50 border border-red-200 text-red-900'
              : 'bg-amber-50 border border-amber-200 text-amber-900'
          }`}
        >
          <div className="flex items-start gap-3">
            <AlertTriangle
              size={16}
              className={`mt-0.5 shrink-0 ${task.priority === 'critical' ? 'text-red-600' : 'text-amber-600'}`}
              strokeWidth={1.5}
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{task.title}</p>
              <p className="text-xs mt-0.5 opacity-80">
                {task.daysUntilDue !== null
                  ? task.daysUntilDue <= 0
                    ? 'VENCIDA'
                    : `Vence em ${task.daysUntilDue} dia${task.daysUntilDue > 1 ? 's' : ''}`
                  : 'Sem prazo'}
                {task.projectName ? ` · ${task.projectName}` : ''}
              </p>
            </div>
            <button
              onClick={() => handleDismiss(task.id)}
              className="text-olive hover:text-ink shrink-0"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      ))}

      {/* Urgent maintenance ticket toasts */}
      {visibleTickets.map(ticket => (
        <div
          key={ticket.id}
          className={`rounded-lg shadow-lg p-4 animate-in slide-in-from-right ${
            ticket.severity === 'critical'
              ? 'bg-red-50 border border-red-200 text-red-900'
              : 'bg-orange-50 border border-orange-200 text-orange-900'
          }`}
        >
          <div className="flex items-start gap-3">
            <Wrench
              size={16}
              className={`mt-0.5 shrink-0 ${ticket.severity === 'critical' ? 'text-red-600' : 'text-orange-600'}`}
              strokeWidth={1.5}
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{ticket.title}</p>
              <p className="text-xs mt-0.5 opacity-80">
                Manutenção {ticket.severity === 'critical' ? 'Crítica' : 'Alta'}
                {ticket.projectName ? ` · ${ticket.projectName}` : ''}
              </p>
            </div>
            <button
              onClick={() => handleDismiss(ticket.id)}
              className="text-olive hover:text-ink shrink-0"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
