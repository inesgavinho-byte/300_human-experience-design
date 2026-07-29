import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import {
  ChevronRight, ChevronLeft, Wand2, Home, Lightbulb, Speaker, Thermometer, Shield,
  Layers, Check, Plus, Minus, Package, Calculator, ArrowRight, Save, FileDown,
  RefreshCw, Search, X, Tag, Percent, LayoutTemplate, BookOpen,
} from 'lucide-react';

interface EquipmentItem {
  name: string;
  ref: string;
  qty: number;
  unit_price: number;
  original_price: number;
  catalog_price?: number;
  catalog_item?: CatalogItem | null;
}

interface CatalogItem {
  id: string;
  name: string;
  reference: string;
  brand: string;
  category: string;
  unit_price_eur: number;
  stock_quantity: number;
  description: string | null;
}

interface Room {
  name: string;
  zones: string[];
  equipment: EquipmentItem[];
}

interface SystemTemplate {
  id: string;
  name: string;
  brand: string;
  category: string;
  description: string;
  rooms: Room[];
  base_price_eur: number;
  price_per_sqm: number;
  estimated_days: number;
  tags: string[];
}

interface WizardState {
  step: number;
  selectedTemplate: SystemTemplate | null;
  activeRooms: Map<string, boolean>;
  roomQuantities: Map<string, number>;
  editedPrices: Map<string, number>;
  marginPct: number;
  sqm: number;
  projectName: string;
  clientName: string;
}

const CATEGORY_ICON: Record<string, React.ElementType> = {
  'Full-Home': Home,
  'Lighting': Lightbulb,
  'Audio': Speaker,
  'Climate': Thermometer,
  'Security': Shield,
};

const BRAND_COLORS: Record<string, string> = {
  Basalte: 'bg-amber-50 border-amber-200 text-amber-800',
  Lutron: 'bg-blue-50 border-blue-200 text-blue-800',
  Crestron: 'bg-purple-50 border-purple-200 text-purple-800',
  Savant: 'bg-emerald-50 border-emerald-200 text-emerald-800',
};

