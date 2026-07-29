import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Search, Package, Wrench, Settings, Clock, MessageCircle, Send, CheckCircle2,
  AlertTriangle, Calendar, Truck, Mail, StickyNote, ChevronDown, Eye, EyeOff,
} from 'lucide-react';
import { toastSuccess, toastError } from '@/lib/toast';
import type { ProcurementTask, Supplier, SupplierMessage, Project } from '@/types';

/* ─────────── constants ─────────── */

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  todo:       { label: 'Por Fazer',    color: 'bg-line/40 text-ink' },
  in_progress:{ label: 'Em Progresso', color: 'bg-olive/30 text-ink' },
  in_review:  { label: 'Em Revisão',   color: 'bg-amber-100/50 text-ink' },
  done:       { label: 'Concluída',    color: 'bg-green-100/50 text-ink' },
};

const TYPE_ICONS: Record<string, React.ElementType> = {
  purchase: Package,
  installation: Wrench,
  configuration: Settings,
  delivery_tracking: Truck,
  follow_up: MessageCircle,
};

const TYPE_LABELS: Record<string, string> = {
  purchase: 'Compra',
  installation: 'Instalação',
  configuration: 'Configuração',
  delivery_tracking: 'Entrega',
  follow_up: 'Follow-up',
};

interface MessageTemplate {
  id: string;
  label: string;
  icon: React.ElementType;
  generate: (task: ProcurementTask, supplier?: Supplier) => string;
  messageType: SupplierMessage['message_type'];
  isInternal?: boolean;
}

/* ─────────── component ─────────── */

