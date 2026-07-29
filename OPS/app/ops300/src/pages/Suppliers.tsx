import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Search, UsersRound, Globe, Mail, Phone, Clock, Package, Wrench, Settings, ExternalLink, Plus, AlertTriangle } from 'lucide-react';
import { toastSuccess, toastError } from '@/lib/toast';
import type { Supplier, ServiceType } from '@/types';

const SERVICE_LABELS: Record<ServiceType, { label: string; icon: React.ElementType; color: string }> = {
  purchase: { label: 'Compra', icon: Package, color: 'bg-olive/20 text-ink' },
  installation: { label: 'Instalação', icon: Wrench, color: 'bg-line/40 text-ink' },
  configuration: { label: 'Configuração', icon: Settings, color: 'bg-amber-100/50 text-ink' },
  maintenance: { label: 'Manutenção', icon: Clock, color: 'bg-green-100/50 text-ink' },
};

export default function Suppliers() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Supplier | null>(null);

  // Form state
  const [form, setForm] = useState<Partial<Supplier>>({
    name: '',
    website: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    country: '',
    contact_name: '',
    contact_email: '',
    contact_phone: '',
    lead_time_days: undefined,
    services: [],
    notes: '',
    is_active: true,
  });

  useEffect(() => {
    fetchSuppliers();
  }, []);

  async function fetchSuppliers() {
    try {
      setIsLoading(true);
      setError('');
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      setSuppliers(data || []);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar fornecedores');
    } finally {
      setIsLoading(false);
    }
  }

  function openCreate() {
    setEditing(null);
    setForm({
      name: '', website: '', email: '', phone: '', address: '', city: '', country: '',
      contact_name: '', contact_email: '', contact_phone: '', lead_time_days: undefined,
      services: [], notes: '', is_active: true,
    });
    setDialogOpen(true);
  }

  function openEdit(s: Supplier) {
    setEditing(s);
    setForm({ ...s });
    setDialogOpen(true);
  }

  async function save() {
    if (!form.name) return;
    try {
      if (editing) {
        const { error } = await supabase.from('suppliers').update(form).eq('id', editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('suppliers').insert(form);
        if (error) throw error;
      }
      setDialogOpen(false);
      toastSuccess(editing ? 'Fornecedor atualizado' : 'Fornecedor criado', form.name || '');
      await fetchSuppliers();
    } catch (err: any) {
      setError(err.message || 'Erro ao guardar');
      toastError('Erro ao guardar fornecedor', err.message);
    }
  }

  const filtered = suppliers.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.country?.toLowerCase().includes(search.toLowerCase()) ||
    s.city?.toLowerCase().includes(search.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-48" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl text-ink">Fornecedores</h1>
          <p className="text-olive text-sm mt-1 font-sans">Gestão de fornecedores e parceiros</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-olive" strokeWidth={1.5} />
            <Input
              placeholder="Pesquisar..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 bg-ivory border-line text-ink placeholder:text-olive/60"
            />
          </div>
          <Button onClick={openCreate} size="sm" className="bg-ink text-ivory hover:bg-ink/90 font-sans shrink-0">
            <Plus size={14} className="mr-1" /> Novo
          </Button>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md p-4">
          <AlertTriangle size={16} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(s => (
          <Card key={s.id} className="border-line bg-ivory hover:shadow-sm transition-shadow cursor-pointer" onClick={() => openEdit(s)}>
            <CardContent className="p-5 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-serif text-lg text-ink">{s.name}</h3>
                  {s.country && <p className="text-xs text-olive font-sans">{s.country}{s.city ? ` · ${s.city}` : ''}</p>}
                </div>
                {s.is_active ? (
                  <Badge variant="outline" className="text-[10px] bg-green-100/50 text-green-700">Ativo</Badge>
                ) : (
                  <Badge variant="outline" className="text-[10px] bg-line/40 text-olive">Inativo</Badge>
                )}
              </div>

              <div className="flex flex-wrap gap-1.5">
                {(s.services || []).map((svc: ServiceType) => {
                  const cfg = SERVICE_LABELS[svc];
                  const Icon = cfg.icon;
                  return (
                    <span key={svc} className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full ${cfg.color} font-sans`}>
                      <Icon size={10} />
                      {cfg.label}
                    </span>
                  );
                })}
              </div>

              <div className="space-y-1.5 text-sm font-sans">
                {s.lead_time_days && (
                  <div className="flex items-center gap-2 text-olive">
                    <Clock size={12} strokeWidth={1.5} />
                    <span className="text-xs">Prazo médio: {s.lead_time_days} dias</span>
                  </div>
                )}
                {s.email && (
                  <div className="flex items-center gap-2 text-olive">
                    <Mail size={12} strokeWidth={1.5} />
                    <a href={`mailto:${s.email}`} className="text-xs hover:text-ink transition-colors" onClick={e => e.stopPropagation()}>{s.email}</a>
                  </div>
                )}
                {s.phone && (
                  <div className="flex items-center gap-2 text-olive">
                    <Phone size={12} strokeWidth={1.5} />
                    <span className="text-xs">{s.phone}</span>
                  </div>
                )}
                {s.website && (
                  <div className="flex items-center gap-2 text-olive">
                    <Globe size={12} strokeWidth={1.5} />
                    <a href={s.website} target="_blank" rel="noopener noreferrer" className="text-xs hover:text-ink transition-colors flex items-center gap-0.5" onClick={e => e.stopPropagation()}>
                      Website <ExternalLink size={8} />
                    </a>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filtered.length === 0 && !isLoading && (
        <div className="text-center py-12 border border-dashed border-line rounded-md">
          <UsersRound size={32} className="mx-auto text-olive/50 mb-3" strokeWidth={1.5} />
          <p className="text-sm text-olive font-sans">Nenhum fornecedor encontrado.</p>
          <p className="text-xs text-olive/60 font-sans mt-1">Aplica a migration SQL primeiro para criar a tabela.</p>
        </div>
      )}

      {/* Dialog Create/Edit */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto bg-ivory border-line">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl text-ink">
              {editing ? 'Editar Fornecedor' : 'Novo Fornecedor'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <label className="text-xs text-olive font-sans">Nome *</label>
              <Input value={form.name || ''} onChange={e => setForm({ ...form, name: e.target.value })} className="bg-white border-line" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-olive font-sans">Website</label>
                <Input value={form.website || ''} onChange={e => setForm({ ...form, website: e.target.value })} className="bg-white border-line" />
              </div>
              <div>
                <label className="text-xs text-olive font-sans">Prazo médio (dias)</label>
                <Input type="number" value={form.lead_time_days || ''} onChange={e => setForm({ ...form, lead_time_days: e.target.value ? parseInt(e.target.value) : undefined })} className="bg-white border-line" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-olive font-sans">Email</label>
                <Input value={form.email || ''} onChange={e => setForm({ ...form, email: e.target.value })} className="bg-white border-line" />
              </div>
              <div>
                <label className="text-xs text-olive font-sans">Telefone</label>
                <Input value={form.phone || ''} onChange={e => setForm({ ...form, phone: e.target.value })} className="bg-white border-line" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-olive font-sans">Cidade</label>
                <Input value={form.city || ''} onChange={e => setForm({ ...form, city: e.target.value })} className="bg-white border-line" />
              </div>
              <div>
                <label className="text-xs text-olive font-sans">País</label>
                <Input value={form.country || ''} onChange={e => setForm({ ...form, country: e.target.value })} className="bg-white border-line" />
              </div>
            </div>
            <div>
              <label className="text-xs text-olive font-sans">Morada</label>
              <Input value={form.address || ''} onChange={e => setForm({ ...form, address: e.target.value })} className="bg-white border-line" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-olive font-sans">Contacto (nome)</label>
                <Input value={form.contact_name || ''} onChange={e => setForm({ ...form, contact_name: e.target.value })} className="bg-white border-line" />
              </div>
              <div>
                <label className="text-xs text-olive font-sans">Contacto (email)</label>
                <Input value={form.contact_email || ''} onChange={e => setForm({ ...form, contact_email: e.target.value })} className="bg-white border-line" />
              </div>
            </div>
            <div>
              <label className="text-xs text-olive font-sans">Serviços</label>
              <div className="flex flex-wrap gap-2 mt-1">
                {(Object.keys(SERVICE_LABELS) as ServiceType[]).map(svc => {
                  const active = (form.services || []).includes(svc);
                  const cfg = SERVICE_LABELS[svc];
                  return (
                    <button
                      key={svc}
                      onClick={() => {
                        const current = form.services || [];
                        const next = active ? current.filter(x => x !== svc) : [...current, svc];
                        setForm({ ...form, services: next });
                      }}
                      className={`text-xs px-3 py-1.5 rounded-md border transition-colors font-sans ${
                        active ? 'bg-ink text-ivory border-ink' : 'bg-white text-olive border-line hover:border-ink'
                      }`}
                    >
                      {cfg.label}
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <label className="text-xs text-olive font-sans">Notas</label>
              <Input value={form.notes || ''} onChange={e => setForm({ ...form, notes: e.target.value })} className="bg-white border-line" />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={e => setForm({ ...form, is_active: e.target.checked })}
                className="rounded border-line"
              />
              <span className="text-sm text-ink font-sans">Ativo</span>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setDialogOpen(false)} className="border-line">Cancelar</Button>
              <Button size="sm" onClick={save} className="bg-ink text-ivory hover:bg-ink/90 font-sans">Guardar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
