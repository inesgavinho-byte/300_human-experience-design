import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { supabase } from '@/lib/supabase';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Search, Package, AlertTriangle, Link2, ExternalLink, FileText,
  Image as ImageIcon, ChevronDown, ChevronUp, Wifi, HardDrive,
  ShieldCheck, AlertCircle, CheckCircle2, MapPin, Building2,
  Router, ArrowRight,
} from 'lucide-react';
import EquipmentImporter from '@/components/equipment/EquipmentImporter';
import type { Equipment, EquipmentCategory, EquipmentRelationship } from '@/types';

/* ─── Status indicator colors ─── */
const statusConfig: Record<string, { color: string; bg: string; icon: React.ElementType; label: string }> = {
  online:  { color: 'text-green-600', bg: 'bg-green-500', icon: CheckCircle2, label: 'Online' },
  offline: { color: 'text-olive/40', bg: 'bg-olive/30', icon: AlertCircle, label: 'Offline' },
  warning: { color: 'text-amber-600', bg: 'bg-amber-500', icon: AlertTriangle, label: 'Atenção' },
  error:   { color: 'text-red-600', bg: 'bg-red-500', icon: AlertCircle, label: 'Erro' },
  unknown: { color: 'text-olive/40', bg: 'bg-olive/20', icon: AlertCircle, label: 'Desconhecido' },
};

/* ─── Network zone icons ─── */
function NetworkZoneIcon({ zone }: { zone?: string | null }) {
  if (!zone) return <Wifi size={12} className="text-olive/40" strokeWidth={1.5} />;
  const z = zone.toLowerCase();
  if (z.includes('knx')) return <Router size={12} className="text-olive" strokeWidth={1.5} />;
  if (z.includes('wifi') || z.includes('wi-fi')) return <Wifi size={12} className="text-blue-500" strokeWidth={1.5} />;
  if (z.includes('thread') || z.includes('matter')) return <Router size={12} className="text-purple-500" strokeWidth={1.5} />;
  return <Wifi size={12} className="text-olive" strokeWidth={1.5} />;
}

/* ═════════════════════════════════════════════
   CATALOG — Equipment as rich objects
   ═════════════════════════════════════════════ */
