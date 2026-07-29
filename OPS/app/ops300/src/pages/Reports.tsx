import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import {
  FileText, FolderOpen, CircleDollarSign, Wrench, Settings2,
  AlertTriangle, Download, TrendingUp, Clock, CheckCircle2, XCircle
} from 'lucide-react';
import {
  PieChart as RePieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart as ReBarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts';
import type { Proposal, Project, Invoice, MaintenanceTicket, SystemConfiguration, Client } from '@/types';

// ─── Helpers ───────────────────────────────────────────────

function toCSV(rows: Record<string, string | number | null>[], filename: string) {
  if (rows.length === 0) return;
  const headers = Object.keys(rows[0]);
  const csv = [
    headers.join(';'),
    ...rows.map(r => headers.map(h => {
      const v = r[h];
      return v == null ? '' : String(v).replace(/"/g, '""');
    }).join(';'))
  ].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
}

function formatCurrency(n: number) {
  return n.toLocaleString('pt-PT') + '€';
}

function formatDate(d: string | null) {
  return d ? new Date(d).toLocaleDateString('pt-PT') : '—';
}

function daysBetween(a: string, b: string) {
  const ms = new Date(b).getTime() - new Date(a).getTime();
  return Math.max(0, Math.round(ms / (1000 * 60 * 60 * 24)));
}

// ─── Recharts Pie ──────────────────────────────────────────

function PieChart({ data, colors }: { data: { label: string; value: number }[]; colors: string[] }) {
  if (data.length === 0) return <p className="text-xs text-olive font-sans">Sem dados</p>;
  return (
    <div className="flex items-center gap-4">
      <div className="w-28 h-28 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <RePieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="label"
              cx="50%" cy="50%"
              innerRadius={28}
              outerRadius={54}
              stroke="none"
              paddingAngle={2}
            >
              {data.map((_, i) => (
                <Cell key={i} fill={colors[i % colors.length]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number, name: string) => [`${value}`, name]}
              contentStyle={{ fontSize: '11px', borderRadius: '6px', border: '1px solid #e8e4db', fontFamily: 'sans-serif' }}
            />
          </RePieChart>
        </ResponsiveContainer>
      </div>
      <div className="space-y-1.5">
        {data.map((d, i) => (
          <div key={d.label} className="flex items-center gap-2 text-xs font-sans">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: colors[i % colors.length] }} />
            <span className="text-ink">{d.label}</span>
            <span className="text-olive">{d.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Recharts Bar ──────────────────────────────────────────

function BarChart({ data }: { data: { label: string; value: number }[] }) {
  if (data.length === 0) return <p className="text-xs text-olive font-sans">Sem dados</p>;
  return (
    <div className="h-48">
      <ResponsiveContainer width="100%" height="100%">
        <ReBarChart data={data} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e8e4db" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 10, fill: '#7a7568', fontFamily: 'sans-serif' }}
            axisLine={{ stroke: '#d9d4c9' }}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 10, fill: '#7a7568', fontFamily: 'sans-serif' }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k€`}
          />
          <Tooltip
            formatter={(value: number) => [`${value.toLocaleString('pt-PT')}€`, 'Receita']}
            contentStyle={{ fontSize: '11px', borderRadius: '6px', border: '1px solid #e8e4db', fontFamily: 'sans-serif' }}
          />
          <Bar dataKey="value" fill="#171814" radius={[4, 4, 0, 0]} />
        </ReBarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────

export default function Reports() {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [tickets, setTickets] = useState<MaintenanceTicket[]>([]);
  const [configs, setConfigs] = useState<SystemConfiguration[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [propStatus, setPropStatus] = useState<string>('all');
  const [propClient, setPropClient] = useState<string>('all');
  const [propDateFrom, setPropDateFrom] = useState('');
  const [propDateTo, setPropDateTo] = useState('');

  useEffect(() => {
    async function fetchData() {
      try {
        setIsLoading(true);
        setError('');
        const [pRes, prRes, iRes, tRes, cRes, clRes] = await Promise.all([
          supabase.from('proposals').select('*'),
          supabase.from('projects').select('*'),
          supabase.from('invoices').select('*'),
          supabase.from('maintenance_tickets').select('*'),
          supabase.from('system_configurations').select('*'),
          supabase.from('clients').select('*'),
        ]);
        if (pRes.error) throw pRes.error;
        if (prRes.error) throw prRes.error;
        if (iRes.error) throw iRes.error;
        if (tRes.error) throw tRes.error;
        if (cRes.error) throw cRes.error;
        if (clRes.error) throw clRes.error;
        setProposals(pRes.data || []);
        setProjects(prRes.data || []);
        setInvoices(iRes.data || []);
        setTickets(tRes.data || []);
        setConfigs(cRes.data || []);
        setClients(clRes.data || []);
      } catch (err: any) {
        setError(err.message || 'Erro ao carregar relatórios');
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, []);

  // ─── Derived data ────────────────────────────────────────

  const filteredProposals = useMemo(() => {
    return proposals.filter(p => {
      if (propStatus !== 'all' && p.status !== propStatus) return false;
      if (propClient !== 'all' && p.client_id !== propClient) return false;
      if (propDateFrom && p.created_at && new Date(p.created_at) < new Date(propDateFrom)) return false;
      if (propDateTo && p.created_at && new Date(p.created_at) > new Date(propDateTo + 'T23:59:59')) return false;
      return true;
    });
  }, [proposals, propStatus, propClient, propDateFrom, propDateTo]);

  const proposalTotal = filteredProposals.reduce((s, p) => s + (p.total_amount || 0), 0);
  const conversionRate = proposals.length > 0
    ? Math.round((proposals.filter(p => p.status === 'Aprovada').length / proposals.length) * 100)
    : 0;

  const projectStatusData = useMemo(() => {
    const map = new Map<string, number>();
    projects.forEach(p => {
      const k = p.status || 'Desconhecido';
      map.set(k, (map.get(k) || 0) + 1);
    });
    return Array.from(map.entries()).map(([label, value]) => ({ label, value }));
  }, [projects]);

  const projectBudgetVsActual = useMemo(() => {
    return projects.filter(p => p.budget && p.value).map(p => ({
      name: p.name,
      budget: p.budget || 0,
      actual: p.value || 0,
    }));
  }, [projects]);

  const invoiceStatusData = useMemo(() => {
    const map = new Map<string, number>();
    invoices.forEach(i => {
      const k = i.status || 'Desconhecido';
      map.set(k, (map.get(k) || 0) + 1);
    });
    return Array.from(map.entries()).map(([label, value]) => ({ label, value }));
  }, [invoices]);

  const revenueByMonth = useMemo(() => {
    const map = new Map<string, number>();
    invoices.forEach(i => {
      if (i.issue_date) {
        const d = new Date(i.issue_date);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        map.set(key, (map.get(key) || 0) + (i.amount || 0));
      }
    });
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b)).map(([label, value]) => ({ label, value }));
  }, [invoices]);

  const overdueInvoices = useMemo(() => {
    const now = new Date();
    return invoices.filter(i => i.due_date && i.status !== 'paga' && new Date(i.due_date) < now);
  }, [invoices]);

  const ticketSeverityData = useMemo(() => {
    const map = new Map<string, number>();
    tickets.forEach(t => {
      const k = t.severity || 'Não definido';
      map.set(k, (map.get(k) || 0) + 1);
    });
    return Array.from(map.entries()).map(([label, value]) => ({ label, value }));
  }, [tickets]);

  const avgResolutionDays = useMemo(() => {
    const resolved = tickets.filter(t => t.resolved_at && t.created_at);
    if (resolved.length === 0) return 0;
    const total = resolved.reduce((s, t) => s + daysBetween(t.created_at!, t.resolved_at!), 0);
    return Math.round(total / resolved.length);
  }, [tickets]);

  const openTickets = tickets.filter(t => t.status === 'Aberto' || t.status === 'Em atendimento');
  const closedTickets = tickets.filter(t => t.status === 'Resolvido' || t.status === 'Fechado');

  const templateTypeData = useMemo(() => {
    const map = new Map<string, number>();
    configs.forEach(c => {
      const k = c.template_type || 'custom';
      map.set(k, (map.get(k) || 0) + 1);
    });
    return Array.from(map.entries()).map(([label, value]) => ({ label, value }));
  }, [configs]);

  const roomCounts = useMemo(() => {
    const map = new Map<string, number>();
    configs.forEach(c => {
      (c.rooms || []).forEach((r: any) => {
        map.set(r.name, (map.get(r.name) || 0) + 1);
      });
    });
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]).slice(0, 6);
  }, [configs]);

  const integrationCounts = useMemo(() => {
    const map = new Map<string, number>();
    configs.forEach(c => {
      (c.integrations || []).forEach((i: any) => {
        map.set(i.system, (map.get(i.system) || 0) + 1);
      });
    });
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]).slice(0, 6);
  }, [configs]);

  const pieColors = ['#171814', '#85816f', '#c8c1b2', '#4a4a42', '#d4cfc5', '#2c2c24'];

  function exportProposalsCSV() {
    const rows = filteredProposals.map(p => {
      const client = clients.find(c => c.id === p.client_id);
      return {
        Referência: p.reference || '—',
        Título: p.title,
        Cliente: client?.name || '—',
        Estado: p.status || '—',
        'Valor Total': p.total_amount || 0,
        'Válida até': p.valid_until || '—',
        Criada: p.created_at ? new Date(p.created_at).toLocaleDateString('pt-PT') : '—',
      };
    });
    toCSV(rows, 'propostas.csv');
  }

  if (isLoading) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-10 w-48" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-64" />)}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <h1 className="font-serif text-3xl text-ink">Relatórios</h1>
        <div className="flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md p-4">
          <AlertTriangle size={16} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-3xl text-ink">Relatórios</h1>
        <p className="text-olive text-sm mt-1 font-sans">Centro de análise e estatísticas 300</p>
      </div>

      {/* ═══ PROPOSTAS ═══ */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <FileText size={18} className="text-olive" strokeWidth={1.5} />
          <h2 className="font-serif text-xl text-ink">Propostas</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <Card className="border-line bg-ivory">
            <CardContent className="p-4">
              <p className="text-[10px] uppercase tracking-wider text-olive font-sans">Total Propostas</p>
              <p className="text-2xl font-serif text-ink mt-1">{filteredProposals.length}</p>
            </CardContent>
          </Card>
          <Card className="border-line bg-ivory">
            <CardContent className="p-4">
              <p className="text-[10px] uppercase tracking-wider text-olive font-sans">Valor Total</p>
              <p className="text-2xl font-serif text-ink mt-1">{formatCurrency(proposalTotal)}</p>
            </CardContent>
          </Card>
          <Card className="border-line bg-ivory">
            <CardContent className="p-4">
              <p className="text-[10px] uppercase tracking-wider text-olive font-sans">Taxa de Conversão</p>
              <p className="text-2xl font-serif text-ink mt-1">{conversionRate}%</p>
            </CardContent>
          </Card>
          <Card className="border-line bg-ivory">
            <CardContent className="p-4 flex items-center justify-center">
              <Button onClick={exportProposalsCSV} variant="outline" className="border-line text-ink hover:bg-ink hover:text-ivory font-sans w-full">
                <Download size={14} className="mr-1" /> Exportar CSV
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card className="border-line bg-ivory">
          <CardHeader className="pb-2">
            <CardTitle className="font-serif text-base text-ink">Filtros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <Select value={propStatus} onValueChange={setPropStatus}>
                <SelectTrigger className="w-40 bg-ivory border-line text-ink text-xs font-sans">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os estados</SelectItem>
                  <SelectItem value="Rascunho">Rascunho</SelectItem>
                  <SelectItem value="Enviada">Enviada</SelectItem>
                  <SelectItem value="Negociação">Negociação</SelectItem>
                  <SelectItem value="Aprovada">Aprovada</SelectItem>
                  <SelectItem value="Rejeitada">Rejeitada</SelectItem>
                </SelectContent>
              </Select>
              <Select value={propClient} onValueChange={setPropClient}>
                <SelectTrigger className="w-48 bg-ivory border-line text-ink text-xs font-sans">
                  <SelectValue placeholder="Cliente" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os clientes</SelectItem>
                  {clients.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex items-center gap-2">
                <Input type="date" value={propDateFrom} onChange={e => setPropDateFrom(e.target.value)} className="w-36 bg-ivory border-line text-ink text-xs font-sans" />
                <span className="text-olive text-xs font-sans">a</span>
                <Input type="date" value={propDateTo} onChange={e => setPropDateTo(e.target.value)} className="w-36 bg-ivory border-line text-ink text-xs font-sans" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-line bg-ivory">
          <CardHeader className="pb-3">
            <CardTitle className="font-serif text-base text-ink">Lista de Propostas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border border-line rounded-md overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="border-line">
                    <TableHead className="text-olive font-sans text-xs">Ref</TableHead>
                    <TableHead className="text-olive font-sans text-xs">Título</TableHead>
                    <TableHead className="text-olive font-sans text-xs">Cliente</TableHead>
                    <TableHead className="text-olive font-sans text-xs">Estado</TableHead>
                    <TableHead className="text-olive font-sans text-xs text-right">Valor</TableHead>
                    <TableHead className="text-olive font-sans text-xs">Válida até</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProposals.map(p => {
                    const client = clients.find(c => c.id === p.client_id);
                    return (
                      <TableRow key={p.id} className="border-line/50">
                        <TableCell className="text-ink font-sans text-xs">{p.reference || '—'}</TableCell>
                        <TableCell className="text-ink font-sans text-sm">{p.title}</TableCell>
                        <TableCell className="text-olive font-sans text-xs">{client?.name || '—'}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`text-[10px] ${
                            p.status === 'Aprovada' ? 'bg-ink text-ivory' :
                            p.status === 'Rejeitada' ? 'bg-red-100 text-red-800' :
                            p.status === 'Enviada' ? 'bg-olive/30 text-ink' :
                            p.status === 'Negociação' ? 'bg-olive/40 text-ink' :
                            'bg-line/40 text-ink'
                          }`}>
                            {p.status || '—'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-ink font-sans text-sm text-right">{formatCurrency(p.total_amount || 0)}</TableCell>
                        <TableCell className="text-olive font-sans text-xs">{formatDate(p.valid_until)}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
            {filteredProposals.length === 0 && <p className="text-sm text-olive font-sans mt-4">Nenhuma proposta encontrada.</p>}
          </CardContent>
        </Card>
      </section>

      {/* ═══ PROJETOS ═══ */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <FolderOpen size={18} className="text-olive" strokeWidth={1.5} />
          <h2 className="font-serif text-xl text-ink">Projetos</h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="border-line bg-ivory lg:col-span-1">
            <CardHeader className="pb-3">
              <CardTitle className="font-serif text-base text-ink">Distribuição por Estado</CardTitle>
            </CardHeader>
            <CardContent>
              <PieChart data={projectStatusData} colors={pieColors} />
            </CardContent>
          </Card>

          <Card className="border-line bg-ivory lg:col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="font-serif text-base text-ink">Orçamento vs. Real</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {projectBudgetVsActual.slice(0, 6).map(p => {
                  const ratio = p.budget > 0 ? Math.min((p.actual / p.budget) * 100, 100) : 0;
                  return (
                    <div key={p.name} className="space-y-1">
                      <div className="flex justify-between text-xs font-sans">
                        <span className="text-ink">{p.name}</span>
                        <span className="text-olive">{formatCurrency(p.actual)} / {formatCurrency(p.budget)}</span>
                      </div>
                      <div className="h-2 bg-line/30 rounded-full overflow-hidden">
                        <div className="h-full bg-ink rounded-full" style={{ width: `${ratio}%` }} />
                      </div>
                    </div>
                  );
                })}
                {projectBudgetVsActual.length === 0 && <p className="text-sm text-olive font-sans">Sem dados de orçamento.</p>}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border-line bg-ivory">
          <CardHeader className="pb-3">
            <CardTitle className="font-serif text-base text-ink">Linha Temporal</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border border-line rounded-md overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="border-line">
                    <TableHead className="text-olive font-sans text-xs">Projeto</TableHead>
                    <TableHead className="text-olive font-sans text-xs">Cliente</TableHead>
                    <TableHead className="text-olive font-sans text-xs">Estado</TableHead>
                    <TableHead className="text-olive font-sans text-xs">Início</TableHead>
                    <TableHead className="text-olive font-sans text-xs">Fim Previsto</TableHead>
                    <TableHead className="text-olive font-sans text-xs text-right">Valor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {projects.map(p => {
                    const client = clients.find(c => c.id === p.client_id);
                    return (
                      <TableRow key={p.id} className="border-line/50">
                        <TableCell className="text-ink font-sans text-sm">{p.name}</TableCell>
                        <TableCell className="text-olive font-sans text-xs">{client?.name || '—'}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-[10px] bg-line/40 text-ink">{p.status || '—'}</Badge>
                        </TableCell>
                        <TableCell className="text-olive font-sans text-xs">{formatDate(p.start_date)}</TableCell>
                        <TableCell className="text-olive font-sans text-xs">{formatDate(p.end_date)}</TableCell>
                        <TableCell className="text-ink font-sans text-sm text-right">{formatCurrency(p.value || 0)}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* ═══ FINANCEIRO ═══ */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <CircleDollarSign size={18} className="text-olive" strokeWidth={1.5} />
          <h2 className="font-serif text-xl text-ink">Financeiro</h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="border-line bg-ivory">
            <CardHeader className="pb-3">
              <CardTitle className="font-serif text-base text-ink">Estado das Faturas</CardTitle>
            </CardHeader>
            <CardContent>
              <PieChart data={invoiceStatusData} colors={pieColors} />
            </CardContent>
          </Card>

          <Card className="border-line bg-ivory lg:col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="font-serif text-base text-ink">Receita por Mês</CardTitle>
            </CardHeader>
            <CardContent>
              {revenueByMonth.length > 0 ? (
                <BarChart data={revenueByMonth} />
              ) : (
                <p className="text-sm text-olive font-sans">Sem dados de faturação.</p>
              )}
            </CardContent>
          </Card>
        </div>

        {overdueInvoices.length > 0 && (
          <Card className="border-red-200 bg-red-50">
            <CardHeader className="pb-3">
              <CardTitle className="font-serif text-base text-red-800 flex items-center gap-2">
                <AlertTriangle size={16} /> Faturas Vencidas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border border-red-200 rounded-md overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="border-red-200">
                      <TableHead className="text-red-800 font-sans text-xs">Nº</TableHead>
                      <TableHead className="text-red-800 font-sans text-xs">Projeto</TableHead>
                      <TableHead className="text-red-800 font-sans text-xs text-right">Valor</TableHead>
                      <TableHead className="text-red-800 font-sans text-xs">Vencimento</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {overdueInvoices.map(inv => {
                      const project = projects.find(p => p.id === inv.project_id);
                      return (
                        <TableRow key={inv.id} className="border-red-100">
                          <TableCell className="text-red-900 font-sans text-sm">{inv.number}</TableCell>
                          <TableCell className="text-red-700 font-sans text-xs">{project?.name || '—'}</TableCell>
                          <TableCell className="text-red-900 font-sans text-sm text-right">{formatCurrency(inv.amount)}</TableCell>
                          <TableCell className="text-red-700 font-sans text-xs">{formatDate(inv.due_date)}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}
      </section>

      {/* ═══ MANUTENÇÃO ═══ */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Wrench size={18} className="text-olive" strokeWidth={1.5} />
          <h2 className="font-serif text-xl text-ink">Manutenção</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <Card className="border-line bg-ivory">
            <CardContent className="p-4 flex items-center gap-3">
              <Clock size={18} className="text-olive" strokeWidth={1.5} />
              <div>
                <p className="text-[10px] uppercase tracking-wider text-olive font-sans">Tempo Médio Resolução</p>
                <p className="text-xl font-serif text-ink mt-0.5">{avgResolutionDays} dias</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-line bg-ivory">
            <CardContent className="p-4 flex items-center gap-3">
              <CheckCircle2 size={18} className="text-olive" strokeWidth={1.5} />
              <div>
                <p className="text-[10px] uppercase tracking-wider text-olive font-sans">Resolvidos</p>
                <p className="text-xl font-serif text-ink mt-0.5">{closedTickets.length}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-line bg-ivory">
            <CardContent className="p-4 flex items-center gap-3">
              <XCircle size={18} className="text-olive" strokeWidth={1.5} />
              <div>
                <p className="text-[10px] uppercase tracking-wider text-olive font-sans">Abertos</p>
                <p className="text-xl font-serif text-ink mt-0.5">{openTickets.length}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-line bg-ivory">
            <CardContent className="p-4 flex items-center gap-3">
              <TrendingUp size={18} className="text-olive" strokeWidth={1.5} />
              <div>
                <p className="text-[10px] uppercase tracking-wider text-olive font-sans">Total Tickets</p>
                <p className="text-xl font-serif text-ink mt-0.5">{tickets.length}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="border-line bg-ivory">
            <CardHeader className="pb-3">
              <CardTitle className="font-serif text-base text-ink">Severidade dos Tickets</CardTitle>
            </CardHeader>
            <CardContent>
              <PieChart data={ticketSeverityData} colors={['#171814', '#85816f', '#c8c1b2', '#d4cfc5']} />
            </CardContent>
          </Card>

          <Card className="border-line bg-ivory">
            <CardHeader className="pb-3">
              <CardTitle className="font-serif text-base text-ink">Tickets Recentes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {tickets.slice(0, 6).map(tk => {
                  const project = projects.find(p => p.id === tk.project_id);
                  return (
                    <div key={tk.id} className="flex items-start justify-between border border-line rounded-md p-3">
                      <div>
                        <p className="text-sm font-medium text-ink font-sans">{tk.title}</p>
                        <p className="text-xs text-olive font-sans">{project?.name || '—'} · {formatDate(tk.created_at)}</p>
                      </div>
                      <div className="flex gap-1.5">
                        <Badge variant="outline" className={`text-[10px] ${
                          tk.severity === 'Crítico' ? 'border-red-400 text-red-700 bg-red-50' :
                          tk.severity === 'Alto' ? 'border-ink text-ink' :
                          tk.severity === 'Médio' ? 'border-olive text-ink' :
                          'border-line text-olive'
                        }`}>{tk.severity || '—'}</Badge>
                        <Badge variant="outline" className={`text-[10px] ${
                          tk.status === 'Aberto' ? 'bg-red-50 text-red-700' :
                          tk.status === 'Resolvido' || tk.status === 'Fechado' ? 'bg-ink text-ivory' :
                          'bg-olive/20 text-ink'
                        }`}>{tk.status || '—'}</Badge>
                      </div>
                    </div>
                  );
                })}
                {tickets.length === 0 && <p className="text-sm text-olive font-sans">Sem tickets.</p>}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* ═══ SISTEMAS ═══ */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Settings2 size={18} className="text-olive" strokeWidth={1.5} />
          <h2 className="font-serif text-xl text-ink">Sistemas</h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="border-line bg-ivory">
            <CardHeader className="pb-3">
              <CardTitle className="font-serif text-base text-ink">Templates</CardTitle>
            </CardHeader>
            <CardContent>
              <PieChart data={templateTypeData} colors={pieColors} />
            </CardContent>
          </Card>

          <Card className="border-line bg-ivory">
            <CardHeader className="pb-3">
              <CardTitle className="font-serif text-base text-ink">Divisões Mais Configuradas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {roomCounts.map(([name, count]) => (
                  <div key={name} className="flex items-center justify-between text-xs font-sans">
                    <span className="text-ink">{name}</span>
                    <span className="text-olive">{count} config.</span>
                  </div>
                ))}
                {roomCounts.length === 0 && <p className="text-sm text-olive font-sans">Sem dados.</p>}
              </div>
            </CardContent>
          </Card>

          <Card className="border-line bg-ivory">
            <CardHeader className="pb-3">
              <CardTitle className="font-serif text-base text-ink">Integrações Populares</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {integrationCounts.map(([name, count]) => (
                  <div key={name} className="flex items-center justify-between text-xs font-sans">
                    <span className="text-ink">{name}</span>
                    <span className="text-olive">{count}×</span>
                  </div>
                ))}
                {integrationCounts.length === 0 && <p className="text-sm text-olive font-sans">Sem dados.</p>}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
