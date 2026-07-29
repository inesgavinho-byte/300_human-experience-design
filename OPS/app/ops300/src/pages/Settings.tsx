import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import {
  Settings as SettingsIcon,
  Users,
  FileText,
  Tag,
  BellRing,
  AlertTriangle,
  Volume2,
  MessageSquare,
  Mail,
  Send,
} from 'lucide-react';
import {
  getNotificationPermission,
  requestNotificationPermission,
  isNotificationSupported,
} from '@/lib/notifications';

export default function Settings() {
  const [notifPermission, setNotifPermission] = useState<string>('default');
  const [notifEnabled, setNotifEnabled] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [slackEnabled, setSlackEnabled] = useState(false);
  const [slackWebhookUrl, setSlackWebhookUrl] = useState('');
  const [resendApiKey, setResendApiKey] = useState('');
  const [telegramEnabled, setTelegramEnabled] = useState(false);
  const [telegramBotToken, setTelegramBotToken] = useState('');
  const [telegramChatId, setTelegramChatId] = useState('');

  useEffect(() => {
    setNotifPermission(getNotificationPermission());
    const savedNotif = localStorage.getItem('300-notifications-enabled');
    setNotifEnabled(savedNotif === 'true');
    const savedSound = localStorage.getItem('300-sound-enabled');
    setSoundEnabled(savedSound === null ? true : savedSound === 'true');
    const savedSlack = localStorage.getItem('300-slack-enabled');
    setSlackEnabled(savedSlack === 'true');
    setSlackWebhookUrl(localStorage.getItem('300-slack-webhook-url') || '');
    setResendApiKey(localStorage.getItem('300-resend-api-key') || '');
    const savedTelegram = localStorage.getItem('300-telegram-enabled');
    setTelegramEnabled(savedTelegram === 'true');
    setTelegramBotToken(localStorage.getItem('300-telegram-bot-token') || '');
    setTelegramChatId(localStorage.getItem('300-telegram-chat-id') || '');
  }, []);

  const handleToggleNotifications = async (enabled: boolean) => {
    setNotifEnabled(enabled);
    localStorage.setItem('300-notifications-enabled', String(enabled));
    if (enabled) {
      const perm = await requestNotificationPermission();
      setNotifPermission(perm);
    }
  };

  const handleToggleSound = (enabled: boolean) => {
    setSoundEnabled(enabled);
    localStorage.setItem('300-sound-enabled', String(enabled));
  };

  const handleToggleSlack = (enabled: boolean) => {
    setSlackEnabled(enabled);
    localStorage.setItem('300-slack-enabled', String(enabled));
  };

  const handleSlackUrlChange = (value: string) => {
    setSlackWebhookUrl(value);
    localStorage.setItem('300-slack-webhook-url', value);
  };

  const handleResendKeyChange = (value: string) => {
    setResendApiKey(value);
    localStorage.setItem('300-resend-api-key', value);
  };

  const handleToggleTelegram = (enabled: boolean) => {
    setTelegramEnabled(enabled);
    localStorage.setItem('300-telegram-enabled', String(enabled));
  };

  const handleTelegramTokenChange = (value: string) => {
    setTelegramBotToken(value);
    localStorage.setItem('300-telegram-bot-token', value);
  };

  const handleTelegramChatIdChange = (value: string) => {
    setTelegramChatId(value);
    localStorage.setItem('300-telegram-chat-id', value);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl text-ink">Configurações</h1>
        <p className="text-olive text-sm mt-1 font-sans">Preferências da plataforma 300</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Notifications Settings */}
        <Card className="border-line bg-ivory lg:col-span-2">
          <CardHeader>
            <CardTitle className="font-serif text-lg text-ink flex items-center gap-2">
              <BellRing size={16} strokeWidth={1.5} /> Notificações
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="notif-browser" className="text-sm text-ink font-sans">
                  Notificações do browser
                </Label>
                <p className="text-xs text-olive mt-0.5">
                  {notifPermission === 'granted'
                    ? 'Permissão concedida — receberá alertas para tarefas urgentes'
                    : notifPermission === 'denied'
                      ? 'Permissão negada — ative nas definições do browser'
                      : 'Clique para ativar notificações push'}
                </p>
              </div>
              <Switch
                id="notif-browser"
                checked={notifEnabled && notifPermission === 'granted'}
                onCheckedChange={handleToggleNotifications}
                disabled={!isNotificationSupported()}
              />
            </div>

            <Separator className="bg-line" />

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Volume2 size={16} className="text-olive" strokeWidth={1.5} />
                <div>
                  <Label htmlFor="notif-sound" className="text-sm text-ink font-sans">
                    Alertas sonoros
                  </Label>
                  <p className="text-xs text-olive mt-0.5">Tocar som para notificações críticas</p>
                </div>
              </div>
              <Switch
                id="notif-sound"
                checked={soundEnabled}
                onCheckedChange={handleToggleSound}
              />
            </div>

            <Separator className="bg-line" />

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="notif-critical" className="text-sm text-ink font-sans">
                  Apenas tarefas críticas
                </Label>
                <p className="text-xs text-olive mt-0.5">
                  Notificar apenas quando a prioridade for Crítico
                </p>
              </div>
              <Switch id="notif-critical" defaultChecked={false} />
            </div>

            <Separator className="bg-line" />

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="notif-due-soon" className="text-sm text-ink font-sans">
                  Tarefas a vencer
                </Label>
                <p className="text-xs text-olive mt-0.5">
                  Alertar quando faltarem 3 dias ou menos para o prazo
                </p>
              </div>
              <Switch id="notif-due-soon" defaultChecked />
            </div>

            {notifPermission === 'denied' && (
              <div className="flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md p-3 mt-2">
                <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                <span>
                  As notificações estão bloqueadas neste browser. Vá às definições do browser para
                  permitir notificações de 300-humandesignexperience.netlify.app.
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Integrations */}
        <Card className="border-line bg-ivory lg:col-span-2">
          <CardHeader>
            <CardTitle className="font-serif text-lg text-ink flex items-center gap-2">
              <MessageSquare size={16} strokeWidth={1.5} /> Integrações
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Slack */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageSquare size={16} className="text-olive" strokeWidth={1.5} />
                  <div>
                    <Label htmlFor="slack-enabled" className="text-sm text-ink font-sans">
                      Slack
                    </Label>
                    <p className="text-xs text-olive mt-0.5">Enviar alertas críticos para o Slack</p>
                  </div>
                </div>
                <Switch
                  id="slack-enabled"
                  checked={slackEnabled}
                  onCheckedChange={handleToggleSlack}
                />
              </div>
              <div>
                <Label htmlFor="slack-webhook" className="text-xs text-olive font-sans">
                  Slack Webhook URL
                </Label>
                <Input
                  id="slack-webhook"
                  type="url"
                  placeholder="https://hooks.slack.com/services/..."
                  value={slackWebhookUrl}
                  onChange={e => handleSlackUrlChange(e.target.value)}
                  className="mt-1 bg-transparent border-line"
                />
              </div>
            </div>

            <Separator className="bg-line" />

            {/* Email */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Mail size={16} className="text-olive" strokeWidth={1.5} />
                <div>
                  <Label className="text-sm text-ink font-sans">Email (Resend)</Label>
                  <p className="text-xs text-olive mt-0.5">
                    Configuração da API para notificações por email
                  </p>
                </div>
              </div>
              <div>
                <Label htmlFor="resend-key" className="text-xs text-olive font-sans">
                  Resend API Key
                </Label>
                <Input
                  id="resend-key"
                  type="password"
                  placeholder="re_xxxxxxxx"
                  value={resendApiKey}
                  onChange={e => handleResendKeyChange(e.target.value)}
                  className="mt-1 bg-transparent border-line"
                />
              </div>
            </div>

            <Separator className="bg-line" />

            {/* Telegram */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Send size={16} className="text-olive" strokeWidth={1.5} />
                  <div>
                    <Label htmlFor="telegram-enabled" className="text-sm text-ink font-sans">
                      Telegram
                    </Label>
                    <p className="text-xs text-olive mt-0.5">Enviar alertas críticos para o Telegram</p>
                  </div>
                </div>
                <Switch
                  id="telegram-enabled"
                  checked={telegramEnabled}
                  onCheckedChange={handleToggleTelegram}
                />
              </div>
              <div>
                <Label htmlFor="telegram-token" className="text-xs text-olive font-sans">
                  Bot Token
                </Label>
                <Input
                  id="telegram-token"
                  type="password"
                  placeholder="123456789:ABCdefGHIjklMNOpqrsTUVwxyz"
                  value={telegramBotToken}
                  onChange={e => handleTelegramTokenChange(e.target.value)}
                  className="mt-1 bg-transparent border-line"
                />
              </div>
              <div>
                <Label htmlFor="telegram-chat" className="text-xs text-olive font-sans">
                  Chat ID
                </Label>
                <Input
                  id="telegram-chat"
                  type="text"
                  placeholder="-1001234567890"
                  value={telegramChatId}
                  onChange={e => handleTelegramChatIdChange(e.target.value)}
                  className="mt-1 bg-transparent border-line"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-line bg-ivory">
          <CardHeader>
            <CardTitle className="font-serif text-lg text-ink flex items-center gap-2">
              <FileText size={16} strokeWidth={1.5} /> Templates de Proposta
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {['Template Residencial Completo', 'Template Comercial', 'Template Minimalista'].map(
              (t, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between py-2 border-b border-line/50 last:border-0"
                >
                  <span className="text-sm text-ink font-sans">{t}</span>
                  <span className="text-xs text-olive font-sans">Padrão</span>
                </div>
              )
            )}
          </CardContent>
        </Card>

        <Card className="border-line bg-ivory">
          <CardHeader>
            <CardTitle className="font-serif text-lg text-ink flex items-center gap-2">
              <Users size={16} strokeWidth={1.5} /> Equipa e Permissões
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { name: 'João Mendes', role: 'Diretor Técnico', access: 'Total' },
              { name: 'Ana Costa', role: 'Gestora de Projetos', access: 'Total' },
              { name: 'Rui Pereira', role: 'Engenheiro', access: 'Projetos' },
              { name: 'Sofia Lopes', role: 'Administrativa', access: 'Finanças' },
            ].map((u, i) => (
              <div
                key={i}
                className="flex items-center justify-between py-2 border-b border-line/50 last:border-0"
              >
                <div>
                  <p className="text-sm text-ink font-sans">{u.name}</p>
                  <p className="text-xs text-olive font-sans">{u.role}</p>
                </div>
                <span className="text-xs text-olive font-sans">{u.access}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-line bg-ivory">
          <CardHeader>
            <CardTitle className="font-serif text-lg text-ink flex items-center gap-2">
              <Tag size={16} strokeWidth={1.5} /> Categorias de Equipamentos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {['Iluminação', 'Áudio', 'Vídeo', 'HVAC', 'Rede', 'Segurança', 'Automação'].map(
              (cat, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between py-2 border-b border-line/50 last:border-0"
                >
                  <span className="text-sm text-ink font-sans">{cat}</span>
                  <span className="text-xs text-olive font-sans">
                    {[3, 2, 2, 1, 1, 1, 1][i]} refs
                  </span>
                </div>
              )
            )}
          </CardContent>
        </Card>

        <Card className="border-line bg-ivory">
          <CardHeader>
            <CardTitle className="font-serif text-lg text-ink flex items-center gap-2">
              <SettingsIcon size={16} strokeWidth={1.5} /> Preferências
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="notif-email" className="text-sm text-ink font-sans">
                Notificações por email
              </Label>
              <Switch id="notif-email" defaultChecked />
            </div>
            <Separator className="bg-line" />
            <div className="flex items-center justify-between">
              <Label htmlFor="dark-mode" className="text-sm text-ink font-sans">
                Modo escuro
              </Label>
              <Switch id="dark-mode" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
