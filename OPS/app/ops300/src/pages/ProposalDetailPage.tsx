import { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, Link } from 'react-router';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  ArrowLeft, AlertTriangle, Download, Package, Wrench, Settings, Clock,
  Plus, Trash2, Pencil, Truck, CheckCircle2,
} from 'lucide-react';
import ProposalPDF from '@/components/ProposalPDF';
import type {
  Proposal, ProposalExperience, Client, Project, Supplier,
  ProposalItemSupplier, ServiceType, ItemSupplierStatus,
} from '@/types';

/* ─────────── constants ─────────── */

const statusColors: Record<string, string> = {
  draft: 'bg-line/40 text-ink',
  sent: 'bg-olive/30 text-ink',
  negotiation: 'bg-olive/40 text-ink',
  approved: 'bg-ink text-ivory',
  rejected: 'bg-red-100 text-red-800',
};

const statusLabels: Record<string, string> = {
  draft: 'Rascunho',
  sent: 'Enviada',
  negotiation: 'Negociação',
  approved: 'Aprovada',
  rejected: 'Rejeitada',
};

const ITEM_STATUS_COLORS: Record<ItemSupplierStatus, string> = {
  pending:  'bg-amber-100 text-amber-800 border-amber-200',
  quoted:   'bg-blue-100 text-blue-800 border-blue-200',
  ordered:  'bg-purple-100 text-purple-800 border-purple-200',
  delivered:'bg-green-100 text-green-800 border-green-200',
  cancelled:'bg-red-100 text-red-800 border-red-200',
};

const ITEM_STATUS_LABELS: Record<ItemSupplierStatus, string> = {
  pending:   'Pendente',
  quoted:    'Orçamentado',
  ordered:   'Encomendado',
  delivered: 'Entregue',
  cancelled: 'Cancelado',
};

const STATUS_FLOW: ItemSupplierStatus[] = ['pending', 'quoted', 'ordered', 'delivered', 'cancelled'];

const SERVICE_ICONS: Record<ServiceType, React.ElementType> = {
  purchase: Package,
  installation: Wrench,
  configuration: Settings,
  maintenance: Clock,
};

const SERVICE_LABELS: Record<ServiceType, string> = {
  purchase: 'Compra',
  installation: 'Instalação',
  configuration: 'Configuração',
  maintenance: 'Manutenção',
};

/* ─────────── component ─────────── */

