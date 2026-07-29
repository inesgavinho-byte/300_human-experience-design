import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertTriangle, TrendingUp, Folder, FileText, HardHat, CircleDollarSign,
  Users, MessageSquare, Mail, Send, CheckCircle2, XCircle,
  ExternalLink, Truck, Clock, ChevronRight, Calendar, Package, Bell,
} from 'lucide-react';
import type { Project, Task, Invoice, Proposal, Client, ProcurementTask, MaintenanceVisit } from '@/types';

const statusColors: Record<string, string> = {
  study: 'bg-olive/20 text-ink',
  executive: 'bg-line/40 text-ink',
  procurement: 'bg-olive/30 text-ink',
  installation: 'bg-ink text-ivory',
  commissioning: 'bg-olive/40 text-ink',
  delivered: 'bg-dark text-ivory',
  archived: 'bg-line/20 text-olive',
};

const statusLabels: Record<string, string> = {
  study: 'Estudo',
  executive: 'Projeto Executivo',
  procurement: 'Fornecimento',
  installation: 'Instalação',
  commissioning: 'Commissioning',
  delivered: 'Entregue',
  archived: 'Arquivado',
};

/* ───────────────────────────────────────────── */
export default function Dashboard() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [procurementTasks, setProcurementTasks] = useState<ProcurementTask[]>([]);
  const [visits, setVisits] = useState<MaintenanceVisit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchData() {
      try {
        setIsLoading(true);
        setError('');

        const [projectsRes, tasksRes, invoicesRes, proposalsRes, clientsRes, procRes, visitsRes] = await Promise.all([
          supabase.from('projects').select('*'),
          supabase.from('tasks').select('*'),
          supabase.from('invoices').select('*'),
          supabase.from('proposals').select('*'),
          supabase.from('clients').select('*'),
          supabase.from('procurement_tasks').select('*, supplier:suppliers(name)'),
          supabase.from('maintenance_visits').select('*'),
        ]);

        if (projectsRes.error) throw projectsRes.error;
        if (tasksRes.error) throw tasksRes.error;
        if (invoicesRes.error) throw invoicesRes.error;
        if (proposalsRes.error) throw proposalsRes.error;
        if (clientsRes.error) throw clientsRes.error;
        if (procRes.error) throw procRes.error;
        if (visitsRes.error) throw visitsRes.error;

        setProjects(projectsRes.data || []);
        setTasks(tasksRes.data || []);
        setInvoices(invoicesRes.data || []);
        setProposals(proposalsRes.data || []);
        setClients(clientsRes.data || []);
        setProcurementTasks(procRes.data || []);
        setVisits(visitsRes.data || []);
      } catch (err: any) {
        setError(err.message || 'Erro ao carregar dados');
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, []);

  /* ─── Hoje ─── */
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
  const threeDaysFromNow = new Date(today); threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

  const tasksToday = tasks.filter(t => {
    if (t.status === 'done') return false;
    if (!t.due_date) return false;
    const d = new Date(t.due_date); d.setHours(0,0,0,0);
    return d <= today;
  });

  const proposalsToSend = proposals.filter(p => p.status === 'draft' || p.status === 'Rascunho');
  const proposalsWaiting = proposals.filter(p => p.status === 'sent' || p.status === 'Enviada');

  const missingEquip = procurementTasks.filter(t => t.status !== 'done' && (t.task_type === 'purchase' || t.task_type === 'delivery_tracking'));
  const urgentMissing = missingEquip.filter(t => t.due_date && new Date(t.due_date) <= threeDaysFromNow);

  const commissioningSoon = visits.filter(v => {
    if (!v.scheduled_date) return false;
    const d = new Date(v.scheduled_date); d.setHours(0,0,0,0);
    return d >= today && d <= threeDaysFromNow;
  });

  /* ─── KPIs (secundário) ─── */
  const activeProjects = projects.filter(p => p.status !== 'delivered' && p.status !== 'archived');
  const approvedProposals = proposals.filter(p => p.status === 'approved' || p.status === 'Aprovada');
  const monthInvoices = invoices.filter(i => {
    if (!i.issue_date) return false;
    const d = new Date(i.issue_date);
    return d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
  });
  const monthRevenue = monthInvoices.reduce((sum, i) => sum + (i.amount || 0), 0);
  const totalPending = invoices.filter(i => i.status === 'pending').reduce((sum, i) => sum + (i.amount || 0), 0);
  const totalRevenue = invoices.reduce((sum, i) => sum + (i.amount || 0), 0);

  /* ─── Pipeline ─── */
  const pipeline = useMemo(() => {
    const counts: Record<string, number> = {};
    projects.forEach(p => { counts[p.status || 'study'] = (counts[p.status || 'study'] || 0) + 1; });
    return counts;
  }, [projects]);
  const pipelineOrder = ['study', 'executive', 'procurement', 'installation', 'commissioning', 'delivered'];
  const maxPipeline = Math.max(...Object.values(pipeline), 1);

  /* ─── Loading ─── */
  if (isLoading) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-10 w-48" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-24" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-72 lg:col-span-2" />
          <Skeleton className="h-72" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <h1 className="font-serif text-3xl text-ink">Dashboard</h1>
        <div className="flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md p-4">
          <AlertTriangle size={16} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      </div>
    );
  }

  const hasTodayActions = tasksToday.length > 0 || proposalsToSend.length > 0 || urgentMissing.length > 0 || commissioningSoon.length > 0 || proposalsWaiting.length > 0;

  return (
    <div className="space-y-8">
      {/* ─── Header ─── */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="font-serif text-3xl text-ink">Dashboard</h1>
          <p className="text-olive text-sm mt-1 font-sans">
            {today.toLocaleDateString('pt-PT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
      </div>

      {/* ════════════════════════════════════════
          1. HOJE — O que tenho para fazer?
          ════════════════════════════════════════ */}
      <section>
        <h2 className="font-serif text-xl text-ink mb-4 flex items-center gap-2">
          <Clock size={18} strokeWidth={1.5} className="text-ink" />
          Hoje
        </h2>

        {!hasTodayActions ? (
          <Card className="border-line bg-ivory">
            <CardContent className="py-8 text-center">
              <CheckCircle2 size={28} className="mx-auto text-olive/40 mb-3" strokeWidth={1.5} />
              <p className="text-sm text-olive font-sans">Nada urgente para hoje. Bom trabalho.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Tarefas para hoje */}
            <ActionCard
              count={tasksToday.length}
              label="tarefa(s) para hoje"
              sub={tasksToday.length > 0 ? `${tasksToday.filter(t => t.priority === 'Crítico').length} crítica(s)` : undefined}
              icon={HardHat}
              color={tasksToday.length > 3 ? 'red' : tasksToday.length > 0 ? 'amber' : 'neutral'}
              onClick={() => navigate('/tarefas')}
            />

            {/* Propostas para enviar */}
            <ActionCard
              count={proposalsToSend.length}
              label="proposta(s) para enviar"
              icon={FileText}
              color={proposalsToSend.length > 0 ? 'amber' : 'neutral'}
              onClick={() => navigate('/propostas')}
            />

            {/* Clientes a aguardar resposta */}
            <ActionCard
              count={proposalsWaiting.length}
              label="cliente(s) aguardam resposta"
              icon={Users}
              color={proposalsWaiting.length > 2 ? 'amber' : 'neutral'}
              onClick={() => navigate('/propostas')}
            />

            {/* Equipamentos em falta */}
            <ActionCard
              count={urgentMissing.length}
              label="equipamento(s) urgente(s)"
              sub={missingEquip.length > urgentMissing.length ? `${missingEquip.length} total em falta` : undefined}
              icon={Package}
              color={urgentMissing.length > 0 ? 'red' : 'neutral'}
              onClick={() => navigate('/procurement')}
            />

            {/* Commissioning */}
            <ActionCard
              count={commissioningSoon.length}
              label="visita(s) em breve"
              sub={commissioningSoon.length > 0 ? `até ${threeDaysFromNow.toLocaleDateString('pt-PT', { day:'numeric', month:'short' })}` : undefined}
              icon={Calendar}
              color={commissioningSoon.length > 0 ? 'amber' : 'neutral'}
              onClick={() => navigate('/manutencao')}
            />
          </div>
        )}
      </section>

      {/* ════════════════════════════════════════
          2. ENTREGAS & PRAZOS
          ════════════════════════════════════════ */}
      <section>
        <h2 className="font-serif text-xl text-ink mb-4 flex items-center gap-2">
          <Truck size={18} strokeWidth={1.5} className="text-ink" />
          Entregas & Prazos
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Próximas entregas (esta semana) */}
          <Card className="border-line bg-ivory lg:col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="font-serif text-lg text-ink flex items-center gap-2">
                <Calendar size={16} strokeWidth={1.5} />
                Próximas Entregas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {(() => {
                const weekFromNow = new Date(today); weekFromNow.setDate(today.getDate() + 7);
                const upcoming = procurementTasks
                  .filter(t => t.status !== 'done' && t.due_date && new Date(t.due_date) >= today && new Date(t.due_date) <= weekFromNow)
                  .sort((a, b) => new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime());

                if (upcoming.length === 0) {
                  return <p className="text-sm text-olive font-sans py-4 text-center">Nenhuma entrega prevista para esta semana.</p>;
                }

                return upcoming.map(task => {
                  const supplier = task.supplier;
                  const project = projects.find(p => p.id === task.project_id);
                  const isOverdue = task.due_date && new Date(task.due_date) < today;
                  const isUrgent = task.due_date && new Date(task.due_date) >= today && new Date(task.due_date) <= threeDaysFromNow;
                  const daysLeft = task.due_date ? Math.ceil((new Date(task.due_date).getTime() - today.getTime()) / (1000 * 60 * 60 * 24)) : null;

                  return (
                    <button
                      key={task.id}
                      onClick={() => navigate('/procurement')}
                      className="w-full text-left flex items-center gap-3 py-2 px-3 rounded-md hover:bg-line/30 transition-colors"
                    >
                      <div className={`w-2 h-2 rounded-full shrink-0 ${isOverdue ? 'bg-red-500' : isUrgent ? 'bg-amber-500' : 'bg-green-500'}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-ink font-sans truncate">{task.title}</p>
                        <p className="text-[11px] text-olive font-sans">{(supplier as any)?.name || '—'} · {project?.name || '—'}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className={`text-xs font-sans ${isOverdue ? 'text-red-600' : isUrgent ? 'text-amber-600' : 'text-olive'}`}>
                          {task.due_date ? new Date(task.due_date).toLocaleDateString('pt-PT', { day: 'numeric', month: 'short' }) : '—'}
                        </p>
                        {daysLeft !== null && (
                          <p className={`text-[10px] font-sans ${daysLeft < 0 ? 'text-red-600' : daysLeft <= 3 ? 'text-amber-600' : 'text-olive'}`}>
                            {daysLeft < 0 ? `${Math.abs(daysLeft)}d atrasado` : daysLeft === 0 ? 'Hoje' : `${daysLeft}d restantes`}
                          </p>
                        )}
                      </div>
                    </button>
                  );
                });
              })()}
            </CardContent>
          </Card>

          {/* Resumo de alertas */}
          <div className="space-y-4">
            <AlertCard
              icon={Truck}
              title="Entregas em atraso"
              count={procurementTasks.filter(t => t.status !== 'done' && t.due_date && new Date(t.due_date) < today).length}
              color="red"
              onClick={() => navigate('/procurement')}
            />
            <AlertCard
              icon={Clock}
              title="Urgentes (≤3 dias)"
              count={procurementTasks.filter(t => {
                if (t.status === 'done' || !t.due_date) return false;
                const due = new Date(t.due_date);
                return due >= today && due <= threeDaysFromNow;
              }).length}
              color="amber"
              onClick={() => navigate('/procurement')}
            />
            {(() => {
              const conflicts = procurementTasks.filter(t => {
                if (!t.due_date || !t.project_id) return false;
                const project = projects.find(p => p.id === t.project_id);
                if (!project?.end_date) return false;
                return new Date(t.due_date) > new Date(project.end_date) && t.status !== 'done';
              });
              if (conflicts.length === 0) return null;
              return (
                <button
                  onClick={() => navigate('/procurement')}
                  className="w-full text-left bg-red-50 border border-red-200 border-l-2 border-l-red-600 rounded-md p-4 hover:bg-red-100 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <AlertTriangle size={16} className="text-red-600" strokeWidth={1.5} />
                    <span className="text-sm font-medium text-red-800 font-sans">Conflito de prazo crítico</span>
                    <span className="ml-auto text-lg font-serif text-red-800">{conflicts.length}</span>
                  </div>
                  <p className="text-[11px] text-red-600 font-sans mt-1">Entrega após deadline do projeto</p>
                </button>
              );
            })()}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════
          3. ALERTAS
          ════════════════════════════════════════ */}
      <section>
        <h2 className="font-serif text-xl text-ink mb-4 flex items-center gap-2">
          <AlertTriangle size={18} strokeWidth={1.5} className="text-ink" />
          Alertas
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <AlertCard
            icon={HardHat}
            title="Tarefas atrasadas"
            count={tasks.filter(t => t.due_date && t.status !== 'done' && new Date(t.due_date) < today).length}
            color="red"
            onClick={() => navigate('/tarefas')}
          />
          <AlertCard
            icon={Truck}
            title="Entregas em atraso"
            count={procurementTasks.filter(t => t.status !== 'done' && t.due_date && new Date(t.due_date) < today).length}
            color="amber"
            onClick={() => navigate('/procurement')}
          />
          <AlertCard
            icon={Bell}
            title="Propostas pendentes"
            count={proposals.filter(p => p.status === 'draft' || p.status === 'sent' || p.status === 'Rascunho' || p.status === 'Enviada').length}
            color="neutral"
            onClick={() => navigate('/propostas')}
          />
        </div>
      </section>

      {/* ════════════════════════════════════════
          4. PIPELINE + PROJETOS
          ════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-line bg-ivory">
          <CardHeader className="pb-3">
            <CardTitle className="font-serif text-lg text-ink">Pipeline de Projetos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {pipelineOrder.map(status => {
              const count = pipeline[status] || 0;
              const percent = Math.round((count / maxPipeline) * 100);
              return (
                <div key={status} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-ink font-sans">{statusLabels[status]}</span>
                    <span className="text-olive font-sans text-xs">{count}</span>
                  </div>
                  <div className="h-2 bg-line/40 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${statusColors[status]?.split(' ')[0] || 'bg-ink'}`} style={{ width: `${percent}%` }} />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card className="border-line bg-ivory">
          <CardHeader className="pb-3">
            <CardTitle className="font-serif text-lg text-ink">Projetos Recentes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {activeProjects.length === 0 ? (
              <p className="text-sm text-olive font-sans">Sem projetos ativos.</p>
            ) : (
              activeProjects.slice(0, 5).map(p => {
                const client = clients.find(c => c.id === p.client_id);
                return (
                  <button
                    key={p.id}
                    onClick={() => navigate(`/projetos/${p.id}`)}
                    className="w-full text-left flex items-center justify-between py-2 px-3 rounded-md hover:bg-line/30 transition-colors"
                  >
                    <div>
                      <p className="text-sm font-medium text-ink font-sans">{p.name}</p>
                      <p className="text-[11px] text-olive font-sans">{client?.name || '—'} · {statusLabels[p.status || ''] || p.status}</p>
                    </div>
                    <ChevronRight size={14} className="text-olive shrink-0" strokeWidth={1.5} />
                  </button>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>

      {/* ════════════════════════════════════════
          5. KPIs FINANCEIROS (secundário)
          ════════════════════════════════════════ */}
      <section>
        <h2 className="font-serif text-xl text-ink mb-4 flex items-center gap-2">
          <TrendingUp size={18} strokeWidth={1.5} className="text-ink" />
          Performance
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            label="Projetos Ativos"
            value={activeProjects.length.toString()}
            sub={`${projects.length} total`}
            icon={Folder}
          />
          <KpiCard
            label="Propostas Aprovadas"
            value={`${approvedProposals.length}`}
            sub={`de ${proposals.length} enviadas`}
            icon={CheckCircle2}
          />
          <KpiCard
            label="Faturação Mês"
            value={`${monthRevenue.toLocaleString('pt-PT')}€`}
            sub={`${totalPending.toLocaleString('pt-PT')}€ em cobrança`}
            icon={CircleDollarSign}
          />
          <KpiCard
            label="Receita Total"
            value={`${totalRevenue.toLocaleString('pt-PT')}€`}
            sub="acumulado"
            icon={TrendingUp}
          />
        </div>
      </section>

      {/* ════════════════════════════════════════
          6. INTEGRAÇÕES
          ════════════════════════════════════════ */}
      <Card className="border-line bg-ivory">
        <CardHeader className="pb-3">
          <CardTitle className="font-serif text-lg text-ink flex items-center gap-2">
            <CheckCircle2 size={16} strokeWidth={1.5} />
            Estado das Integrações
          </CardTitle>
        </CardHeader>
        <CardContent>
          <IntegrationStatusPanel />
        </CardContent>
      </Card>
    </div>
  );
}

/* ─── Sub-components ─── */

function ActionCard({ count, label, sub, icon: Icon, color, onClick }: {
  count: number; label: string; sub?: string; icon: React.ElementType;
  color: 'red' | 'amber' | 'neutral'; onClick: () => void;
}) {
  const colorClasses = {
    red:    'bg-red-50 border-red-200 hover:border-red-300',
    amber:  'bg-amber-50 border-amber-200 hover:border-amber-300',
    neutral: 'bg-ivory border-line hover:border-ink/30',
  };
  const textColor = {
    red:    'text-red-800',
    amber:  'text-amber-800',
    neutral: 'text-ink',
  };
  const iconColor = {
    red:    'text-red-600',
    amber:  'text-amber-600',
    neutral: 'text-olive',
  };

  return (
    <button
      onClick={onClick}
      className={`w-full text-left border rounded-lg p-4 transition-colors ${colorClasses[color]} ${count === 0 ? 'opacity-60' : ''}`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className={`text-3xl font-serif ${textColor[color]}`}>{count}</span>
        <Icon size={18} className={iconColor[color]} strokeWidth={1.5} />
      </div>
      <p className={`text-xs font-sans ${textColor[color]}`}>{label}</p>
      {sub && <p className="text-[10px] text-olive font-sans mt-0.5">{sub}</p>}
    </button>
  );
}

function AlertCard({ icon: Icon, title, count, color, onClick }: {
  icon: React.ElementType; title: string; count: number;
  color: 'red' | 'amber' | 'neutral'; onClick: () => void;
}) {
  if (count === 0) return null;
  const borderColor = { red: 'border-l-red-500', amber: 'border-l-amber-500', neutral: 'border-l-ink' }[color];
  const iconColor = { red: 'text-red-600', amber: 'text-amber-600', neutral: 'text-olive' }[color];

  return (
    <button
      onClick={onClick}
      className={`w-full text-left bg-ivory border border-line ${borderColor} border-l-2 rounded-md p-4 hover:bg-line/20 transition-colors`}
    >
      <div className="flex items-center gap-2">
        <Icon size={16} className={iconColor} strokeWidth={1.5} />
        <span className="text-sm font-medium text-ink font-sans">{title}</span>
        <span className="ml-auto text-lg font-serif text-ink">{count}</span>
      </div>
    </button>
  );
}

function KpiCard({ label, value, sub, icon: Icon }: {
  label: string; value: string; sub: string; icon: React.ElementType;
}) {
  return (
    <Card className="border-line bg-ivory">
      <CardContent className="p-4 flex items-center gap-4">
        <Icon size={20} className="text-olive" strokeWidth={1.5} />
        <div>
          <p className="text-[10px] text-olive font-sans uppercase tracking-wider">{label}</p>
          <p className="text-xl font-serif text-ink">{value}</p>
          <p className="text-[11px] text-olive font-sans">{sub}</p>
        </div>
      </CardContent>
    </Card>
  );
}

/* ─── Integration Status Panel ─── */
function IntegrationStatusPanel() {
  const [testing, setTesting] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<Record<string, { ok: boolean; msg: string }>>({});

  const slackUrl = localStorage.getItem('300-slack-webhook-url');
  const resendKey = localStorage.getItem('300-resend-api-key');
  const telegramToken = localStorage.getItem('300-telegram-bot-token');
  const telegramChat = localStorage.getItem('300-telegram-chat-id');

  const integrations = [
    {
      id: 'slack', name: 'Slack', icon: MessageSquare,
      configured: !!slackUrl && slackUrl.startsWith('https://hooks.slack.com/'),
      detail: slackUrl ? 'Webhook configurado' : 'Webhook URL não definido',
      testFn: async () => {
        if (!slackUrl) throw new Error('Webhook URL não configurado');
        const res = await fetch(slackUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: '300 OPS · Teste de integração Slack ✅' }) });
        if (!res.ok) throw new Error(`Erro ${res.status}`);
        return 'Mensagem de teste enviada para o Slack';
      },
    },
    {
      id: 'email', name: 'Email (Resend)', icon: Mail,
      configured: !!resendKey && resendKey.startsWith('re_'),
      detail: resendKey ? 'API key configurada' : 'API key não definida',
      testFn: async () => { if (!resendKey) throw new Error('API key não configurada'); return 'Edge Function pronta — configure a secret RESEND_API_KEY no Supabase para ativar'; },
    },
    {
      id: 'telegram', name: 'Telegram', icon: Send,
      configured: !!telegramToken && !!telegramChat,
      detail: telegramToken && telegramChat ? 'Bot + Chat ID configurados' : 'Bot token ou Chat ID em falta',
      testFn: async () => {
        if (!telegramToken || !telegramChat) throw new Error('Token ou Chat ID não configurados');
        const res = await fetch(`https://api.telegram.org/bot${telegramToken}/sendMessage`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ chat_id: telegramChat, text: '300 OPS · Teste de integração Telegram ✅', parse_mode: 'HTML' }) });
        const data = await res.json();
        if (!data.ok) throw new Error(data.description || `Erro ${res.status}`);
        return 'Mensagem de teste enviada para o Telegram';
      },
    },
  ];

  const runTest = async (id: string) => {
    const integration = integrations.find(i => i.id === id);
    if (!integration) return;
    setTesting(id);
    setTestResult(prev => ({ ...prev, [id]: { ok: false, msg: '' } }));
    try { const msg = await integration.testFn(); setTestResult(prev => ({ ...prev, [id]: { ok: true, msg } })); }
    catch (err: any) { setTestResult(prev => ({ ...prev, [id]: { ok: false, msg: err.message || 'Erro desconhecido' } })); }
    finally { setTesting(null); }
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {integrations.map(item => {
        const Icon = item.icon;
        const result = testResult[item.id];
        return (
          <div key={item.id} className={`p-4 rounded-lg border ${item.configured ? 'bg-green-50/50 border-green-200' : 'bg-line/10 border-line'}`}>
            <div className="flex items-center gap-2 mb-2">
              <Icon size={16} className={item.configured ? 'text-green-600' : 'text-olive'} strokeWidth={1.5} />
              <span className="text-sm font-medium text-ink font-sans">{item.name}</span>
              {item.configured ? <CheckCircle2 size={14} className="text-green-600 ml-auto" /> : <XCircle size={14} className="text-olive ml-auto" />}
            </div>
            <p className="text-xs text-olive font-sans mb-3">{item.detail}</p>
            <div className="flex items-center gap-2">
              <button onClick={() => runTest(item.id)} disabled={testing === item.id || !item.configured} className={`text-xs px-3 py-1.5 rounded-md font-sans transition-colors ${item.configured ? 'bg-ink text-ivory hover:bg-ink/80 disabled:opacity-50' : 'bg-line/40 text-olive cursor-not-allowed'}`}>
                {testing === item.id ? 'A testar...' : 'Testar'}
              </button>
              {!item.configured && (
                <a href="/configuracoes" className="text-xs text-olive hover:text-ink font-sans flex items-center gap-1">Configurar <ExternalLink size={10} /></a>
              )}
            </div>
            {result?.msg && (
              <p className={`text-xs mt-2 font-sans ${result.ok ? 'text-green-600' : 'text-red-600'}`}>{result.ok ? '✅ ' : '❌ '}{result.msg}</p>
            )}
          </div>
        );
      })}
    </div>
  );
}
