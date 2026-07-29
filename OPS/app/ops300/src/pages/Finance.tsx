import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import {
  CircleDollarSign, TrendingUp, AlertTriangle, Plus, Trash2, Edit3,
  Save, X, Check, Filter, Clock,
} from 'lucide-react';
import { toast } from 'sonner';
import type { Invoice, Project, Client } from '@/types';

const STATUS_OPTIONS = ['emitida', 'pendente', 'paga'] as const;

const statusColors: Record<string, string> = {
  'emitida': 'bg-line/40 text-ink border-line',
  'pendente': 'bg-amber-50 text-amber-700 border-amber-200',
  'paga': 'bg-green-700 text-ivory border-green-700',
};

const statusLabels: Record<string, string> = {
  'emitida': 'Emitida',
  'pendente': 'Pendente',
  'paga': 'Paga',
};

export default function Finance() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  /* Filters */
  const [filterProject, setFilterProject] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [searchNumber, setSearchNumber] = useState('');

  /* Create / Edit dialog */
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [form, setForm] = useState({
    number: '', project_id: '', client_id: '', amount: '',
    status: 'emitida', issue_date: '', due_date: '', paid_date: '', description: '',
  });

  /* ─── Fetch data ─── */
  useEffect(() => {
    async function fetchData() {
      try {
        setIsLoading(true);
        setError('');
        const [invoicesRes, projectsRes, clientsRes] = await Promise.all([
          supabase.from('invoices').select('*').order('issue_date', { ascending: false }),
          supabase.from('projects').select('*').order('name'),
          supabase.from('clients').select('*').order('name'),
        ]);
        if (invoicesRes.error) throw invoicesRes.error;
        if (projectsRes.error) throw projectsRes.error;
        if (clientsRes.error) throw clientsRes.error;
        setInvoices(invoicesRes.data || []);
        setProjects(projectsRes.data || []);
        setClients(clientsRes.data || []);
      } catch (err: any) {
        setError(err.message || 'Erro ao carregar finanças');
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, []);

  /* ─── Derived data ─── */
  const filteredInvoices = invoices.filter(inv => {
    if (filterProject && inv.project_id !== filterProject) return false;
    if (filterStatus && inv.status !== filterStatus) return false;
    if (searchNumber && !inv.number.toLowerCase().includes(searchNumber.toLowerCase())) return false;
    return true;
  });

  const totalInvoiced = filteredInvoices.reduce((s, i) => s + (i.amount || 0), 0);
  const totalPaid = filteredInvoices.filter(i => i.status === 'paga').reduce((s, i) => s + (i.amount || 0), 0);
  const totalPending = filteredInvoices.filter(i => i.status === 'pendente').reduce((s, i) => s + (i.amount || 0), 0);
  const totalOverdue = filteredInvoices.filter(i => {
    if (i.status === 'paga') return false;
    if (!i.due_date) return false;
    return new Date(i.due_date) < new Date();
  }).reduce((s, i) => s + (i.amount || 0), 0);

  /* Monthly chart */
  const monthMap = new Map<string, number>();
  invoices.forEach(inv => {
    if (inv.issue_date) {
      const d = new Date(inv.issue_date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      monthMap.set(key, (monthMap.get(key) || 0) + (inv.amount || 0));
    }
  });
  const sortedMonths = Array.from(monthMap.entries()).sort(([a], [b]) => a.localeCompare(b)).slice(-12);
  const chartData = sortedMonths.map(([month, value]) => ({
    month: `${month.split('-')[1]}/${month.split('-')[0].slice(2)}`,
    value,
  }));

  /* ─── Dialog helpers ─── */
  function openDialog(inv?: Invoice) {
    if (inv) {
      setEditingInvoice(inv);
      setForm({
        number: inv.number,
        project_id: inv.project_id || '',
        client_id: inv.client_id || '',
        amount: String(inv.amount),
        status: inv.status || 'emitida',
        issue_date: inv.issue_date ? inv.issue_date.split('T')[0] : '',
        due_date: inv.due_date ? inv.due_date.split('T')[0] : '',
        paid_date: inv.paid_date ? inv.paid_date.split('T')[0] : '',
        description: inv.description || '',
      });
    } else {
      setEditingInvoice(null);
      const nextNum = invoices.length > 0
        ? Math.max(...invoices.map(i => parseInt(i.number.replace(/\D/g, '') || '0'))) + 1
        : 1;
      setForm({
        number: `F${String(nextNum).padStart(4, '0')}`,
        project_id: '', client_id: '', amount: '', status: 'emitida',
        issue_date: new Date().toISOString().split('T')[0],
        due_date: '', paid_date: '', description: '',
      });
    }
    setDialogOpen(true);
  }

  async function saveInvoice() {
    if (!form.number.trim()) { toast.error('Número obrigatório'); return; }
    if (!form.amount || isNaN(parseFloat(form.amount))) { toast.error('Valor obrigatório'); return; }

    const payload = {
      number: form.number.trim(),
      project_id: form.project_id || null,
      client_id: form.client_id || null,
      amount: parseFloat(form.amount),
      status: form.status,
      issue_date: form.issue_date || null,
      due_date: form.due_date || null,
      paid_date: form.paid_date || null,
      description: form.description.trim() || null,
    };

    if (editingInvoice) {
      const { error } = await supabase.from('invoices').update(payload).eq('id', editingInvoice.id);
      if (error) { toast.error('Erro: ' + error.message); return; }
      toast.success('Fatura atualizada');
    } else {
      const { error } = await supabase.from('invoices').insert(payload);
      if (error) { toast.error('Erro: ' + error.message); return; }
      toast.success('Fatura criada');
    }
    setDialogOpen(false);
    const { data } = await supabase.from('invoices').select('*').order('issue_date', { ascending: false });
    if (data) setInvoices(data);
  }

  async function deleteInvoice(id: string) {
    if (!confirm('Eliminar esta fatura?')) return;
    const { error } = await supabase.from('invoices').delete().eq('id', id);
    if (error) { toast.error('Erro: ' + error.message); return; }
    toast.success('Fatura eliminada');
    setInvoices(prev => prev.filter(i => i.id !== id));
  }

  async function markAsPaid(id: string) {
    const { error } = await supabase.from('invoices').update({
      status: 'paga',
      paid_date: new Date().toISOString().split('T')[0],
    }).eq('id', id);
    if (error) { toast.error('Erro: ' + error.message); return; }
    toast.success('Fatura marcada como paga');
    const { data } = await supabase.from('invoices').select('*').order('issue_date', { ascending: false });
    if (data) setInvoices(data);
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24" />)}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <h1 className="font-serif text-3xl text-ink">Finanças</h1>
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
          <h1 className="font-serif text-3xl text-ink">Finanças</h1>
          <p className="text-olive text-sm mt-1 font-sans">Faturação e receitas</p>
        </div>
        <Button variant="outline" onClick={() => openDialog()} className="border-line text-ink font-sans">
          <Plus size={14} className="mr-1" /> Nova Fatura
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-line bg-ivory">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-olive font-sans">Total Faturado</p>
                <p className="text-2xl font-serif text-ink mt-1">{totalInvoiced.toLocaleString('pt-PT')}€</p>
              </div>
              <CircleDollarSign size={20} className="text-olive" strokeWidth={1.5} />
            </div>
          </CardContent>
        </Card>
        <Card className="border-line bg-ivory">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-olive font-sans">Total Pago</p>
                <p className="text-2xl font-serif text-green-700 mt-1">{totalPaid.toLocaleString('pt-PT')}€</p>
              </div>
              <TrendingUp size={20} className="text-green-600" strokeWidth={1.5} />
            </div>
          </CardContent>
        </Card>
        <Card className="border-line bg-ivory">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-olive font-sans">Pendente</p>
                <p className="text-2xl font-serif text-ink mt-1">{totalPending.toLocaleString('pt-PT')}€</p>
              </div>
              <CircleDollarSign size={20} className="text-amber-500" strokeWidth={1.5} />
            </div>
          </CardContent>
        </Card>
        <Card className="border-line bg-ivory">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-olive font-sans">Em Atraso</p>
                <p className="text-2xl font-serif text-red-600 mt-1">{totalOverdue.toLocaleString('pt-PT')}€</p>
              </div>
              <Clock size={20} className="text-red-500" strokeWidth={1.5} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chart */}
      {chartData.length > 0 && (
        <Card className="border-line bg-ivory">
          <CardHeader>
            <CardTitle className="font-serif text-lg text-ink">Receitas por Mês</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#c8c1b2" />
                  <XAxis dataKey="month" stroke="#85816f" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#85816f" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v: number) => `${v / 1000}k`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#f1eee5', border: '1px solid #c8c1b2', borderRadius: '4px', fontSize: '12px' }}
                    formatter={(value: number) => [`${value.toLocaleString('pt-PT')}€`, 'Receita']}
                  />
                  <Bar dataKey="value" fill="#171814" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters + Table */}
      <Card className="border-line bg-ivory">
        <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-3">
          <CardTitle className="font-serif text-lg text-ink">Faturas ({filteredInvoices.length})</CardTitle>
          <div className="flex flex-wrap gap-2 items-center">
            <div className="relative">
              <Filter size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-olive" />
              <Input
                placeholder="Nº fatura..."
                value={searchNumber}
                onChange={e => setSearchNumber(e.target.value)}
                className="pl-7 bg-ivory border-line text-ink text-xs w-32 h-8"
              />
            </div>
            <select
              value={filterProject}
              onChange={e => setFilterProject(e.target.value)}
              className="px-2 py-1.5 bg-ivory border border-line rounded-md text-ink text-xs font-sans h-8"
            >
              <option value="">Todos projetos</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="px-2 py-1.5 bg-ivory border border-line rounded-md text-ink text-xs font-sans h-8"
            >
              <option value="">Todos estados</option>
              {STATUS_OPTIONS.map(s => <option key={s} value={s}>{statusLabels[s]}</option>)}
            </select>
            {(filterProject || filterStatus || searchNumber) && (
              <Button size="sm" variant="ghost" onClick={() => { setFilterProject(''); setFilterStatus(''); setSearchNumber(''); }} className="text-olive h-8 text-xs">
                <X size={12} className="mr-1" /> Limpar
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="border border-line rounded-md overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-line">
                  <TableHead className="text-olive font-sans">Nº</TableHead>
                  <TableHead className="text-olive font-sans">Projeto</TableHead>
                  <TableHead className="text-olive font-sans">Cliente</TableHead>
                  <TableHead className="text-olive font-sans">Valor</TableHead>
                  <TableHead className="text-olive font-sans">Estado</TableHead>
                  <TableHead className="text-olive font-sans">Emissão</TableHead>
                  <TableHead className="text-olive font-sans">Vencimento</TableHead>
                  <TableHead className="text-olive font-sans w-24">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInvoices.map(inv => {
                  const project = projects.find(p => p.id === inv.project_id);
                  const client = clients.find(c => c.id === inv.client_id);
                  const isOverdue = inv.status !== 'paga' && inv.due_date && new Date(inv.due_date) < new Date();
                  return (
                    <TableRow key={inv.id} className="border-line/50">
                      <TableCell className="text-ink font-sans text-sm font-medium">{inv.number}</TableCell>
                      <TableCell className="text-olive font-sans text-xs">{project?.name || '—'}</TableCell>
                      <TableCell className="text-olive font-sans text-xs">{client?.name || '—'}</TableCell>
                      <TableCell className="text-ink font-sans text-sm">{inv.amount.toLocaleString('pt-PT')}€</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`text-[10px] ${statusColors[inv.status || ''] || ''}`}>
                          {statusLabels[inv.status || ''] || inv.status}
                        </Badge>
                        {isOverdue && (
                          <span className="ml-1 text-[9px] text-red-600 font-sans">ATRASO</span>
                        )}
                      </TableCell>
                      <TableCell className="text-olive font-sans text-xs">
                        {inv.issue_date ? new Date(inv.issue_date).toLocaleDateString('pt-PT') : '—'}
                      </TableCell>
                      <TableCell className={`font-sans text-xs ${isOverdue ? 'text-red-600 font-medium' : 'text-olive'}`}>
                        {inv.due_date ? new Date(inv.due_date).toLocaleDateString('pt-PT') : '—'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {inv.status !== 'paga' && (
                            <button onClick={() => markAsPaid(inv.id)} className="p-1 hover:bg-green-50 rounded text-green-600" title="Marcar como paga">
                              <Check size={13} />
                            </button>
                          )}
                          <button onClick={() => openDialog(inv)} className="p-1 hover:bg-line/40 rounded" title="Editar">
                            <Edit3 size={13} className="text-olive" />
                          </button>
                          <button onClick={() => deleteInvoice(inv.id)} className="p-1 hover:bg-red-50 rounded" title="Eliminar">
                            <Trash2 size={13} className="text-red-400" />
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
          {filteredInvoices.length === 0 && (
            <p className="text-sm text-olive font-sans mt-4 text-center">
              {invoices.length === 0 ? 'Sem faturas registadas.' : 'Nenhuma fatura corresponde aos filtros.'}
            </p>
          )}
        </CardContent>
      </Card>

      {/* ─── Create / Edit Dialog ─── */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-ivory border-line max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-serif text-lg text-ink">
              {editingInvoice ? 'Editar Fatura' : 'Nova Fatura'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-olive text-xs font-sans">Nº Fatura *</label>
                <Input value={form.number} onChange={e => setForm({ ...form, number: e.target.value })} className="bg-ivory border-line text-ink mt-1 font-mono text-xs" />
              </div>
              <div>
                <label className="text-olive text-xs font-sans">Valor (€) *</label>
                <Input type="number" step="0.01" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} className="bg-ivory border-line text-ink mt-1" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-olive text-xs font-sans">Projeto</label>
                <select
                  value={form.project_id}
                  onChange={e => setForm({ ...form, project_id: e.target.value })}
                  className="w-full mt-1 px-3 py-2 bg-ivory border border-line rounded-md text-ink text-sm font-sans"
                >
                  <option value="">—</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-olive text-xs font-sans">Cliente</label>
                <select
                  value={form.client_id}
                  onChange={e => setForm({ ...form, client_id: e.target.value })}
                  className="w-full mt-1 px-3 py-2 bg-ivory border border-line rounded-md text-ink text-sm font-sans"
                >
                  <option value="">—</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-olive text-xs font-sans">Data Emissão</label>
                <Input type="date" value={form.issue_date} onChange={e => setForm({ ...form, issue_date: e.target.value })} className="bg-ivory border-line text-ink mt-1" />
              </div>
              <div>
                <label className="text-olive text-xs font-sans">Data Vencimento</label>
                <Input type="date" value={form.due_date} onChange={e => setForm({ ...form, due_date: e.target.value })} className="bg-ivory border-line text-ink mt-1" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-olive text-xs font-sans">Estado</label>
                <select
                  value={form.status}
                  onChange={e => setForm({ ...form, status: e.target.value })}
                  className="w-full mt-1 px-3 py-2 bg-ivory border border-line rounded-md text-ink text-sm font-sans"
                >
                  {STATUS_OPTIONS.map(s => <option key={s} value={s}>{statusLabels[s]}</option>)}
                </select>
              </div>
              <div>
                <label className="text-olive text-xs font-sans">Data Pagamento</label>
                <Input type="date" value={form.paid_date} onChange={e => setForm({ ...form, paid_date: e.target.value })} className="bg-ivory border-line text-ink mt-1" />
              </div>
            </div>

            <div>
              <label className="text-olive text-xs font-sans">Descrição</label>
              <Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} className="bg-ivory border-line text-ink mt-1" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} className="border-line text-ink">Cancelar</Button>
            <Button onClick={saveInvoice} className="bg-ink text-ivory hover:bg-ink/90">
              <Save size={14} className="mr-1" /> Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