export default function ProposalDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [experiences, setExperiences] = useState<ProposalExperience[]>([]);
  const [client, setClient] = useState<Client | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [itemSuppliers, setItemSuppliers] = useState<ProposalItemSupplier[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const pdfRef = useRef<HTMLDivElement>(null);

  /* dialog */
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'add' | 'edit'>('add');
  const [editingItemId, setEditingItemId] = useState<string | null>(null); // experience id (add) or pis id (edit)
  const [itemSupplierForm, setItemSupplierForm] = useState<Partial<ProposalItemSupplier>>({
    supplier_id: '', service_type: 'purchase', unit_cost: undefined, quantity: 1,
    lead_time_days: undefined, notes: '', status: 'pending',
  });

  /* ─────────── data fetch ─────────── */

  useEffect(() => {
    async function fetchData() {
      if (!id) return;
      try {
        setIsLoading(true);
        setError('');

        const { data: proposalData, error: proposalError } = await supabase
          .from('proposals')
          .select('*')
          .eq('id', id)
          .single();
        if (proposalError) throw proposalError;
        setProposal(proposalData);

        const [experiencesRes, clientRes, projectRes, suppliersRes, pisRes] = await Promise.all([
          supabase.from('proposal_experiences').select('*').eq('proposal_id', id).order('order_index', { ascending: true }),
          proposalData.client_id
            ? supabase.from('clients').select('*').eq('id', proposalData.client_id).single()
            : Promise.resolve({ data: null, error: null }),
          proposalData.project_id
            ? supabase.from('projects').select('*').eq('id', proposalData.project_id).single()
            : Promise.resolve({ data: null, error: null }),
          supabase.from('suppliers').select('*').eq('is_active', true).order('name', { ascending: true }),
          supabase.from('proposal_item_suppliers').select('*, supplier:suppliers(*)').eq('proposal_id', id),
        ]);

        setExperiences(experiencesRes.data || []);
        setClient(clientRes.data);
        setProject(projectRes.data);
        setSuppliers(suppliersRes.data || []);
        setItemSuppliers(pisRes.data || []);
      } catch (err: any) {
        setError(err.message || 'Erro ao carregar proposta');
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [id]);

  /* ─────────── helpers ─────────── */

  const pisByExperience = useMemo(() => {
    const map: Record<string, ProposalItemSupplier[]> = {};
    itemSuppliers.forEach(pis => {
      if (!map[pis.proposal_experience_id]) map[pis.proposal_experience_id] = [];
      map[pis.proposal_experience_id].push(pis);
    });
    return map;
  }, [itemSuppliers]);

  const supplierSummary = useMemo(() => {
    const map: Record<string, { supplier: Supplier; items: ProposalItemSupplier[]; total: number }> = {};
    itemSuppliers.forEach(pis => {
      if (!pis.supplier) return;
      if (!map[pis.supplier.id]) map[pis.supplier.id] = { supplier: pis.supplier, items: [], total: 0 };
      map[pis.supplier.id].items.push(pis);
      map[pis.supplier.id].total += (pis.total_cost || 0);
    });
    return Object.values(map).sort((a, b) => b.total - a.total);
  }, [itemSuppliers]);

  const refreshPIS = async () => {
    const { data } = await supabase
      .from('proposal_item_suppliers')
      .select('*, supplier:suppliers(*)')
      .eq('proposal_id', id);
    setItemSuppliers(data || []);
  };

  /* ─────────── CRUD ─────────── */

  async function saveItemSupplier() {
    if (!itemSupplierForm.supplier_id) return;
    try {
      const payload = {
        proposal_experience_id: dialogMode === 'add' ? editingItemId : itemSupplierForm.proposal_experience_id,
        proposal_id: id,
        supplier_id: itemSupplierForm.supplier_id,
        service_type: itemSupplierForm.service_type,
        unit_cost: itemSupplierForm.unit_cost || 0,
        quantity: itemSupplierForm.quantity || 1,
        total_cost: (itemSupplierForm.unit_cost || 0) * (itemSupplierForm.quantity || 1),
        lead_time_days: itemSupplierForm.lead_time_days,
        status: itemSupplierForm.status || 'pending',
        notes: itemSupplierForm.notes,
      };

      if (dialogMode === 'edit' && editingItemId) {
        const { error } = await supabase.from('proposal_item_suppliers').update(payload).eq('id', editingItemId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('proposal_item_suppliers').insert(payload);
        if (error) throw error;
      }

      setDialogOpen(false);
      await refreshPIS();
    } catch (err: any) {
      setError(err.message || 'Erro ao guardar fornecedor');
    }
  }

  async function deleteItemSupplier(pisId: string) {
    try {
      const { error } = await supabase.from('proposal_item_suppliers').delete().eq('id', pisId);
      if (error) throw error;
      await refreshPIS();
    } catch (err: any) {
      setError(err.message || 'Erro ao remover fornecedor');
    }
  }

  async function updateItemStatus(pisId: string, newStatus: ItemSupplierStatus) {
    try {
      const { error } = await supabase.from('proposal_item_suppliers').update({ status: newStatus }).eq('id', pisId);
      if (error) throw error;
      await refreshPIS();
    } catch (err: any) {
      setError(err.message || 'Erro ao atualizar status');
    }
  }

  /* ─────────── PDF ─────────── */

  async function generatePDF() {
    if (!pdfRef.current || !proposal) return;
    setGeneratingPdf(true);
    try {
      const html2pdf = (await import('html2pdf.js')).default;
      const opt = {
        margin: [15, 15, 15, 15] as [number, number, number, number],
        filename: `Proposta_${proposal.reference || proposal.id.slice(0, 8)}.pdf`,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const },
      };
      await html2pdf().set(opt).from(pdfRef.current).save();
    } catch (err) {
      console.error('PDF generation failed:', err);
    }
    setGeneratingPdf(false);
  }

  /* ─────────── derived values ─────────── */

  const includedTotal = experiences.filter(e => (e.amount || 0) > 0).reduce((s, e) => s + (e.amount || 0), 0);
  const suppliersTotal = itemSuppliers.reduce((s, pis) => s + (pis.total_cost || 0), 0);
  const vatRate = 0.23;
  const vatAmount = includedTotal * vatRate;
  const grandTotal = includedTotal + vatAmount;

  /* ─────────── render ─────────── */

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-9 w-32" />
        <Skeleton className="h-12 w-96" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  if (error || !proposal) {
    return (
      <div className="space-y-4">
        <Link to="/propostas">
          <Button variant="outline" size="sm" className="border-line">
            <ArrowLeft size={14} className="mr-1" /> Voltar
          </Button>
        </Link>
        {error ? (
          <div className="flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md p-4">
            <AlertTriangle size={16} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        ) : (
          <p className="text-olive font-sans">Proposta não encontrada.</p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Actions ── */}
      <div className="flex items-center gap-3">
        <Link to="/propostas">
          <Button variant="outline" size="sm" className="border-line text-ink hover:bg-ink hover:text-ivory">
            <ArrowLeft size={14} className="mr-1" /> Voltar
          </Button>
        </Link>
        <Button
          onClick={generatePDF}
          disabled={generatingPdf}
          size="sm"
          className="bg-ink text-ivory hover:bg-ink/90 font-sans"
        >
          {generatingPdf ? 'A gerar…' : <><Download size={14} className="mr-1" /> Exportar PDF</>}
        </Button>
      </div>

      {/* ── PDF hidden ── */}
      <div ref={pdfRef} className="hidden">
        <ProposalPDF
          proposal={proposal} client={client} project={project}
          experiences={experiences} itemSuppliers={itemSuppliers}
        />
      </div>
      <div>
        <div className="flex items-center gap-3">
          <h1 className="font-serif text-3xl text-ink">{proposal.title}</h1>
          <Badge variant="outline" className={`text-[10px] ${statusColors[proposal.status || ''] || ''}`}>
            {statusLabels[proposal.status || ''] || proposal.status}
          </Badge>
        </div>
        <p className="text-olive text-sm mt-1 font-sans">
          {client?.name || '—'} · {project?.name || '—'} · {(proposal.total_amount || 0).toLocaleString('pt-PT')}€
        </p>
        {proposal.payment_terms && (
          <p className="text-xs text-olive mt-1 font-sans">Condições: {proposal.payment_terms}</p>
        )}
      </div>

      {/* ── Summary Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-line bg-ivory">
          <CardContent className="p-4">
            <p className="text-[10px] text-olive uppercase font-sans">Valor Proposta</p>
            <p className="text-xl font-serif text-ink">{includedTotal.toLocaleString('pt-PT')}€</p>
          </CardContent>
        </Card>
        <Card className="border-line bg-ivory">
          <CardContent className="p-4">
            <p className="text-[10px] text-olive uppercase font-sans">Custo Fornecedores</p>
            <p className="text-xl font-serif text-ink">{suppliersTotal.toLocaleString('pt-PT')}€</p>
          </CardContent>
        </Card>
        <Card className="border-line bg-ivory">
          <CardContent className="p-4">
            <p className="text-[10px] text-olive uppercase font-sans">Margem Estimada</p>
            <p className={`text-xl font-serif ${includedTotal >= suppliersTotal ? 'text-green-700' : 'text-red-600'}`}>
              {(includedTotal - suppliersTotal).toLocaleString('pt-PT')}€
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ── Details ── */}
        <Card className="border-line bg-ivory">
          <CardHeader>
            <CardTitle className="font-serif text-lg text-ink">Detalhes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm font-sans">
            <div className="flex justify-between"><span className="text-olive">Referência</span><span className="text-ink">{proposal.reference || '—'}</span></div>
            <div className="flex justify-between"><span className="text-olive">Versão</span><span className="text-ink">{proposal.version}</span></div>
            <div className="flex justify-between"><span className="text-olive">Válida até</span><span className="text-ink">{proposal.valid_until || '—'}</span></div>
            <div className="flex justify-between"><span className="text-olive">Criada em</span><span className="text-ink">{proposal.created_at ? new Date(proposal.created_at).toLocaleDateString('pt-PT') : '—'}</span></div>
          </CardContent>
        </Card>

        {/* ── Prices ── */}
        <Card className="border-line bg-ivory">
          <CardHeader>
            <CardTitle className="font-serif text-lg text-ink">Preços por Experiência</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="border-line">
                  <TableHead className="text-olive font-sans">Experiência</TableHead>
                  <TableHead className="text-olive font-sans text-right">Preço</TableHead>
                  <TableHead className="text-olive font-sans">Descrição</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {experiences.map(e => (
                  <TableRow key={e.id} className="border-line/50">
                    <TableCell className="text-ink font-sans text-sm align-top">
                      <div className="flex items-center gap-2">
                        {e.name}
                        <button
                          onClick={() => {
                            setDialogMode('add');
                            setEditingItemId(e.id);
                            setItemSupplierForm({
                              supplier_id: '', service_type: 'purchase', unit_cost: undefined,
                              quantity: 1, lead_time_days: undefined, notes: '', status: 'pending',
                            });
                            setDialogOpen(true);
                          }}
                          className="text-olive hover:text-ink"
                          title="Adicionar fornecedor"
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                      {/* Fornecedores deste item */}
                      <div className="mt-1.5 space-y-1">
                        {(pisByExperience[e.id] || []).map(pis => (
                          <ItemSupplierRow
                            key={pis.id}
                            pis={pis}
                            onEdit={() => {
                              setDialogMode('edit');
                              setEditingItemId(pis.id);
                              setItemSupplierForm({
                                proposal_experience_id: pis.proposal_experience_id,
                                supplier_id: pis.supplier_id,
                                service_type: pis.service_type,
                                unit_cost: pis.unit_cost ?? undefined,
                                quantity: pis.quantity,
                                lead_time_days: pis.lead_time_days ?? undefined,
                                status: pis.status,
                                notes: pis.notes || '',
                              });
                              setDialogOpen(true);
                            }}
                            onDelete={() => deleteItemSupplier(pis.id)}
                            onStatusChange={s => updateItemStatus(pis.id, s)}
                          />
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-ink font-sans text-sm text-right align-top">
                      {(e.amount || 0).toLocaleString('pt-PT')}€
                    </TableCell>
                    <TableCell className="text-olive font-sans text-xs align-top">{e.description || '—'}</TableCell>
                  </TableRow>
                ))}
                <TableRow className="border-t-2 border-line">
                  <TableCell className="font-medium text-ink font-sans">Subtotal</TableCell>
                  <TableCell className="font-medium text-ink font-sans text-right">{includedTotal.toLocaleString('pt-PT')}€</TableCell>
                  <TableCell />
                </TableRow>
                <TableRow>
                  <TableCell className="text-olive font-sans text-sm">IVA (23%)</TableCell>
                  <TableCell className="text-olive font-sans text-sm text-right">{vatAmount.toLocaleString('pt-PT')}€</TableCell>
                  <TableCell />
                </TableRow>
                <TableRow className="border-t border-line">
                  <TableCell className="font-medium text-ink font-sans">Total</TableCell>
                  <TableCell className="font-medium text-ink font-sans text-right">{grandTotal.toLocaleString('pt-PT')}€</TableCell>
                  <TableCell />
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* ── Supplier Summary ── */}
      {supplierSummary.length > 0 && (
        <Card className="border-line bg-ivory">
          <CardHeader>
            <CardTitle className="font-serif text-lg text-ink">Resumo de Fornecedores</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="border-line">
                  <TableHead className="text-olive font-sans">Fornecedor</TableHead>
                  <TableHead className="text-olive font-sans">Serviços</TableHead>
                  <TableHead className="text-olive font-sans text-right">Total</TableHead>
                  <TableHead className="text-olive font-sans">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {supplierSummary.map(({ supplier, items, total }) => {
                  const statuses = [...new Set(items.map(i => i.status))];
                  return (
                    <TableRow key={supplier.id} className="border-line/50">
                      <TableCell className="text-ink font-sans text-sm">
                        <div className="font-medium">{supplier.name}</div>
                        <div className="text-[10px] text-olive">{supplier.country} · {supplier.lead_time_days}d lead time</div>
                      </TableCell>
                      <TableCell className="text-ink font-sans text-xs">
                        {[...new Set(items.map(i => SERVICE_LABELS[i.service_type as ServiceType]))].join(', ')}
                      </TableCell>
                      <TableCell className="text-ink font-sans text-sm text-right font-medium">
                        {total.toLocaleString('pt-PT')}€
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {statuses.map(s => (
                            <Badge key={s} variant="outline" className={`text-[10px] ${ITEM_STATUS_COLORS[s as ItemSupplierStatus]}`}>
                              {ITEM_STATUS_LABELS[s as ItemSupplierStatus]}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
                <TableRow className="border-t-2 border-line">
                  <TableCell className="font-medium text-ink font-sans">Total Fornecedores</TableCell>
                  <TableCell />
                  <TableCell className="font-medium text-ink font-sans text-right">
                    {suppliersTotal.toLocaleString('pt-PT')}€
                  </TableCell>
                  <TableCell />
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* ── Dialog ── */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md bg-ivory border-line">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl text-ink">
              {dialogMode === 'add' ? 'Adicionar Fornecedor' : 'Editar Fornecedor'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <label className="text-xs text-olive font-sans">Fornecedor</label>
              <select
                value={itemSupplierForm.supplier_id || ''}
                onChange={e => setItemSupplierForm({ ...itemSupplierForm, supplier_id: e.target.value })}
                className="w-full mt-1 px-3 py-2 bg-white border border-line rounded-md text-sm text-ink font-sans"
              >
                <option value="">Selecionar…</option>
                {suppliers.map(s => (
                  <option key={s.id} value={s.id}>{s.name} · {s.country}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-olive font-sans">Tipo de Serviço</label>
              <div className="flex flex-wrap gap-2 mt-1">
                {(Object.keys(SERVICE_LABELS) as ServiceType[]).map(svc => (
                  <button
                    key={svc}
                    onClick={() => setItemSupplierForm({ ...itemSupplierForm, service_type: svc })}
                    className={`text-xs px-3 py-1.5 rounded-md border transition-colors font-sans ${
                      itemSupplierForm.service_type === svc ? 'bg-ink text-ivory border-ink' : 'bg-white text-olive border-line hover:border-ink'
                    }`}
                  >
                    {SERVICE_LABELS[svc]}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-olive font-sans">Custo Unitário (€)</label>
                <Input
                  type="number"
                  value={itemSupplierForm.unit_cost || ''}
                  onChange={e => setItemSupplierForm({ ...itemSupplierForm, unit_cost: e.target.value ? parseFloat(e.target.value) : undefined })}
                  className="bg-white border-line"
                />
              </div>
              <div>
                <label className="text-xs text-olive font-sans">Quantidade</label>
                <Input
                  type="number"
                  value={itemSupplierForm.quantity || 1}
                  onChange={e => setItemSupplierForm({ ...itemSupplierForm, quantity: parseInt(e.target.value) || 1 })}
                  className="bg-white border-line"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-olive font-sans">Prazo (dias)</label>
                <Input
                  type="number"
                  value={itemSupplierForm.lead_time_days || ''}
                  onChange={e => setItemSupplierForm({ ...itemSupplierForm, lead_time_days: e.target.value ? parseInt(e.target.value) : undefined })}
                  className="bg-white border-line"
                />
              </div>
              <div>
                <label className="text-xs text-olive font-sans">Status</label>
                <select
                  value={itemSupplierForm.status || 'pending'}
                  onChange={e => setItemSupplierForm({ ...itemSupplierForm, status: e.target.value as ItemSupplierStatus })}
                  className="w-full mt-1 px-3 py-2 bg-white border border-line rounded-md text-sm text-ink font-sans"
                >
                  {STATUS_FLOW.map(s => (
                    <option key={s} value={s}>{ITEM_STATUS_LABELS[s]}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="text-xs text-olive font-sans">Notas</label>
              <Input
                value={itemSupplierForm.notes || ''}
                onChange={e => setItemSupplierForm({ ...itemSupplierForm, notes: e.target.value })}
                className="bg-white border-line"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setDialogOpen(false)} className="border-line">Cancelar</Button>
              <Button size="sm" onClick={saveItemSupplier} className="bg-ink text-ivory hover:bg-ink/90 font-sans">
                {dialogMode === 'add' ? 'Adicionar' : 'Guardar'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ─────────── sub-component: item-supplier row ─────────── */

function ItemSupplierRow({
  pis,
  onEdit,
  onDelete,
  onStatusChange,
}: {
  pis: ProposalItemSupplier;
  onEdit: () => void;
  onDelete: () => void;
  onStatusChange: (s: ItemSupplierStatus) => void;
}) {
  const SvcIcon = SERVICE_ICONS[pis.service_type as ServiceType];
  const currentIdx = STATUS_FLOW.indexOf(pis.status as ItemSupplierStatus);

  return (
    <div className="flex items-center gap-1.5 py-1 px-1.5 rounded-md bg-line/20 hover:bg-line/30 transition-colors group">
      <SvcIcon size={10} className="text-olive shrink-0" />
      <span className="text-[11px] text-ink font-medium">{pis.supplier?.name}</span>
      <span className="text-[10px] text-olive">· {(pis.unit_cost || 0).toLocaleString('pt-PT')}€ × {pis.quantity}</span>
      <span className="text-[10px] text-ink font-medium">= {(pis.total_cost || 0).toLocaleString('pt-PT')}€</span>
      {pis.lead_time_days && (
        <span className="text-[10px] text-olive flex items-center gap-0.5">
          <Truck size={9} /> {pis.lead_time_days}d
        </span>
      )}

      {/* Status badge */}
      <Badge variant="outline" className={`text-[9px] px-1 py-0 h-auto ${ITEM_STATUS_COLORS[pis.status as ItemSupplierStatus]}`}>
        {ITEM_STATUS_LABELS[pis.status as ItemSupplierStatus]}
      </Badge>

      {/* Status actions */}
      <div className="ml-auto flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        {/* Advance status */}
        {currentIdx < 3 && (
          <button
            onClick={() => onStatusChange(STATUS_FLOW[currentIdx + 1])}
            className="p-0.5 rounded hover:bg-green-100 text-green-600"
            title={`Avançar para ${ITEM_STATUS_LABELS[STATUS_FLOW[currentIdx + 1]]}`}
          >
            <CheckCircle2 size={10} />
          </button>
        )}
        {/* Edit */}
        <button onClick={onEdit} className="p-0.5 rounded hover:bg-olive/20 text-olive" title="Editar">
          <Pencil size={10} />
        </button>
        {/* Delete */}
        <button onClick={onDelete} className="p-0.5 rounded hover:bg-red-100 text-red-400" title="Remover">
          <Trash2 size={10} />
        </button>
      </div>
    </div>
  );
}