export default function Catalog() {
  const navigate = useNavigate();
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [categories, setCategories] = useState<EquipmentCategory[]>([]);
  const [projects, setProjects] = useState<Array<{ id: string; name: string }>>([]);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [importerOpen, setImporterOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Equipment | null>(null);
  const [selectedRelations, setSelectedRelations] = useState<EquipmentRelationship[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setIsLoading(true);
        setError('');

        const [equipmentRes, categoriesRes, projectsRes] = await Promise.all([
          supabase.from('equipment').select('*').order('created_at', { ascending: false }),
          supabase.from('equipment_categories').select('*').order('order_index', { ascending: true }),
          supabase.from('projects').select('id, name'),
        ]);

        if (equipmentRes.error) throw equipmentRes.error;
        if (categoriesRes.error) throw categoriesRes.error;
        if (projectsRes.error) throw projectsRes.error;

        setEquipment(equipmentRes.data || []);
        setCategories(categoriesRes.data || []);
        setProjects(projectsRes.data || []);
      } catch (err: any) {
        setError(err.message || 'Erro ao carregar catálogo');
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, []);

  async function loadRelations(equipmentId: string) {
    const { data } = await supabase
      .from('equipment_relationships')
      .select('*, target:target_equipment_id(id, name, brand, reference, image_url)')
      .eq('source_equipment_id', equipmentId);
    setSelectedRelations((data || []) as unknown as EquipmentRelationship[]);
  }

  function refreshEquipment() {
    supabase.from('equipment').select('*').then(res => {
      if (res.data) setEquipment(res.data);
    });
  }

  const filtered = equipment.filter(e => {
    const matchesSearch =
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      (e.reference || '').toLowerCase().includes(search.toLowerCase()) ||
      (e.brand || '').toLowerCase().includes(search.toLowerCase()) ||
      (e.ip_address || '').includes(search) ||
      (e.mac_address || '').toLowerCase().includes(search.toLowerCase());
    const matchesCat = catFilter === null || e.category_id === catFilter;
    const matchesStatus = statusFilter === null || e.status === statusFilter;
    return matchesSearch && matchesCat && matchesStatus;
  });

  const onlineCount = equipment.filter(e => e.status === 'online').length;
  const offlineCount = equipment.filter(e => e.status === 'offline').length;
  const warningCount = equipment.filter(e => e.status === 'warning' || e.status === 'error').length;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="flex gap-4">
          <Skeleton className="h-10 w-80" />
          <Skeleton className="h-10 w-32" />
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <h1 className="font-serif text-3xl text-ink">Catálogo</h1>
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
      <div>
        <h1 className="font-serif text-3xl text-ink">Catálogo</h1>
        <p className="text-olive text-sm mt-1 font-sans">
          {equipment.length} equipamentos · {onlineCount} online · {offlineCount} offline · {warningCount} alerta(s)
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-olive" strokeWidth={1.5} />
          <Input
            placeholder="Pesquisar nome, referência, IP, MAC..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 bg-ivory border-line text-ink placeholder:text-olive/60"
          />
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <Button variant="outline" onClick={() => setImporterOpen(true)} className="border-line text-ink font-sans">
            <Link2 size={16} className="mr-1.5" />
            Importar via Link
          </Button>
          <button
            onClick={() => setCatFilter(null)}
            className={`px-3 py-1 text-xs rounded-full border font-sans ${catFilter === null ? 'bg-ink text-ivory border-ink' : 'border-line text-olive hover:border-ink'}`}
          >
            Todos
          </button>
          {categories.map(c => (
            <button
              key={c.id}
              onClick={() => setCatFilter(c.id)}
              className={`px-3 py-1 text-xs rounded-full border font-sans ${catFilter === c.id ? 'bg-ink text-ivory border-ink' : 'border-line text-olive hover:border-ink'}`}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>

      {/* Status filter chips */}
      <div className="flex gap-2 flex-wrap">
        {(['online', 'offline', 'warning', 'error', 'unknown'] as const).map(s => {
          const count = equipment.filter(e => e.status === s).length;
          if (count === 0) return null;
          const cfg = statusConfig[s];
          const Icon = cfg.icon;
          return (
            <button
              key={s}
              onClick={() => setStatusFilter(statusFilter === s ? null : s)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-sans border transition-colors ${
                statusFilter === s
                  ? 'bg-ink text-ivory border-ink'
                  : 'border-line text-olive hover:border-ink/50'
              }`}
            >
              <Icon size={12} className={statusFilter === s ? 'text-ivory' : cfg.color} strokeWidth={1.5} />
              {cfg.label} · {count}
            </button>
          );
        })}
      </div>

      {/* Equipment Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map(e => (
          <EquipmentCard
            key={e.id}
            equipment={e}
            category={categories.find(c => c.id === e.category_id)}
            project={projects.find(p => p.id === e.project_id)}
            isExpanded={expandedId === e.id}
            onToggle={() => setExpandedId(expandedId === e.id ? null : e.id)}
            onSelect={() => {
              setSelectedItem(e);
              loadRelations(e.id);
            }}
          />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12">
          <Package size={32} className="mx-auto text-olive/30 mb-3" strokeWidth={1.5} />
          <p className="text-sm text-olive font-sans">Nenhum equipamento encontrado.</p>
          <Button variant="outline" onClick={() => setImporterOpen(true)} className="mt-3 border-line text-ink font-sans">
            <Link2 size={16} className="mr-1.5" />
            Importar primeiro equipamento
          </Button>
        </div>
      )}

      {/* Detail Dialog */}
      <Dialog open={!!selectedItem} onOpenChange={() => { setSelectedItem(null); setSelectedRelations([]); }}>
        <DialogContent className="max-w-xl bg-ivory border-line max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-serif text-lg text-ink flex items-center gap-2">
              {selectedItem && (
                <StatusDot status={selectedItem.status || 'unknown'} size={10} />
              )}
              {selectedItem?.name}
            </DialogTitle>
          </DialogHeader>
          {selectedItem && (
            <EquipmentDetail
              equipment={selectedItem}
              category={categories.find(c => c.id === selectedItem.category_id)}
              project={projects.find(p => p.id === selectedItem.project_id)}
              relations={selectedRelations}
              onNavigateProject={() => selectedItem.project_id && navigate(`/projetos/${selectedItem.project_id}`)}
            />
          )}
        </DialogContent>
      </Dialog>

      <EquipmentImporter open={importerOpen} onOpenChange={setImporterOpen} onSaved={refreshEquipment} />
    </div>
  );
}

/* ─── Equipment Card (rich) ─── */
function EquipmentCard({
  equipment: e,
  category,
  project,
  isExpanded,
  onToggle,
  onSelect,
}: {
  equipment: Equipment;
  category?: EquipmentCategory;
  project?: { id: string; name: string };
  isExpanded: boolean;
  onToggle: () => void;
  onSelect: () => void;
}) {
  const status = e.status || 'unknown';
  const cfg = statusConfig[status] || statusConfig.unknown;
  const StatusIcon = cfg.icon;
  const specs = e.specifications_json ? Object.entries(e.specifications_json as Record<string, string>) : [];

  return (
    <Card className={`border-line bg-ivory overflow-hidden transition-shadow hover:shadow-md ${isExpanded ? 'ring-1 ring-ink/10' : ''}`}>
      {/* Main row */}
      <div className="flex">
        {/* Image */}
        {e.image_url ? (
          <div className="w-28 h-28 shrink-0 border-r border-line bg-white flex items-center justify-center relative">
            <img src={e.image_url} alt={e.name} className="w-full h-full object-contain p-2" onError={ev => { (ev.target as HTMLImageElement).style.display = 'none'; }} />
            {/* Status overlay */}
            <div className="absolute top-2 left-2">
              <StatusDot status={status} size={8} />
            </div>
          </div>
        ) : (
          <div className="w-28 h-28 shrink-0 border-r border-line bg-line/20 flex items-center justify-center relative">
            <ImageIcon size={28} className="text-olive/30" strokeWidth={1.5} />
            <div className="absolute top-2 left-2">
              <StatusDot status={status} size={8} />
            </div>
          </div>
        )}

        {/* Info */}
        <div className="flex-1 p-3 min-w-0 flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-sm font-medium text-ink font-sans truncate">{e.name}</p>
                <p className="text-[11px] text-olive font-sans mt-0.5">
                  {e.brand || '—'} · {e.reference || '—'}
                </p>
              </div>
              <Badge variant="outline" className="text-[9px] shrink-0 border-line text-olive">
                {category?.name || '—'}
              </Badge>
            </div>

            {/* Technical context row */}
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              {e.network_zone && (
                <span className="flex items-center gap-1 text-[10px] text-olive font-sans bg-line/20 px-1.5 py-0.5 rounded">
                  <NetworkZoneIcon zone={e.network_zone} />
                  {e.network_zone}
                </span>
              )}
              {e.firmware_version && (
                <span className="flex items-center gap-1 text-[10px] text-olive font-sans bg-line/20 px-1.5 py-0.5 rounded">
                  <HardDrive size={10} strokeWidth={1.5} />
                  v{e.firmware_version}
                </span>
              )}
              {e.ip_address && (
                <span className="text-[10px] text-olive font-sans font-mono bg-line/20 px-1.5 py-0.5 rounded">
                  {e.ip_address}
                </span>
              )}
            </div>
          </div>

          {/* Bottom row */}
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-1.5">
              <StatusIcon size={12} className={cfg.color} strokeWidth={1.5} />
              <span className={`text-[10px] font-sans ${cfg.color}`}>{cfg.label}</span>
              {project && (
                <span className="flex items-center gap-1 text-[10px] text-olive font-sans ml-1">
                  <MapPin size={10} strokeWidth={1.5} />
                  {project.name}
                  {e.room_code && ` · ${e.room_code}`}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {e.datasheet_url && (
                <a href={e.datasheet_url} target="_blank" rel="noopener noreferrer" className="p-1 hover:bg-line/30 rounded" title="Ficha técnica">
                  <FileText size={13} className="text-olive" strokeWidth={1.5} />
                </a>
              )}
              <button onClick={onSelect} className="p-1 hover:bg-line/30 rounded" title="Ver detalhes">
                <ExternalLink size={13} className="text-olive" strokeWidth={1.5} />
              </button>
              <button onClick={onToggle} className="p-1 hover:bg-line/30 rounded" title="Expandir">
                {isExpanded ? <ChevronUp size={13} className="text-olive" /> : <ChevronDown size={13} className="text-olive" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Expanded */}
      {isExpanded && (
        <div className="border-t border-line px-4 py-3 space-y-3">
          {/* Warranty */}
          {e.warranty_years && (
            <div className="flex items-center gap-1.5 text-[11px] text-olive font-sans">
              <ShieldCheck size={12} strokeWidth={1.5} />
              Garantia: {e.warranty_years} ano{e.warranty_years > 1 ? 's' : ''}
              {e.installation_date && ` · Instalado em ${new Date(e.installation_date).toLocaleDateString('pt-PT')}`}
            </div>
          )}

          {/* MAC address */}
          {e.mac_address && (
            <div className="text-[11px] text-olive font-sans font-mono">
              MAC: {e.mac_address}
            </div>
          )}

          {/* Description */}
          {e.description && (
            <p className="text-xs text-ink font-sans leading-relaxed">{e.description}</p>
          )}

          {/* Specifications */}
          {specs.length > 0 && (
            <div>
              <p className="text-[10px] uppercase tracking-wider text-olive font-sans mb-1">Especificações</p>
              <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                {specs.slice(0, 4).map(([key, value]) => (
                  <div key={key} className="flex gap-1 text-xs">
                    <span className="text-olive font-sans shrink-0">{key}:</span>
                    <span className="text-ink font-sans truncate">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Price */}
          <div className="flex items-center justify-between pt-1">
            <p className="text-sm font-serif text-ink">{(e.unit_price || 0).toLocaleString('pt-PT')}€</p>
            {e.source_url && (
              <a href={e.source_url} target="_blank" rel="noopener noreferrer" className="text-[11px] text-ink underline font-sans">
                Ver na loja
              </a>
            )}
          </div>
        </div>
      )}
    </Card>
  );
}

/* ─── Status Dot ─── */
function StatusDot({ status, size = 8 }: { status: string; size?: number }) {
  const cfg = statusConfig[status] || statusConfig.unknown;
  return (
    <span
      className={`inline-block rounded-full ${cfg.bg}`}
      style={{ width: size, height: size }}
      title={cfg.label}
    />
  );
}

/* ─── Equipment Detail (Dialog) ─── */
function EquipmentDetail({
  equipment: e,
  category,
  project,
  relations,
  onNavigateProject,
}: {
  equipment: Equipment;
  category?: EquipmentCategory;
  project?: { id: string; name: string };
  relations: EquipmentRelationship[];
  onNavigateProject: () => void;
}) {
  const status = e.status || 'unknown';
  const cfg = statusConfig[status] || statusConfig.unknown;
  const StatusIcon = cfg.icon;

  return (
    <div className="space-y-5">
      {/* Image */}
      {e.image_url && (
        <div className="flex justify-center bg-white rounded-md border border-line p-4">
          <img src={e.image_url} alt={e.name} className="max-h-40 object-contain" onError={ev => { (ev.target as HTMLImageElement).style.display = 'none'; }} />
        </div>
      )}

      {/* Status banner */}
      <div className={`flex items-center gap-2 rounded-md px-3 py-2 ${status === 'online' ? 'bg-green-50 border border-green-200' : status === 'warning' || status === 'error' ? 'bg-red-50 border border-red-200' : 'bg-line/20 border border-line'}`}>
        <StatusIcon size={16} className={cfg.color} strokeWidth={1.5} />
        <span className={`text-sm font-sans ${cfg.color}`}>{cfg.label}</span>
        {e.firmware_version && (
          <span className="ml-auto text-[11px] text-olive font-sans">
            Firmware v{e.firmware_version}
          </span>
        )}
      </div>

      {/* Core info grid */}
      <div className="grid grid-cols-2 gap-3 text-sm">
        <InfoRow label="Marca" value={e.brand || '—'} />
        <InfoRow label="Referência" value={e.reference || '—'} mono />
        <InfoRow label="Categoria" value={category?.name || '—'} />
        <InfoRow label="Preço" value={`${(e.unit_price || 0).toLocaleString('pt-PT')}€`} />
        <InfoRow label="Fornecedor" value={e.supplier || '—'} />
        <InfoRow label="Zona Rede" value={e.network_zone || '—'} />
        {e.ip_address && <InfoRow label="IP" value={e.ip_address} mono />}
        {e.mac_address && <InfoRow label="MAC" value={e.mac_address} mono />}
        {e.warranty_years && <InfoRow label="Garantia" value={`${e.warranty_years} ano(s)`} />}
        {e.installation_date && <InfoRow label="Instalação" value={new Date(e.installation_date).toLocaleDateString('pt-PT')} />}
      </div>

      {/* Context */}
      {project && (
        <div className="bg-ink/5 border border-ink/10 rounded-md p-3">
          <p className="text-[10px] uppercase tracking-wider text-olive font-sans mb-1">Contexto</p>
          <div className="flex items-center gap-2">
            <Building2 size={14} className="text-olive" strokeWidth={1.5} />
            <button onClick={onNavigateProject} className="text-sm text-ink font-sans underline hover:text-olive transition-colors">
              {project.name}
            </button>
            {e.room_code && (
              <>
                <span className="text-olive">·</span>
                <span className="text-sm text-ink font-sans">{e.room_code}</span>
              </>
            )}
          </div>
        </div>
      )}

      {/* Description */}
      {e.description && (
        <div>
          <p className="text-[10px] uppercase tracking-wider text-olive font-sans mb-1">Descrição</p>
          <p className="text-sm text-ink font-sans leading-relaxed">{e.description}</p>
        </div>
      )}

      {/* Specifications */}
      {e.specifications_json && Object.keys(e.specifications_json).length > 0 && (
        <div>
          <p className="text-[10px] uppercase tracking-wider text-olive font-sans mb-2">Especificações Técnicas</p>
          <div className="border border-line rounded-md overflow-hidden">
            <table className="w-full text-sm">
              <tbody>
                {Object.entries(e.specifications_json as Record<string, string>).map(([key, value]) => (
                  <tr key={key} className="border-b border-line/50 last:border-b-0">
                    <td className="px-3 py-1.5 text-olive font-sans text-xs w-2/5 bg-line/20">{key}</td>
                    <td className="px-3 py-1.5 text-ink font-sans text-xs">{value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Relationships */}
      {relations.length > 0 && (
        <div>
          <p className="text-[10px] uppercase tracking-wider text-olive font-sans mb-2">Relações</p>
          <div className="space-y-2">
            {relations.map(rel => (
              <div key={rel.id} className="flex items-center gap-2 text-sm bg-line/10 rounded-md p-2">
                <div className="w-1.5 h-1.5 rounded-full bg-ink" />
                <span className="text-ink font-sans">{rel.relationship_type}</span>
                <ArrowRight className="text-olive" size={12} strokeWidth={1.5} />
                <span className="text-ink font-medium font-sans">{(rel.target as any)?.name || '—'}</span>
                {rel.notes && <span className="text-[11px] text-olive font-sans ml-auto">{rel.notes}</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 pt-2">
        {e.datasheet_url && (
          <a href={e.datasheet_url} target="_blank" rel="noopener noreferrer">
            <Button variant="outline" size="sm" className="border-line text-ink font-sans">
              <FileText size={14} className="mr-1.5" />
              Ficha Técnica
            </Button>
          </a>
        )}
        {e.source_url && (
          <a href={e.source_url} target="_blank" rel="noopener noreferrer">
            <Button variant="outline" size="sm" className="border-line text-ink font-sans">
              <ExternalLink size={14} className="mr-1.5" />
              Ver na Loja
            </Button>
          </a>
        )}
      </div>
    </div>
  );
}

function InfoRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <p className="text-[10px] text-olive font-sans uppercase tracking-wider">{label}</p>
      <p className={`text-sm text-ink font-sans ${mono ? 'font-mono' : ''}`}>{value}</p>
    </div>
  );
}