export default function SystemWizardPage() {
  const [searchParams] = useSearchParams();
  const fromProposalId = searchParams.get('fromProposal');

  const [templates, setTemplates] = useState<SystemTemplate[]>([]);
  const [catalog, setCatalog] = useState<Map<string, CatalogItem>>(new Map());
  const [catalogList, setCatalogList] = useState<CatalogItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showCatalogModal, setShowCatalogModal] = useState(false);
  const [catalogSearch, setCatalogSearch] = useState('');
  const [selectedCatalogItems, setSelectedCatalogItems] = useState<Set<string>>(new Set());
  const [catalogTargetRoom, setCatalogTargetRoom] = useState('__new__');
  const [wizard, setWizard] = useState<WizardState>({
    step: 1,
    selectedTemplate: null,
    activeRooms: new Map(),
    roomQuantities: new Map(),
    editedPrices: new Map(),
    marginPct: 30,
    sqm: 200,
    projectName: '',
    clientName: '',
  });

  useEffect(() => {
    fetchTemplates();
    fetchCatalog();
    if (fromProposalId) loadProposalAsTemplate(fromProposalId);
  }, [fromProposalId]);

  async function fetchTemplates() {
    try {
      const { data, error } = await supabase
        .from('system_templates')
        .select('*')
        .eq('is_active', true)
        .order('brand');
      if (error) throw error;
      setTemplates(data || []);
    } catch (err: any) {
      toast.error('Erro ao carregar templates');
    } finally {
      setIsLoading(false);
    }
  }

  async function fetchCatalog() {
    try {
      const { data, error } = await supabase.from('catalog_items').select('*').eq('is_active', true);
      if (error) throw error;
      const map = new Map<string, CatalogItem>();
      (data || []).forEach((item: CatalogItem) => { if (item.reference) map.set(item.reference, item); });
      setCatalog(map);
      setCatalogList(data || []);
    } catch (err: any) {
      console.error('Erro ao carregar catálogo:', err.message);
    }
  }

  async function loadProposalAsTemplate(proposalId: string) {
    try {
      setIsLoading(true);
      const { data: proposal, error } = await supabase
        .from('proposals')
        .select('*')
        .eq('id', proposalId)
        .single();
      if (error) throw error;
      if (!proposal) { toast.error('Proposta não encontrada'); return; }

      // Criar template temporário a partir da proposta
      const tempTemplate: SystemTemplate = {
        id: 'custom-' + proposalId,
        name: proposal.title || 'Proposta Customizada',
        brand: 'Custom',
        category: 'Full-Home',
        description: proposal.description || 'Template gerado a partir de proposta existente',
        rooms: [{
          name: 'Geral',
          zones: ['Equipamentos da proposta'],
          equipment: [], // Seria ideal buscar itens da proposta se existir tabela de items
        }],
        base_price_eur: 0,
        price_per_sqm: 0,
        estimated_days: 1,
        tags: ['custom', 'from-proposal'],
      };

      // Tentar buscar itens da proposta se existirem
      const { data: items } = await supabase.from('proposal_items').select('*').eq('proposal_id', proposalId);
      if (items && items.length > 0) {
        tempTemplate.rooms[0].equipment = items.map((it: any) => ({
          name: it.name || 'Item',
          ref: it.reference || 'REF-' + Math.random().toString(36).slice(2, 8).toUpperCase(),
          qty: it.quantity || 1,
          unit_price: it.unit_price || 0,
          original_price: it.unit_price || 0,
          catalog_price: undefined,
          catalog_item: null,
        }));
      }

      selectTemplate(tempTemplate);
      setWizard(prev => ({ ...prev, projectName: proposal.title || '', step: 2 }));
      toast.success('Proposta carregada como template');
    } catch (err: any) {
      toast.error('Erro ao carregar proposta: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  }

  function getCatalogPrice(ref: string): number | undefined {
    return catalog.get(ref)?.unit_price_eur;
  }

  function getCatalogItem(ref: string): CatalogItem | null {
    return catalog.get(ref) || null;
  }

  async function syncWithCatalog() {
    setIsSyncing(true);
    await fetchCatalog();
    toast.success('Preços sincronizados');
    setIsSyncing(false);
  }

  function selectTemplate(t: SystemTemplate) {
    const activeRooms = new Map<string, boolean>();
    const roomQuantities = new Map<string, number>();
    t.rooms.forEach(r => {
      activeRooms.set(r.name, true);
      const match = r.name.match(/\(x(\d+)\)/);
      roomQuantities.set(r.name, match ? parseInt(match[1]) : 1);
    });
    setWizard(prev => ({ ...prev, step: 2, selectedTemplate: t, activeRooms, roomQuantities, editedPrices: new Map(), marginPct: 30 }));
  }

  function toggleRoom(name: string) {
    setWizard(prev => { const next = new Map(prev.activeRooms); next.set(name, !next.get(name)); return { ...prev, activeRooms: next }; });
  }

  function adjustQty(name: string, delta: number) {
    setWizard(prev => { const next = new Map(prev.roomQuantities); next.set(name, Math.max(1, (next.get(name) || 1) + delta)); return { ...prev, roomQuantities: next }; });
  }

  function editPrice(ref: string, newPrice: number) {
    setWizard(prev => { const next = new Map(prev.editedPrices); next.set(ref, Math.max(0, newPrice)); return { ...prev, editedPrices: next }; });
  }

  function resetPrice(ref: string) {
    setWizard(prev => { const next = new Map(prev.editedPrices); next.delete(ref); return { ...prev, editedPrices: next }; });
  }

  function addCatalogItemsToTemplate() {
    if (!wizard.selectedTemplate) return;
    const itemsToAdd = catalogList.filter(c => selectedCatalogItems.has(c.id));
    if (itemsToAdd.length === 0) { toast.error('Selecione pelo menos um equipamento'); return; }

    const newTemplate = { ...wizard.selectedTemplate };
    let targetRoom = newTemplate.rooms.find(r => r.name === catalogTargetRoom);
    if (!targetRoom || catalogTargetRoom === '__new__') {
      targetRoom = { name: 'Equipamentos Adicionais', zones: ['Catálogo'], equipment: [] };
      newTemplate.rooms.push(targetRoom);
    }

    itemsToAdd.forEach(item => {
      targetRoom!.equipment.push({
        name: item.name,
        ref: item.reference || `CAT-${item.id.slice(0, 6).toUpperCase()}`,
        qty: 1,
        unit_price: item.unit_price_eur,
        original_price: item.unit_price_eur,
        catalog_price: item.unit_price_eur,
        catalog_item: item,
      });
    });

    setWizard(prev => {
      const activeRooms = new Map(prev.activeRooms);
      activeRooms.set(targetRoom!.name, true);
      return { ...prev, selectedTemplate: newTemplate, activeRooms };
    });

    setShowCatalogModal(false);
    setSelectedCatalogItems(new Set());
    toast.success(`${itemsToAdd.length} equipamento(s) adicionado(s)`);
  }

  function calculateTotal(): { equipment: EquipmentItem[]; subtotal: number; labor: number; margin: number; total: number; sellPrice: number } {
    if (!wizard.selectedTemplate) return { equipment: [], subtotal: 0, labor: 0, margin: 0, total: 0, sellPrice: 0 };

    const equipmentMap = new Map<string, EquipmentItem>();
    wizard.selectedTemplate.rooms.forEach(room => {
      if (!wizard.activeRooms.get(room.name)) return;
      const qty = wizard.roomQuantities.get(room.name) || 1;
      const isMultiplier = room.name.includes('(x');
      const multiplier = isMultiplier ? qty : 1;

      room.equipment.forEach(eq => {
        const key = eq.ref;
        const totalQty = eq.qty * multiplier;
        const catalogPrice = getCatalogPrice(eq.ref);
        const editedPrice = wizard.editedPrices.get(eq.ref);
        const finalPrice = editedPrice ?? (catalogPrice ?? eq.unit_price);

        if (equipmentMap.has(key)) {
          equipmentMap.get(key)!.qty += totalQty;
        } else {
          equipmentMap.set(key, { ...eq, qty: totalQty, unit_price: finalPrice, original_price: eq.unit_price, catalog_price: catalogPrice, catalog_item: getCatalogItem(eq.ref) });
        }
      });
    });

    const equipment = Array.from(equipmentMap.values());
    const subtotal = equipment.reduce((sum, e) => sum + e.qty * e.unit_price, 0);
    const sqmCost = wizard.sqm * wizard.selectedTemplate.price_per_sqm;
    const labor = wizard.selectedTemplate.base_price_eur + sqmCost;
    const cost = subtotal + labor;
    const margin = cost * (wizard.marginPct / 100);
    const sellPrice = cost + margin;

    return { equipment, subtotal, labor, margin, total: cost, sellPrice };
  }

  async function createProposal() {
    const { sellPrice } = calculateTotal();
    if (!wizard.selectedTemplate) return;
    try {
      toast.info('A criar proposta...');
      const { error } = await supabase.from('proposals').insert({
        title: wizard.projectName || `Proposta ${wizard.selectedTemplate.brand}`,
        description: `Sistema: ${wizard.selectedTemplate.name}\nÁreas: ${Array.from(wizard.activeRooms.entries()).filter(([, v]) => v).map(([k]) => k).join(', ')}\nÁrea: ${wizard.sqm}m²\nMargem: ${wizard.marginPct}%`,
        status: 'draft',
        total_amount: sellPrice,
      });
      if (error) throw error;
      toast.success('Proposta criada!');
      setWizard({ step: 1, selectedTemplate: null, activeRooms: new Map(), roomQuantities: new Map(), editedPrices: new Map(), marginPct: 30, sqm: 200, projectName: '', clientName: '' });
    } catch (err: any) {
      toast.error('Erro: ' + err.message);
    }
  }

  async function saveAsTemplate() {
    const { equipment } = calculateTotal();
    if (!wizard.selectedTemplate || equipment.length === 0) return;

    const name = window.prompt('Nome do novo template:', wizard.projectName || wizard.selectedTemplate.name);
    if (!name) return;

    try {
      toast.info('A guardar template...');
      const roomsData = wizard.selectedTemplate.rooms.filter(r => wizard.activeRooms.get(r.name)).map(r => ({
        name: r.name,
        zones: r.zones,
        equipment: r.equipment.map(eq => {
          const edited = wizard.editedPrices.get(eq.ref);
          return { name: eq.name, ref: eq.ref, qty: eq.qty, unit_price: edited ?? eq.unit_price };
        }),
      }));

      const { error } = await supabase.from('system_templates').insert({
        name,
        brand: wizard.selectedTemplate.brand,
        category: wizard.selectedTemplate.category,
        description: `Template personalizado baseado em ${wizard.selectedTemplate.name}`,
        rooms: roomsData,
        base_price_eur: wizard.selectedTemplate.base_price_eur,
        price_per_sqm: wizard.selectedTemplate.price_per_sqm,
        estimated_days: wizard.selectedTemplate.estimated_days,
        tags: [...wizard.selectedTemplate.tags, 'custom'],
      });

      if (error) throw error;
      toast.success('Template guardado!');
      fetchTemplates();
    } catch (err: any) {
      toast.error('Erro: ' + err.message);
    }
  }

  function exportPDF() {
    const { equipment, subtotal, labor, margin, total, sellPrice } = calculateTotal();
    if (!wizard.selectedTemplate) return;
    const html = buildPDFHTML(wizard, equipment, subtotal, labor, margin, total, sellPrice);
    const win = window.open('', '_blank');
    if (!win) { toast.error('Permita popups'); return; }
    win.document.write(html);
    win.document.close();
    setTimeout(() => win.print(), 500);
  }

  const filteredCatalog = catalogList.filter(c =>
    c.name.toLowerCase().includes(catalogSearch.toLowerCase()) ||
    (c.reference && c.reference.toLowerCase().includes(catalogSearch.toLowerCase()))
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
        </div>
      </div>
    );
  }

  /* ═══════════════════════════════════════════ STEP 1 ═══════════════════════════════════════════ */
  if (wizard.step === 1) {
    return (
      <div className="space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="font-serif text-3xl text-ink flex items-center gap-2">
              <Wand2 size={22} strokeWidth={1.5} /> Wizard de Sistemas
            </h1>
            <p className="text-olive text-sm mt-1 font-sans">Escolha um template ou comece a partir de uma proposta existente</p>
          </div>
          <Button variant="ghost" size="sm" onClick={syncWithCatalog} disabled={isSyncing} className="text-olive font-sans text-xs flex items-center gap-1">
            <RefreshCw size={12} className={isSyncing ? 'animate-spin' : ''} /> {isSyncing ? 'A sincronizar...' : 'Sinc. Catálogo'}
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {templates.map(t => {
            const Icon = CATEGORY_ICON[t.category] || Layers;
            const brandClass = BRAND_COLORS[t.brand] || 'bg-line/30 border-line text-ink';
            return (
              <Card key={t.id} className="border-line bg-ivory cursor-pointer hover:shadow-md transition-shadow group" onClick={() => selectTemplate(t)}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <span className={`text-[10px] font-sans uppercase tracking-wider px-2 py-0.5 rounded border ${brandClass}`}>{t.brand}</span>
                    <Icon size={16} className="text-olive" strokeWidth={1.5} />
                  </div>
                  <h3 className="font-serif text-lg text-ink mb-1 group-hover:underline">{t.name}</h3>
                  <p className="text-xs text-olive font-sans line-clamp-2 mb-3">{t.description}</p>
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {t.tags.slice(0, 4).map(tag => (
                      <span key={tag} className="text-[9px] font-sans text-olive bg-line/30 px-1.5 py-0.5 rounded">{tag}</span>
                    ))}
                  </div>
                  <div className="flex items-center justify-between text-xs font-sans text-ink pt-3 border-t border-line/40">
                    <span>≈ {t.estimated_days} dias</span>
                    <span>Desde {t.base_price_eur.toLocaleString('pt-PT')}€</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    );
  }

  /* ═══════════════════════════════════════════ STEP 2 ═══════════════════════════════════════════ */
  if (wizard.step === 2 && wizard.selectedTemplate) {
    return (
      <div className="space-y-6 max-w-3xl relative">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-serif text-2xl text-ink">Configurar Áreas</h1>
            <p className="text-olive text-sm font-sans">{wizard.selectedTemplate.brand} — {wizard.selectedTemplate.name}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => setShowCatalogModal(true)} className="text-olive font-sans text-xs flex items-center gap-1">
              <BookOpen size={12} /> + Catálogo
            </Button>
            <Button variant="ghost" size="sm" onClick={syncWithCatalog} disabled={isSyncing} className="text-olive font-sans text-xs flex items-center gap-1">
              <RefreshCw size={12} className={isSyncing ? 'animate-spin' : ''} /> {isSyncing ? 'A sinc...' : 'Sinc. Preços'}
            </Button>
            <Button variant="outline" size="sm" onClick={() => setWizard(prev => ({ ...prev, step: 1 }))} className="border-line text-ink font-sans">
              <ChevronLeft size={14} /> Voltar
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-4 bg-line/20 rounded-md p-3">
          <label className="text-sm font-sans text-ink">Área (m²):</label>
          <input type="number" value={wizard.sqm} onChange={e => setWizard(prev => ({ ...prev, sqm: Math.max(50, parseInt(e.target.value) || 0) }))} className="w-24 px-2 py-1 text-sm border border-line rounded bg-white text-ink font-sans" />
          <span className="text-xs text-olive font-sans">Influencia o custo de mão-de-obra</span>
        </div>

        <div className="space-y-3">
          {wizard.selectedTemplate.rooms.map(room => {
            const isActive = wizard.activeRooms.get(room.name) ?? true;
            const qty = wizard.roomQuantities.get(room.name) || 1;
            const isMultiplier = room.name.includes('(x');
            return (
              <Card key={room.name} className={`border transition-colors ${isActive ? 'border-line bg-ivory' : 'border-line/30 bg-line/10 opacity-50'}`}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <button onClick={() => toggleRoom(room.name)} className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${isActive ? 'bg-ink border-ink text-ivory' : 'border-line bg-white'}`}>
                        {isActive && <Check size={12} strokeWidth={2} />}
                      </button>
                      <div>
                        <h4 className="text-sm font-sans font-medium text-ink">{room.name}</h4>
                        <p className="text-[10px] text-olive font-sans">{room.zones.join(' · ')}</p>
                      </div>
                    </div>
                    {isMultiplier && isActive && (
                      <div className="flex items-center gap-2">
                        <button onClick={() => adjustQty(room.name, -1)} className="p-1 rounded hover:bg-line/40"><Minus size={12} className="text-ink" /></button>
                        <span className="text-sm font-sans text-ink w-6 text-center">{qty}</span>
                        <button onClick={() => adjustQty(room.name, 1)} className="p-1 rounded hover:bg-line/40"><Plus size={12} className="text-ink" /></button>
                      </div>
                    )}
                  </div>
                  {isActive && (
                    <div className="mt-3 pl-8 space-y-1">
                      {room.equipment.map(eq => {
                        const catItem = getCatalogItem(eq.ref);
                        return (
                          <div key={eq.ref} className="flex items-center justify-between text-[11px] font-sans">
                            <span className="text-olive">{eq.name} <span className="text-olive/50">({eq.ref})</span>{catItem && <span className="ml-1 text-emerald-600">● catálogo</span>}</span>
                            <span className="text-ink">× {eq.qty * (isMultiplier ? qty : 1)} {catItem && <span className="text-olive">{catItem.unit_price_eur.toLocaleString('pt-PT')}€</span>}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={() => setWizard(prev => ({ ...prev, step: 1 }))} className="border-line text-ink font-sans"><ChevronLeft size={14} /> Anterior</Button>
          <Button size="sm" onClick={() => setWizard(prev => ({ ...prev, step: 3 }))} className="bg-ink text-ivory hover:bg-ink/90 font-sans">Revisar <ChevronRight size={14} /></Button>
        </div>

        {/* Catalog Modal */}
        {showCatalogModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/30 backdrop-blur-sm">
            <div className="bg-ivory border border-line rounded-xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col">
              <div className="flex items-center justify-between p-4 border-b border-line">
                <h3 className="font-serif text-lg text-ink">Adicionar do Catálogo</h3>
                <button onClick={() => setShowCatalogModal(false)} className="p-1 rounded hover:bg-line/40"><X size={16} className="text-ink" /></button>
              </div>
              <div className="p-4 border-b border-line">
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-olive" />
                  <input type="text" value={catalogSearch} onChange={e => setCatalogSearch(e.target.value)} placeholder="Pesquisar equipamentos..." className="w-full pl-8 pr-3 py-2 text-sm border border-line rounded-md bg-white text-ink font-sans" />
                </div>
                <select value={catalogTargetRoom} onChange={e => setCatalogTargetRoom(e.target.value)} className="mt-2 w-full px-3 py-1.5 text-xs border border-line rounded bg-white text-ink font-sans">
                  <option value="__new__">+ Nova divisão (Equipamentos Adicionais)</option>
                  {wizard.selectedTemplate.rooms.map(r => <option key={r.name} value={r.name}>{r.name}</option>)}
                </select>
              </div>
              <div className="flex-1 overflow-y-auto p-2">
                {filteredCatalog.length === 0 ? (
                  <p className="text-center text-xs text-olive py-4">Sem resultados</p>
                ) : (
                  filteredCatalog.map(item => (
                    <label key={item.id} className="flex items-center gap-3 p-2 rounded hover:bg-line/20 cursor-pointer">
                      <input type="checkbox" checked={selectedCatalogItems.has(item.id)} onChange={e => {
                        const next = new Set(selectedCatalogItems);
                        e.target.checked ? next.add(item.id) : next.delete(item.id);
                        setSelectedCatalogItems(next);
                      }} className="shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-sans text-ink truncate">{item.name}</p>
                        <p className="text-[10px] text-olive truncate">{item.reference} · {item.brand} · {item.unit_price_eur.toLocaleString('pt-PT')}€</p>
                      </div>
                    </label>
                  ))
                )}
              </div>
              <div className="p-4 border-t border-line flex justify-between items-center">
                <span className="text-xs text-olive font-sans">{selectedCatalogItems.size} selecionado(s)</span>
                <Button size="sm" onClick={addCatalogItemsToTemplate} disabled={selectedCatalogItems.size === 0} className="bg-ink text-ivory font-sans">
                  <Plus size={14} className="mr-1" /> Adicionar
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  /* ═══════════════════════════════════════════ STEP 3 ═══════════════════════════════════════════ */
  if (wizard.step === 3 && wizard.selectedTemplate) {
    const { equipment, subtotal, labor, margin, total, sellPrice } = calculateTotal();
    const syncedCount = equipment.filter(e => e.catalog_item).length;
    const editedCount = equipment.filter(e => wizard.editedPrices.has(e.ref)).length;
    const originalSubtotal = equipment.reduce((sum, e) => sum + e.qty * e.original_price, 0);
    const priceDiff = subtotal - originalSubtotal;

    return (
      <div className="space-y-6 max-w-3xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-serif text-2xl text-ink">Revisão</h1>
            <p className="text-olive text-sm font-sans">{wizard.selectedTemplate.brand} — {wizard.selectedTemplate.name}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={syncWithCatalog} disabled={isSyncing} className="text-olive font-sans text-xs flex items-center gap-1">
              <RefreshCw size={12} className={isSyncing ? 'animate-spin' : ''} /> {isSyncing ? 'A sinc...' : 'Sinc. Preços'}
            </Button>
            <Button variant="outline" size="sm" onClick={() => setWizard(prev => ({ ...prev, step: 2 }))} className="border-line text-ink font-sans"><ChevronLeft size={14} /> Voltar</Button>
          </div>
        </div>

        {syncedCount > 0 && (
          <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-md px-3 py-2">
            <Check size={12} /><span className="font-sans">{syncedCount} de {equipment.length} equipamentos sincronizados com o catálogo</span>
          </div>
        )}
        {editedCount > 0 && (
          <div className={`flex items-center gap-2 text-xs rounded-md px-3 py-2 ${priceDiff > 0 ? 'text-amber-700 bg-amber-50 border border-amber-200' : 'text-blue-700 bg-blue-50 border border-blue-200'}`}>
            <Calculator size={12} />
            <span className="font-sans">{editedCount} preço(s) editado(s) — {priceDiff > 0 ? '+' : ''}{priceDiff.toLocaleString('pt-PT')}€ vs original</span>
          </div>
        )}

        {/* Margem de lucro */}
        <Card className="border-line bg-ivory">
          <CardHeader className="pb-2">
            <CardTitle className="font-serif text-base text-ink flex items-center gap-2"><Percent size={14} /> Margem de Lucro</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <input type="range" min="0" max="100" value={wizard.marginPct} onChange={e => setWizard(prev => ({ ...prev, marginPct: parseInt(e.target.value) }))} className="flex-1" />
              <div className="flex items-center gap-2">
                <input type="number" min="0" max="100" value={wizard.marginPct} onChange={e => setWizard(prev => ({ ...prev, marginPct: Math.max(0, Math.min(100, parseInt(e.target.value) || 0)) }))} className="w-16 px-2 py-1 text-sm border border-line rounded bg-white text-ink font-sans text-center" />
                <span className="text-sm font-sans text-ink">%</span>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-4 text-xs font-sans">
              <div><span className="text-olive">Custo total:</span> <span className="text-ink font-medium">{total.toLocaleString('pt-PT')}€</span></div>
              <div><span className="text-olive">Margem:</span> <span className="text-ink font-medium">{margin.toLocaleString('pt-PT')}€</span></div>
            </div>
          </CardContent>
        </Card>

        {/* Resumo numérico */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <Card className="border-line bg-ivory"><CardContent className="p-3 text-center"><Package size={14} className="text-olive mx-auto mb-1" /><p className="text-lg font-serif text-ink">{equipment.length}</p><p className="text-[10px] text-olive font-sans">Equipamentos</p></CardContent></Card>
          <Card className="border-line bg-ivory"><CardContent className="p-3 text-center"><Calculator size={14} className="text-olive mx-auto mb-1" /><p className="text-lg font-serif text-ink">{subtotal.toLocaleString('pt-PT')}€</p><p className="text-[10px] text-olive font-sans">Equipamentos</p></CardContent></Card>
          <Card className="border-line bg-ivory"><CardContent className="p-3 text-center"><Wand2 size={14} className="text-olive mx-auto mb-1" /><p className="text-lg font-serif text-ink">{labor.toLocaleString('pt-PT')}€</p><p className="text-[10px] text-olive font-sans">Mão-de-obra</p></CardContent></Card>
          <Card className="border-line bg-ivory"><CardContent className="p-3 text-center"><Tag size={14} className="text-olive mx-auto mb-1" /><p className="text-lg font-serif text-ink">{margin.toLocaleString('pt-PT')}€</p><p className="text-[10px] text-olive font-sans">Margem ({wizard.marginPct}%)</p></CardContent></Card>
          <Card className="border-line bg-ink"><CardContent className="p-3 text-center"><ArrowRight size={14} className="text-ivory/50 mx-auto mb-1" /><p className="text-lg font-serif text-ivory">{sellPrice.toLocaleString('pt-PT')}€</p><p className="text-[10px] text-ivory/60 font-sans">Preço de venda</p></CardContent></Card>
        </div>

        {/* Lista de equipamentos editável */}
        <Card className="border-line bg-ivory">
          <CardHeader className="pb-2"><CardTitle className="font-serif text-base text-ink">Lista de Equipamentos</CardTitle></CardHeader>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead className="bg-line/20 text-[10px] uppercase tracking-wider text-olive font-sans">
                <tr><th className="text-left px-4 py-2">Equipamento</th><th className="text-left px-4 py-2">Ref.</th><th className="text-right px-4 py-2">Qtd</th><th className="text-right px-4 py-2">Unit.</th><th className="text-right px-4 py-2">Total</th></tr>
              </thead>
              <tbody className="font-sans text-xs">
                {equipment.map(eq => {
                  const isEdited = wizard.editedPrices.has(eq.ref);
                  const isIncreased = isEdited && eq.unit_price > eq.original_price;
                  return (
                    <tr key={eq.ref} className="border-t border-line/30">
                      <td className="px-4 py-2"><span className="text-ink">{eq.name}</span>{eq.catalog_item && <span className="ml-1 text-emerald-600 text-[9px]">● catálogo</span>}</td>
                      <td className="px-4 py-2 text-olive">{eq.ref}</td>
                      <td className="px-4 py-2 text-right text-ink">{eq.qty}</td>
                      <td className="px-4 py-2 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <input type="number" value={eq.unit_price} onChange={e => editPrice(eq.ref, parseFloat(e.target.value) || 0)}
                            className={`w-20 px-1 py-0.5 text-right text-xs border rounded bg-white font-sans focus:outline-none focus:ring-1 ${isEdited ? (isIncreased ? 'border-amber-300 text-amber-700 focus:ring-amber-400' : 'border-blue-300 text-blue-700 focus:ring-blue-400') : 'border-line text-olive focus:ring-ink'}`} />
                          <span className="text-olive/50">€</span>
                          {isEdited && <button onClick={() => resetPrice(eq.ref)} className="text-[9px] text-olive hover:text-ink underline ml-1">reset</button>}
                        </div>
                        {isEdited && <div className="text-[9px] mt-0.5"><span className="text-olive/50">orig: {eq.original_price.toLocaleString('pt-PT')}€</span><span className={`ml-1 ${isIncreased ? 'text-amber-600' : 'text-blue-600'}`}>{isIncreased ? '+' : ''}{(eq.unit_price - eq.original_price).toLocaleString('pt-PT')}€</span></div>}
                      </td>
                      <td className="px-4 py-2 text-right font-medium text-ink">{(eq.qty * eq.unit_price).toLocaleString('pt-PT')}€</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </CardContent>
        </Card>

        {/* Detalhes da proposta */}
        <Card className="border-line bg-ivory">
          <CardHeader className="pb-2"><CardTitle className="font-serif text-base text-ink">Detalhes da Proposta</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div>
              <label className="text-[10px] text-olive font-sans uppercase tracking-wider">Nome da Proposta</label>
              <input type="text" value={wizard.projectName} onChange={e => setWizard(prev => ({ ...prev, projectName: e.target.value }))} placeholder="ex: Villa Cascais — Sistema Domótico" className="mt-1 w-full px-3 py-2 text-sm border border-line rounded-md bg-white text-ink font-sans placeholder:text-olive/40 focus:outline-none focus:ring-1 focus:ring-ink" />
            </div>
            <div>
              <label className="text-[10px] text-olive font-sans uppercase tracking-wider">Cliente</label>
              <input type="text" value={wizard.clientName} onChange={e => setWizard(prev => ({ ...prev, clientName: e.target.value }))} placeholder="Nome do cliente" className="mt-1 w-full px-3 py-2 text-sm border border-line rounded-md bg-white text-ink font-sans placeholder:text-olive/40 focus:outline-none focus:ring-1 focus:ring-ink" />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={() => setWizard(prev => ({ ...prev, step: 2 }))} className="border-line text-ink font-sans"><ChevronLeft size={14} /> Anterior</Button>
          <Button variant="outline" size="sm" onClick={saveAsTemplate} className="border-line text-ink font-sans flex items-center gap-1"><LayoutTemplate size={14} /> Guardar como Template</Button>
          <Button variant="outline" size="sm" onClick={exportPDF} className="border-line text-ink font-sans flex items-center gap-1"><FileDown size={14} /> Exportar PDF</Button>
          <Button size="sm" onClick={createProposal} className="bg-ink text-ivory hover:bg-ink/90 font-sans"><Save size={14} className="mr-1" /> Criar Proposta</Button>
        </div>
      </div>
    );
  }

  return null;
}

/* ═══════════════════════════════════════════ PDF Builder ═══════════════════════════════════════════ */
function buildPDFHTML(
  wizard: WizardState, equipment: EquipmentItem[], subtotal: number, labor: number, margin: number, total: number, sellPrice: number
): string {
  const t = wizard.selectedTemplate;
  if (!t) return '';
  const date = new Date().toLocaleDateString('pt-PT', { day: 'numeric', month: 'long', year: 'numeric' });
  const activeRoomNames = Array.from(wizard.activeRooms.entries()).filter(([, v]) => v).map(([k]) => k).join(', ');
  const rows = equipment.map(eq => `
    <tr>
      <td style="padding:10px 12px;border-bottom:1px solid #e5e5e5;font-size:12px;font-family:-apple-system,sans-serif;">${eq.name}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #e5e5e5;font-size:12px;color:#666;font-family:-apple-system,sans-serif;">${eq.ref}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #e5e5e5;font-size:12px;text-align:center;font-family:-apple-system,sans-serif;">${eq.qty}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #e5e5e5;font-size:12px;text-align:right;color:#666;font-family:-apple-system,sans-serif;">${eq.unit_price.toLocaleString('pt-PT')}€</td>
      <td style="padding:10px 12px;border-bottom:1px solid #e5e5e5;font-size:12px;text-align:right;font-weight:600;font-family:-apple-system,sans-serif;">${(eq.qty * eq.unit_price).toLocaleString('pt-PT')}€</td>
    </tr>
  `).join('');

  return `<!DOCTYPE html>
<html lang="pt">
<head><meta charset="utf-8"><title>Proposta 300</title>
<style>@media print { body { margin: 0; } .no-print { display: none !important; } }</style>
</head>
<body style="font-family:Georgia,serif;background:#faf9f7;margin:0;padding:40px 32px;">
  <div style="text-align:center;margin-bottom:32px;">
    <h1 style="font-size:28px;color:#1a1a1a;margin:0;letter-spacing:4px;">300</h1>
    <p style="font-size:10px;color:#666;margin:4px 0 0;text-transform:uppercase;letter-spacing:2px;font-family:-apple-system,sans-serif;">Human Experience Design</p>
  </div>
  <div style="background:#fff;border:1px solid #e5e5e5;border-radius:8px;padding:24px;margin-bottom:24px;">
    <h2 style="font-size:20px;color:#1a1a1a;margin:0 0 16px;">${wizard.projectName || 'Proposta de Sistema'}</h2>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;font-size:12px;font-family:-apple-system,sans-serif;color:#666;">
      <div><strong style="color:#1a1a1a;">Cliente:</strong> ${wizard.clientName || '—'}</div>
      <div><strong style="color:#1a1a1a;">Data:</strong> ${date}</div>
      <div><strong style="color:#1a1a1a;">Sistema:</strong> ${t.brand} — ${t.name}</div>
      <div><strong style="color:#1a1a1a;">Área:</strong> ${wizard.sqm}m²</div>
      <div style="grid-column:1/-1;"><strong style="color:#1a1a1a;">Áreas incluídas:</strong> ${activeRoomNames}</div>
    </div>
  </div>
  <div style="background:#fff;border:1px solid #e5e5e5;border-radius:8px;overflow:hidden;margin-bottom:24px;">
    <table style="width:100%;border-collapse:collapse;">
      <thead style="background:#f5f5f0;">
        <tr>
          <th style="padding:12px;text-align:left;font-size:10px;text-transform:uppercase;letter-spacing:1px;color:#666;font-family:-apple-system,sans-serif;font-weight:500;">Equipamento</th>
          <th style="padding:12px;text-align:left;font-size:10px;text-transform:uppercase;letter-spacing:1px;color:#666;font-family:-apple-system,sans-serif;font-weight:500;">Ref.</th>
          <th style="padding:12px;text-align:center;font-size:10px;text-transform:uppercase;letter-spacing:1px;color:#666;font-family:-apple-system,sans-serif;font-weight:500;">Qtd</th>
          <th style="padding:12px;text-align:right;font-size:10px;text-transform:uppercase;letter-spacing:1px;color:#666;font-family:-apple-system,sans-serif;font-weight:500;">Unit.</th>
          <th style="padding:12px;text-align:right;font-size:10px;text-transform:uppercase;letter-spacing:1px;color:#666;font-family:-apple-system,sans-serif;font-weight:500;">Total</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  </div>
  <div style="background:#fff;border:1px solid #e5e5e5;border-radius:8px;padding:24px;margin-bottom:24px;">
    <div style="display:flex;justify-content:flex-end;gap:24px;font-family:-apple-system,sans-serif;">
      <div style="text-align:right;"><p style="font-size:11px;color:#666;margin:0;">Equipamentos</p><p style="font-size:14px;color:#1a1a1a;margin:4px 0 0;font-weight:500;">${subtotal.toLocaleString('pt-PT')}€</p></div>
      <div style="text-align:right;"><p style="font-size:11px;color:#666;margin:0;">Mão-de-obra</p><p style="font-size:14px;color:#1a1a1a;margin:4px 0 0;font-weight:500;">${labor.toLocaleString('pt-PT')}€</p></div>
      <div style="text-align:right;"><p style="font-size:11px;color:#666;margin:0;">Custo Total</p><p style="font-size:14px;color:#1a1a1a;margin:4px 0 0;font-weight:500;">${total.toLocaleString('pt-PT')}€</p></div>
      <div style="text-align:right;"><p style="font-size:11px;color:#666;margin:0;">Margem (${wizard.marginPct}%)</p><p style="font-size:14px;color:#1a1a1a;margin:4px 0 0;font-weight:500;">${margin.toLocaleString('pt-PT')}€</p></div>
      <div style="text-align:right;border-left:1px solid #e5e5e5;padding-left:24px;"><p style="font-size:11px;color:#666;margin:0;">Preço de Venda</p><p style="font-size:24px;color:#1a1a1a;margin:4px 0 0;font-weight:600;">${sellPrice.toLocaleString('pt-PT')}€</p></div>
    </div>
  </div>
  <div style="text-align:center;font-size:10px;color:#999;font-family:-apple-system,sans-serif;margin-top:40px;">
    <p>300 — Human Experience Design · Esta proposta é um orçamento estimado sujeito a confirmação.</p>
    <p style="margin-top:4px;">Gerado via 300 OPS · ${date}</p>
  </div>
  <div class="no-print" style="text-align:center;margin-top:32px;">
    <button onclick="window.print()" style="padding:10px 24px;background:#1a1a1a;color:#fff;border:none;border-radius:6px;font-size:13px;cursor:pointer;font-family:-apple-system,sans-serif;">Imprimir / Guardar como PDF</button>
  </div>
</body>
</html>`;
}
