import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import {
  Bell, Mail, Send, Wrench, Package, CircleDollarSign, FolderOpen,
  Sun, Moon, AlertTriangle,
} from 'lucide-react';

interface NotificationPrefs {
  notify_email: boolean;
  notify_telegram: boolean;
  notify_visit: boolean;
  notify_procurement: boolean;
  notify_invoice: boolean;
  notify_project: boolean;
  notify_morning: boolean;
  notify_evening: boolean;
  telegram_chat_id: string | null;
}

const DEFAULT_PREFS: NotificationPrefs = {
  notify_email: true,
  notify_telegram: false,
  notify_visit: true,
  notify_procurement: true,
  notify_invoice: true,
  notify_project: true,
  notify_morning: true,
  notify_evening: true,
  telegram_chat_id: null,
};

export default function NotificationSettings() {
  const [prefs, setPrefs] = useState<NotificationPrefs>(DEFAULT_PREFS);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchPrefs();
  }, []);

  async function fetchPrefs() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('profiles')
        .select('notify_email, notify_telegram, notify_visit, notify_procurement, notify_invoice, notify_project, notify_morning, notify_evening, telegram_chat_id')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      if (data) setPrefs({ ...DEFAULT_PREFS, ...data });
    } catch (err: any) {
      toast.error('Erro ao carregar preferências');
    } finally {
      setIsLoading(false);
    }
  }

  async function savePrefs() {
    try {
      setIsSaving(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('profiles')
        .update({
          notify_email: prefs.notify_email,
          notify_telegram: prefs.notify_telegram,
          notify_visit: prefs.notify_visit,
          notify_procurement: prefs.notify_procurement,
          notify_invoice: prefs.notify_invoice,
          notify_project: prefs.notify_project,
          notify_morning: prefs.notify_morning,
          notify_evening: prefs.notify_evening,
          telegram_chat_id: prefs.telegram_chat_id,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) throw error;
      toast.success('Preferências guardadas');
    } catch (err: any) {
      toast.error('Erro ao guardar: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  }

  function toggle(key: keyof NotificationPrefs) {
    setPrefs(prev => ({ ...prev, [key]: !prev[key] }));
  }

  if (isLoading) {
    return (
      <div className="max-w-2xl space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-40" />
        <Skeleton className="h-40" />
      </div>
    );
  }

  const Toggle = ({ label, desc, checked, onChange, icon: Icon }: any) => (
    <div className="flex items-center justify-between py-3 border-b border-line/50 last:border-0">
      <div className="flex items-center gap-3">
        <Icon size={16} strokeWidth={1.5} className="text-olive shrink-0" />
        <div>
          <p className="text-sm font-sans text-ink">{label}</p>
          <p className="text-[10px] text-olive font-sans">{desc}</p>
        </div>
      </div>
      <button
        onClick={onChange}
        className={`relative w-10 h-5 rounded-full transition-colors ${checked ? 'bg-ink' : 'bg-line'}`}
        aria-label={label}
      >
        <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${checked ? 'translate-x-5' : ''}`} />
      </button>
    </div>
  );

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="font-serif text-3xl text-ink">Notificações</h1>
        <p className="text-olive text-sm mt-1 font-sans">Escolha o que e quando quer ser notificado</p>
      </div>

      {/* Canais */}
      <Card className="border-line bg-ivory">
        <CardHeader className="pb-2">
          <CardTitle className="font-serif text-base text-ink flex items-center gap-2">
            <Bell size={14} strokeWidth={1.5} />
            Canais
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-0">
          <Toggle
            label="Email"
            desc="Receber notificações por email"
            checked={prefs.notify_email}
            onChange={() => toggle('notify_email')}
            icon={Mail}
          />
          <Toggle
            label="Telegram"
            desc="Receber notificações no Telegram"
            checked={prefs.notify_telegram}
            onChange={() => toggle('notify_telegram')}
            icon={Send}
          />
          {prefs.notify_telegram && (
            <div className="py-2 pl-8">
              <label className="text-[10px] text-olive font-sans uppercase tracking-wider">Chat ID do Telegram</label>
              <input
                type="text"
                value={prefs.telegram_chat_id || ''}
                onChange={e => setPrefs(prev => ({ ...prev, telegram_chat_id: e.target.value }))}
                placeholder="ex: 123456789"
                className="mt-1 w-full px-3 py-2 text-sm font-sans border border-line rounded-md bg-white text-ink placeholder:text-olive/40 focus:outline-none focus:ring-1 focus:ring-ink"
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tipos de evento */}
      <Card className="border-line bg-ivory">
        <CardHeader className="pb-2">
          <CardTitle className="font-serif text-base text-ink flex items-center gap-2">
            <FolderOpen size={14} strokeWidth={1.5} />
            Tipos de Evento
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-0">
          <Toggle
            label="Visitas de Manutenção"
            desc="Preventivas, corretivas, commissioning"
            checked={prefs.notify_visit}
            onChange={() => toggle('notify_visit')}
            icon={Wrench}
          />
          <Toggle
            label="Entregas / Procurement"
            desc="Equipamentos, materiais, stock"
            checked={prefs.notify_procurement}
            onChange={() => toggle('notify_procurement')}
            icon={Package}
          />
          <Toggle
            label="Faturas"
            desc="Vencimentos, pagamentos, cobranças"
            checked={prefs.notify_invoice}
            onChange={() => toggle('notify_invoice')}
            icon={CircleDollarSign}
          />
          <Toggle
            label="Projetos"
            desc="Inícios, entregas, milestones"
            checked={prefs.notify_project}
            onChange={() => toggle('notify_project')}
            icon={FolderOpen}
          />
        </CardContent>
      </Card>

      {/* Horários */}
      <Card className="border-line bg-ivory">
        <CardHeader className="pb-2">
          <CardTitle className="font-serif text-base text-ink flex items-center gap-2">
            <Sun size={14} strokeWidth={1.5} />
            Horários
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-0">
          <Toggle
            label="Manhã — 08:00"
            desc="Resumo diário ao início do dia"
            checked={prefs.notify_morning}
            onChange={() => toggle('notify_morning')}
            icon={Sun}
          />
          <Toggle
            label="Tarde — 18:00"
            desc="Alerta de eventos pendentes ao fim do dia"
            checked={prefs.notify_evening}
            onChange={() => toggle('notify_evening')}
            icon={Moon}
          />
        </CardContent>
      </Card>

      {/* Aviso */}
      <div className="flex items-start gap-2 text-xs text-olive bg-amber-50 border border-amber-200 rounded-md p-3">
        <AlertTriangle size={14} className="text-amber-600 mt-0.5 shrink-0" />
        <p className="font-sans">
          As alterações aplicam-se a partir da próxima notificação agendada.
          Para receber no Telegram, configure o seu Chat ID e inicie uma conversa com o bot.
        </p>
      </div>

      {/* Botão guardar */}
      <div className="flex justify-end">
        <Button onClick={savePrefs} disabled={isSaving} className="bg-ink text-ivory hover:bg-ink/90 font-sans">
          {isSaving ? 'A guardar...' : 'Guardar Preferências'}
        </Button>
      </div>
    </div>
  );
}