export default function Procurement() {
  const [tasks, setTasks] = useState<ProcurementTask[]>([]);
  const [suppliers, setSuppliers] = useState<Record<string, Supplier>>({});
  const [projects, setProjects] = useState<Record<string, Project>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  // Chat state
  const [selectedTask, setSelectedTask] = useState<ProcurementTask | null>(null);
  const [messages, setMessages] = useState<SupplierMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [isInternalNote, setIsInternalNote] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [emailSending, setEmailSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => { fetchTasks(); }, []);

  useEffect(() => {
    if (selectedTask) {
      fetchMessages(selectedTask.id);
      markMessagesAsRead(selectedTask.id);
    }
  }, [selectedTask]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  /* ─────────── data ─────────── */

  async function fetchTasks() {
    try {
      setIsLoading(true);
      setError('');

      const { data, error } = await supabase
        .from('procurement_tasks')
        .select('*, supplier:suppliers(*), project:projects(*)')
        .order('due_date', { ascending: true });

      if (error) throw error;

      const taskList = (data || []) as ProcurementTask[];
      setTasks(taskList);

      const supMap: Record<string, Supplier> = {};
      const projMap: Record<string, Project> = {};
      taskList.forEach(t => {
        if (t.supplier) supMap[t.supplier.id] = t.supplier;
        if (t.project) projMap[t.project.id] = t.project;
      });
      setSuppliers(supMap);
      setProjects(projMap);

      const { count } = await supabase
        .from('supplier_messages')
        .select('*', { count: 'exact', head: true })
        .eq('sender_type', 'supplier')
        .is('read_at', null);
      setUnreadCount(count || 0);

    } catch (err: any) {
      setError(err.message || 'Erro ao carregar tarefas');
    } finally {
      setIsLoading(false);
    }
  }

  async function fetchMessages(taskId: string) {
    setChatLoading(true);
    const { data } = await supabase
      .from('supplier_messages')
      .select('*')
      .eq('procurement_task_id', taskId)
      .order('created_at', { ascending: true });
    setMessages((data || []) as SupplierMessage[]);
    setChatLoading(false);
  }

  async function markMessagesAsRead(taskId: string) {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return;
    await supabase
      .from('supplier_messages')
      .update({ read_at: new Date().toISOString() })
      .eq('procurement_task_id', taskId)
      .neq('sender_user_id', userData.user.id)
      .is('read_at', null);
  }

  /* ─────────── message sending ─────────── */

  async function sendMessage(contentOverride?: string, typeOverride?: SupplierMessage['message_type'], internal?: boolean) {
    const content = contentOverride ?? newMessage.trim();
    if (!content || !selectedTask) return;

    const { data: userData } = await supabase.auth.getUser();
    const payload: any = {
      supplier_id: selectedTask.supplier_id,
      proposal_id: selectedTask.proposal_id,
      proposal_experience_id: selectedTask.proposal_experience_id,
      procurement_task_id: selectedTask.id,
      sender_type: 'user',
      sender_user_id: userData.user?.id,
      sender_name: userData.user?.email?.split('@')[0] || 'Utilizador',
      content,
      message_type: typeOverride ?? 'message',
      is_internal_note: isInternalNote || internal || false,
    };

    const { error } = await supabase.from('supplier_messages').insert(payload);
    if (!error) {
      toastSuccess('Mensagem enviada');
      setNewMessage('');
      setIsInternalNote(false);
      await fetchMessages(selectedTask.id);
      await supabase.from('procurement_tasks').update({
        last_contact_at: new Date().toISOString(),
        last_contact_method: 'chat',
      }).eq('id', selectedTask.id);
    } else {
      toastError('Erro ao enviar mensagem', error.message);
    }
  }

  async function updateTaskStatus(taskId: string, status: string) {
    const task = tasks.find(t => t.id === taskId);
    const updates: any = { status };
    if (status === 'done') updates.completed_at = new Date().toISOString();
    await supabase.from('procurement_tasks').update(updates).eq('id', taskId);
    await fetchTasks();
    toastSuccess('Tarefa atualizada', `${task?.title || ''} → ${status}`);
  }

  async function sendEmail() {
    if (!selectedTask || !newMessage.trim()) return;
    const supplier = suppliers[selectedTask.supplier_id || ''];
    if (!supplier) { toastError('Fornecedor não encontrado'); return; }

    setEmailSending(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const supabaseUrl = 'https://iiiicrfhqwsltswmfvld.supabase.co';
      const res = await fetch(`${supabaseUrl}/functions/v1/send-supplier-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlpaWljcmZocXdzbHRzd21mdmxkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUxOTg3ODQsImV4cCI6MjEwMDc3NDc4NH0.2SGIALeLQdaq753_4P_FVni8L_Yyn54T06XPWz3DZOY`,
        },
        body: JSON.stringify({
          supplier_id: selectedTask.supplier_id,
          subject: selectedTask.title,
          content: newMessage.trim(),
          procurement_task_id: selectedTask.id,
          proposal_id: selectedTask.proposal_id,
          proposal_experience_id: selectedTask.proposal_experience_id,
          sender_name: userData.user?.email?.split('@')[0] || 'Equipa 300',
          sender_user_id: userData.user?.id,
        }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Erro ao enviar email');
      toastSuccess('Email enviado', `Para: ${result.supplier_name} (${result.to})`);
      setNewMessage('');
      await fetchMessages(selectedTask.id);
    } catch (err: any) {
      toastError('Erro ao enviar email', err.message);
    } finally {
      setEmailSending(false);
    }
  }

  /* ─────────── templates ─────────── */

  const templates: MessageTemplate[] = [
    {
      id: 'quote_request',
      label: 'Pedir Orçamento',
      icon: Mail,
      generate: (task, supplier) =>
        `Exmo(s). Senhor(es) da ${supplier?.name || 'empresa'},\n\n` +
        `Em referência ao projeto em questão, solicitamos o envio de orçamento para:\n` +
        `• Item: ${task.title}\n` +
        `• Tipo de serviço: ${TYPE_LABELS[task.task_type] || task.task_type}\n\n` +
        `Agradecíamos que nos contactassem com a maior brevidade possível.\n\n` +
        `Com os melhores cumprimentos,\nEquipa 300 — Human Experience Design`,
      messageType: 'quote',
    },
    {
      id: 'order_confirm',
      label: 'Confirmar Encomenda',
      icon: CheckCircle2,
      generate: (task, supplier) =>
        `Caro(a) ${supplier?.name || 'fornecedor'},\n\n` +
        `Confirmamos a encomenda do seguinte item:\n` +
        `• ${task.title}\n\n` +
        `Solicitamos confirmação de receção e indicação de prazo de entrega.\n\n` +
        `Obrigado,\nEquipa 300`,
      messageType: 'order',
    },
    {
      id: 'delivery_follow',
      label: 'Acompanhamento Entrega',
      icon: Truck,
      generate: (task, supplier) =>
        `Caro(a) ${supplier?.name || 'fornecedor'},\n\n` +
        `Viemos por este meio solicitar atualização sobre o estado da entrega de:\n` +
        `• ${task.title}\n` +
        (task.supplier_promised_date ? `• Prazo acordado: ${new Date(task.supplier_promised_date).toLocaleDateString('pt-PT')}\n` : '') +
        `\nAgradecíamos resposta breve.\n\nEquipa 300`,
      messageType: 'delivery_update',
    },
    {
      id: 'deadline_reminder',
      label: 'Lembrete Prazo',
      icon: AlertTriangle,
      generate: (task, supplier) =>
        `Caro(a) ${supplier?.name || 'fornecedor'},\n\n` +
        `Alertamos que o prazo de entrega do item "${task.title}" está a aproximar-se.` +
        (task.due_date ? ` Data limite: ${new Date(task.due_date).toLocaleDateString('pt-PT')}.` : '') +
        `\n\nAgradecíamos confirmação de cumprimento do prazo.\n\nEquipa 300`,
      messageType: 'reminder',
    },
    {
      id: 'internal_note',
      label: 'Nota Interna',
      icon: StickyNote,
      generate: () => '',
      messageType: 'message',
      isInternal: true,
    },
  ];

  function applyTemplate(tpl: MessageTemplate) {
    if (!selectedTask) return;
    const supplier = suppliers[selectedTask.supplier_id || ''];
    const content = tpl.generate(selectedTask, supplier);
    setNewMessage(content);
    setIsInternalNote(!!tpl.isInternal);
    setShowTemplates(false);
  }

  /* ─────────── derived ─────────── */

  const now = new Date();
  const threeDaysFromNow = new Date(now); threeDaysFromNow.setDate(now.getDate() + 3);

  const filtered = tasks.filter(t => {
    const matchesSearch = t.title.toLowerCase().includes(search.toLowerCase()) ||
      suppliers[t.supplier_id || '']?.name?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = !statusFilter || t.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const overdueCount = tasks.filter(t => t.status !== 'done' && t.due_date && new Date(t.due_date) < now).length;
  const urgentCount = tasks.filter(t => {
    if (t.status === 'done' || !t.due_date) return false;
    const due = new Date(t.due_date);
    return due >= now && due <= threeDaysFromNow;
  }).length;
  const doneCount = tasks.filter(t => t.status === 'done').length;

  /* ─────────── render ─────────── */

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-24" />)}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-serif text-3xl text-ink">Procurement</h1>
            {unreadCount > 0 && (
              <Badge className="bg-red-500 text-white text-[10px] px-1.5 py-0">
                {unreadCount} nova{unreadCount > 1 ? 's' : ''}
              </Badge>
            )}
          </div>
          <p className="text-olive text-sm mt-1 font-sans">Gestão de tarefas de compra e fornecedores</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-olive" strokeWidth={1.5} />
            <Input
              placeholder="Pesquisar tarefas..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 bg-ivory border-line text-ink placeholder:text-olive/60"
            />
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-line bg-ivory">
          <CardContent className="p-4 flex items-center gap-4">
            <AlertTriangle size={20} className="text-red-500" strokeWidth={1.5} />
            <div>
              <p className="text-xs text-olive font-sans uppercase">Em Atraso</p>
              <p className="text-xl font-serif text-ink">{overdueCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-line bg-ivory">
          <CardContent className="p-4 flex items-center gap-4">
            <Clock size={20} className="text-amber-500" strokeWidth={1.5} />
            <div>
              <p className="text-xs text-olive font-sans uppercase">Urgente (≤3 dias)</p>
              <p className="text-xl font-serif text-ink">{urgentCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-line bg-ivory">
          <CardContent className="p-4 flex items-center gap-4">
            <CheckCircle2 size={20} className="text-green-600" strokeWidth={1.5} />
            <div>
              <p className="text-xs text-olive font-sans uppercase">Concluídas</p>
              <p className="text-xl font-serif text-ink">{doneCount}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setStatusFilter('')}
          className={`text-xs px-3 py-1.5 rounded-md border transition-colors font-sans ${!statusFilter ? 'bg-ink text-ivory border-ink' : 'bg-white text-olive border-line hover:border-ink'}`}
        >
          Todas
        </button>
        {Object.entries(STATUS_LABELS).map(([key, { label }]) => (
          <button
            key={key}
            onClick={() => setStatusFilter(key)}
            className={`text-xs px-3 py-1.5 rounded-md border transition-colors font-sans ${statusFilter === key ? 'bg-ink text-ivory border-ink' : 'bg-white text-olive border-line hover:border-ink'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {error && (
        <div className="flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md p-4">
          <AlertTriangle size={16} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Task List */}
        <div className="lg:col-span-2 space-y-3">
          {filtered.map(task => {
            const supplier = suppliers[task.supplier_id || ''];
            const project = projects[task.project_id || ''];
            const isOverdue = task.status !== 'done' && task.due_date && new Date(task.due_date) < now;
            const isUrgent = task.status !== 'done' && task.due_date &&
              new Date(task.due_date) >= now && new Date(task.due_date) <= threeDaysFromNow;
            const TypeIcon = TYPE_ICONS[task.task_type] || Package;
            const statusCfg = STATUS_LABELS[task.status] || STATUS_LABELS.todo;

            return (
              <Card
                key={task.id}
                className={`border-line bg-white hover:shadow-sm transition-shadow cursor-pointer ${selectedTask?.id === task.id ? 'ring-1 ring-ink' : ''} ${isOverdue ? 'border-red-300' : isUrgent ? 'border-amber-300' : ''}`}
                onClick={() => setSelectedTask(task)}
              >
                <CardContent className="p-3 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <TypeIcon size={14} className="text-olive shrink-0" strokeWidth={1.5} />
                      <p className="text-sm font-medium text-ink font-sans leading-tight">{task.title}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      {isUrgent && !isOverdue && <Clock size={14} className="text-amber-500 shrink-0" />}
                      {isOverdue && <AlertTriangle size={14} className="text-red-500 shrink-0" />}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline" className={`text-[10px] ${statusCfg.color}`}>{statusCfg.label}</Badge>
                    {isUrgent && (
                      <Badge variant="outline" className="text-[9px] bg-amber-100 border-amber-300 text-amber-800">Urgente</Badge>
                    )}
                    <span className="text-[10px] text-olive font-sans">{TYPE_LABELS[task.task_type] || task.task_type}</span>
                  </div>

                  <div className="flex items-center justify-between text-xs font-sans">
                    <div className="flex items-center gap-2 text-olive">
                      <span>{supplier?.name || '—'}</span>
                      {project && <span>· {project.name}</span>}
                    </div>
                    {task.due_date && (
                      <div className={`flex items-center gap-1 ${isOverdue ? 'text-red-600' : isUrgent ? 'text-amber-600' : 'text-olive'}`}>
                        <Calendar size={10} />
                        <span>{new Date(task.due_date).toLocaleDateString('pt-PT')}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {filtered.length === 0 && (
            <div className="text-center py-12 border border-dashed border-line rounded-md">
              <p className="text-sm text-olive font-sans">Nenhuma tarefa encontrada.</p>
            </div>
          )}
        </div>

        {/* Chat Panel */}
        <div className="lg:col-span-3">
          {selectedTask ? (
            <Card className="border-line bg-ivory h-[calc(100vh-240px)] flex flex-col">
              {/* Header */}
              <div className="p-4 border-b border-line">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-serif text-lg text-ink">{selectedTask.title}</h3>
                    <p className="text-xs text-olive font-sans mt-0.5">
                      {suppliers[selectedTask.supplier_id || '']?.name} · {TYPE_LABELS[selectedTask.task_type]}
                      {selectedTask.due_date && ` · Prazo: ${new Date(selectedTask.due_date).toLocaleDateString('pt-PT')}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {selectedTask.status !== 'done' && (
                      <Button size="sm" onClick={() => updateTaskStatus(selectedTask.id, 'done')} className="bg-green-700 text-white hover:bg-green-800 font-sans text-xs">
                        <CheckCircle2 size={12} className="mr-1" /> Concluir
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {chatLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-3/4" />)}
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center py-8">
                    <MessageCircle size={24} className="mx-auto text-olive/40 mb-2" strokeWidth={1.5} />
                    <p className="text-xs text-olive font-sans">Sem mensagens. Inicie a conversa.</p>
                  </div>
                ) : (
                  messages.map(msg => {
                    const isSystem = msg.sender_type === 'system';
                    const isUser = msg.sender_type === 'user';
                    const isInternal = msg.is_internal_note;

                    return (
                      <div key={msg.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                          isSystem ? 'bg-line/30 text-ink text-center w-full' :
                          isInternal ? 'bg-amber-50 border border-amber-200 text-ink' :
                          isUser ? 'bg-ink text-ivory' : 'bg-white border border-line text-ink'
                        }`}>
                          {!isSystem && (
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <p className="text-[10px] opacity-70 font-sans">
                                {msg.sender_name || msg.sender_type} · {new Date(msg.created_at).toLocaleString('pt-PT', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                              </p>
                              {isInternal && (
                                <Badge variant="outline" className="text-[9px] px-1 py-0 h-auto bg-amber-100 border-amber-300 text-amber-800">
                                  <EyeOff size={8} className="mr-0.5" /> Interno
                                </Badge>
                              )}
                              {!msg.read_at && !isUser && (
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-500" title="Não lida" />
                              )}
                            </div>
                          )}
                          <p className="font-sans whitespace-pre-line">{msg.content}</p>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="p-3 border-t border-line space-y-2">
                {/* Template selector */}
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <button
                      onClick={() => setShowTemplates(!showTemplates)}
                      className="text-xs px-3 py-1.5 rounded-md border border-line bg-white text-olive hover:border-ink hover:text-ink font-sans flex items-center gap-1 transition-colors"
                    >
                      <Mail size={10} /> Templates <ChevronDown size={10} />
                    </button>
                    {showTemplates && (
                      <div className="absolute bottom-full left-0 mb-1 w-56 bg-white border border-line rounded-md shadow-lg z-10 overflow-hidden">
                        {templates.map(tpl => {
                          const Icon = tpl.icon;
                          return (
                            <button
                              key={tpl.id}
                              onClick={() => applyTemplate(tpl)}
                              className="w-full text-left px-3 py-2 text-xs text-ink hover:bg-line/20 font-sans flex items-center gap-2 transition-colors"
                            >
                              <Icon size={12} className="text-olive" />
                              {tpl.label}
                              {tpl.isInternal && <span className="ml-auto text-[9px] text-amber-600">interno</span>}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Internal note toggle */}
                  <button
                    onClick={() => setIsInternalNote(!isInternalNote)}
                    className={`text-xs px-2 py-1.5 rounded-md border transition-colors font-sans flex items-center gap-1 ${
                      isInternalNote ? 'bg-amber-100 border-amber-300 text-amber-800' : 'bg-white border-line text-olive hover:border-ink'
                    }`}
                  >
                    {isInternalNote ? <EyeOff size={10} /> : <Eye size={10} />}
                    {isInternalNote ? 'Nota interna' : 'Pública'}
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <Input
                    value={newMessage}
                    onChange={e => setNewMessage(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                    placeholder={isInternalNote ? 'Escrever nota interna (só visível para equipa)...' : 'Escrever mensagem...'}
                    className={`bg-white border-line text-ink placeholder:text-olive/60 ${isInternalNote ? 'border-amber-300' : ''}`}
                  />
                  <Button size="sm" onClick={() => sendMessage()} className="bg-ink text-ivory hover:bg-ink/90 shrink-0">
                    <Send size={14} />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={sendEmail}
                    disabled={emailSending || !newMessage.trim()}
                    className="border-line text-ink hover:bg-ink hover:text-ivory shrink-0"
                    title="Enviar por email"
                  >
                    {emailSending ? '...' : <Mail size={14} />}
                  </Button>
                </div>
              </div>
            </Card>
          ) : (
            <div className="h-[calc(100vh-240px)] flex items-center justify-center border border-dashed border-line rounded-md">
              <div className="text-center">
                <MessageCircle size={32} className="mx-auto text-olive/40 mb-3" strokeWidth={1.5} />
                <p className="text-sm text-olive font-sans">Selecione uma tarefa para ver o chat.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
