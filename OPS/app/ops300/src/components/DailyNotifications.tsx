import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Bell, Calendar, Wrench, Package, CircleDollarSign, FolderOpen, Check } from 'lucide-react';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'visit' | 'procurement' | 'invoice' | 'project';
  date: string;
  read: boolean;
  created_at: string;
}

const TYPE_ICON: Record<string, React.ElementType> = {
  visit: Wrench,
  procurement: Package,
  invoice: CircleDollarSign,
  project: FolderOpen,
};

export default function DailyNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetchNotifications();

    // Atualizar a cada 5 minutos
    const interval = setInterval(fetchNotifications, 300000);
    return () => clearInterval(interval);
  }, []);

  async function fetchNotifications() {
    const today = new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .gte('date', today)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) return;

    setNotifications(data || []);
    setUnreadCount((data || []).filter(n => !n.read).length);
  }

  async function markAsRead(id: string) {
    await supabase.from('notifications').update({ read: true }).eq('id', id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));
  }

  async function markAllAsRead() {
    const unreadIds = notifications.filter(n => !n.read).map(n => n.id);
    if (unreadIds.length === 0) return;

    await supabase.from('notifications').update({ read: true }).in('id', unreadIds);
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  }

  return (
    <div className="relative">
      {/* Botão de notificações */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-md hover:bg-line/40 transition-colors"
        aria-label="Notificações"
      >
        <Bell size={18} strokeWidth={1.5} className="text-ink" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[9px] font-medium rounded-full flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />

          <div className="absolute right-0 top-full mt-2 w-80 bg-ivory border border-line rounded-xl shadow-2xl z-50 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-line">
              <h3 className="font-serif text-sm text-ink">Notificações</h3>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-[10px] text-olive hover:text-ink transition-colors flex items-center gap-1"
                >
                  <Check size={10} /> Marcar todas lidas
                </button>
              )}
            </div>

            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="px-4 py-8 text-center">
                  <Bell size={20} className="text-olive/30 mx-auto mb-2" />
                  <p className="text-xs text-olive font-sans">Sem notificações</p>
                </div>
              ) : (
                notifications.map(n => {
                  const Icon = TYPE_ICON[n.type] || Calendar;
                  return (
                    <div
                      key={n.id}
                      className={`px-4 py-3 border-b border-line/50 hover:bg-line/20 transition-colors ${
                        !n.read ? 'bg-line/10' : ''
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <Icon size={14} strokeWidth={1.5} className="text-olive mt-0.5 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-sans text-ink truncate">{n.title}</p>
                          <p className="text-[10px] text-olive font-sans truncate">{n.message}</p>
                          <p className="text-[9px] text-olive/50 font-sans mt-0.5">
                            {new Date(n.created_at).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                        {!n.read && (
                          <button
                            onClick={() => markAsRead(n.id)}
                            className="shrink-0 w-2 h-2 bg-ink rounded-full mt-1.5"
                            title="Marcar como lida"
                          />
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="px-4 py-2 border-t border-line bg-line/10">
              <a
                href="/calendario"
                className="text-[10px] text-ink font-sans hover:underline flex items-center gap-1"
                onClick={() => setIsOpen(false)}
              >
                <Calendar size={10} /> Ver Calendário
              </a>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
