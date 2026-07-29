import { useState, useEffect } from 'react';
import { askDeepSeek } from '@/lib/deepseek';
import { supabase } from '@/lib/supabase';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Loader2, Link2, Sparkles, Save, Globe, FileText,
  Plus, Trash2, ChevronRight, Package, Router, Wifi,
} from 'lucide-react';
import { toast } from 'sonner';

interface SimpleProject {
  id: string;
  name: string;
  client_id: string | null;
}

/* ─── Types ─── */
interface ExtractedData {
  name: string;
  brand: string;
  reference: string;
  description: string;
  category: string;
  unit_price: number | null;
  supplier: string;
  alternatives: string;
  justification: string;
  specifications: Record<string, string>;
  datasheet_url: string;
  image_url: string | null;
  source_url: string;
  firmware_version: string;
  warranty_years: number | null;
  ip_address: string;
  mac_address: string;
  network_zone: string;
  room_code: string;
  status: string;
}

interface EquipmentImporterProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved?: () => void;
}

const CATEGORIES = [
  'Iluminação', 'Áudio', 'Vídeo', 'HVAC', 'Rede', 'Segurança',
  'Automação', 'Controlo', 'Outro',
];

const NETWORK_ZONES = ['KNX', 'Wi-Fi', 'Thread/Matter', 'Ethernet', 'Zigbee', 'Z-Wave', 'Proprietário', 'Outro'];
const STATUSES = ['online', 'offline', 'warning', 'error', 'unknown'];

/* ─── Component ─── */
export default function EquipmentImporter({ open, onOpenChange, onSaved }: EquipmentImporterProps) {
  const [step, setStep] = useState<'input' | 'review'>('input');
  const [url, setUrl] = useState('');
  const [text, setText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [extracted, setExtracted] = useState<ExtractedData | null>(null);
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([]);
  const [projects, setProjects] = useState<SimpleProject[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('none');
  const [newSpecKey, setNewSpecKey] = useState('');
  const [newSpecValue, setNewSpecValue] = useState('');

  /* Load reference data */
  useEffect(() => {
    if (!open) return;
    supabase.from('equipment_categories').select('id, name').then(({ data }) => {
      if (data) setCategories(data);
    });
    supabase.from('projects').select('id, name, client_id').order('name').then(({ data }) => {
      if (data) setProjects(data as SimpleProject[]);
    });
  }, [open]);

  /* Reset on close */
  useEffect(() => {
    if (!open) {
      setStep('input');
      setUrl('');
      setText('');
      setExtracted(null);
      setSelectedProjectId('none');
      setNewSpecKey('');
      setNewSpecValue('');
    }
  }, [open]);

  /* ─── DeepSeek extraction ─── */
  async function extractWithDeepSeek(urlStr: string, textStr: string): Promise<ExtractedData> {
    const prompt = `You are a product data extractor for a smart home / building automation equipment catalog.
Extract structured data from this product information.

URL: ${urlStr || 'N/A'}
Content:
${textStr || 'N/A'}

Extract as JSON with these exact fields:
{
  "name": "product full name",
  "brand": "manufacturer brand",
  "reference": "model number / SKU / reference code",
  "description": "detailed description in Portuguese (Portugal)",
  "category": "one of: Iluminação, Áudio, Vídeo, HVAC, Rede, Segurança, Automação, Controlo, Outro",
  "unit_price": 123.45 (number or null if not found),
  "supplier": "distributor or supplier name (often same as brand)",
  "alternatives": "alternative models or brands, comma separated",
  "justification": "why this product is recommended, in Portuguese",
  "specifications": {"key": "value", ...} — include ALL technical specs: power, voltage, dimensions, weight, protocol, communication, frequency, etc.,
  "datasheet_url": "URL to datasheet or technical document",
  "image_url": "URL to product image",
  "source_url": "original product page URL",
  "firmware_version": "firmware version if mentioned",
  "warranty_years": 2 (number or null),
  "ip_address": "default IP if mentioned",
  "mac_address": "MAC address if mentioned",
  "network_zone": "network protocol: KNX, Wi-Fi, Thread/Matter, Ethernet, Zigbee, Z-Wave, Proprietário, or Outro",
  "room_code": "typical room where installed (e.g. Sala, Suite, Cozinha)",
  "status": "unknown"
}

Rules:
- Use Portuguese (Portugal) for description and justification.
- If price is not mentioned, set unit_price to null.
- Extract as many specifications as possible. Include power ratings, dimensions, weight, protocols, interfaces, certifications.
- If network_zone is not clear, infer from brand/category (e.g., Basalte = KNX, Sonos = Wi-Fi, Shelly = Wi-Fi).
- Return ONLY the JSON object, no markdown formatting, no explanation.`;

    const response = await askDeepSeek([{ role: 'user', content: prompt }]);

    let jsonStr = response;
    const codeBlockMatch = response.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (codeBlockMatch) jsonStr = codeBlockMatch[1];
    // Also try to find raw JSON object
    const rawJsonMatch = jsonStr.match(/\{[\s\S]*\}/);
    if (rawJsonMatch) jsonStr = rawJsonMatch[0];

    const data = JSON.parse(jsonStr);

    return {
      name: data.name || '',
      brand: data.brand || '',
      reference: data.reference || '',
      description: data.description || '',
      category: data.category || 'Outro',
      unit_price: typeof data.unit_price === 'number' ? data.unit_price : null,
      supplier: data.supplier || data.brand || '',
      alternatives: data.alternatives || '',
      justification: data.justification || '',
      specifications: data.specifications && typeof data.specifications === 'object'
        ? data.specifications
        : {},
      datasheet_url: data.datasheet_url || urlStr || '',
      image_url: data.image_url || null,
      source_url: urlStr || data.source_url || '',
      firmware_version: data.firmware_version || '',
      warranty_years: typeof data.warranty_years === 'number' ? data.warranty_years : null,
      ip_address: data.ip_address || '',
      mac_address: data.mac_address || '',
      network_zone: data.network_zone || '',
      room_code: data.room_code || '',
      status: data.status || 'unknown',
    };
  }

  /* ─── Analyze handler ─── */
  async function handleAnalyze() {
    if (!url && !text) {
      toast.error('Insira um URL ou texto do produto');
      return;
    }
    setIsAnalyzing(true);
    try {
      const data = await extractWithDeepSeek(url, text);
      setExtracted(data);
      setStep('review');
      toast.success('Dados extraídos via IA — revise antes de guardar');
    } catch (err: any) {
      console.error(err);
      toast.error('Erro ao analisar: ' + (err.message || 'Falha na extração'));
    } finally {
      setIsAnalyzing(false);
    }
  }

  /* ─── Save handler ─── */
  async function handleSave() {
    if (!extracted) return;

    const category = categories.find(c =>
      c.name.toLowerCase() === extracted.category.toLowerCase()
    ) || categories.find(c => c.name === 'Outro');

    if (!category) {
      toast.error('Categoria não encontrada no catálogo. Crie a categoria primeiro.');
      return;
    }

    const { error } = await supabase.from('equipment').insert({
      category_id: category.id,
      name: extracted.name,
      brand: extracted.brand,
      reference: extracted.reference,
      description: extracted.description,
      unit_price: extracted.unit_price,
      supplier: extracted.supplier || extracted.brand,
      alternatives: extracted.alternatives || null,
      justification: extracted.justification || null,
      specifications_json: extracted.specifications,
      datasheet_url: extracted.datasheet_url || null,
      image_url: extracted.image_url,
      source_url: extracted.source_url || null,
      firmware_version: extracted.firmware_version || null,
      warranty_years: extracted.warranty_years,
      ip_address: extracted.ip_address || null,
      mac_address: extracted.mac_address || null,
      network_zone: extracted.network_zone || null,
      project_id: selectedProjectId === 'none' ? null : selectedProjectId,
      room_code: extracted.room_code || null,
      status: extracted.status as any,
    });

    if (error) {
      toast.error('Erro ao guardar: ' + error.message);
    } else {
      toast.success('Equipamento guardado no catálogo');
      setExtracted(null);
      setUrl('');
      setText('');
      setStep('input');
      setSelectedProjectId('none');
      onOpenChange(false);
      onSaved?.();
    }
  }

  function updateField<K extends keyof ExtractedData>(field: K, value: ExtractedData[K]) {
    if (!extracted) return;
    setExtracted({ ...extracted, [field]: value });
  }

  function addSpec() {
    if (!extracted || !newSpecKey.trim()) return;
    setExtracted({
      ...extracted,
      specifications: { ...extracted.specifications, [newSpecKey.trim()]: newSpecValue.trim() },
    });
    setNewSpecKey('');
    setNewSpecValue('');
  }

  function removeSpec(key: string) {
    if (!extracted) return;
    const { [key]: _, ...rest } = extracted.specifications;
    setExtracted({ ...extracted, specifications: rest });
  }

  function updateSpecKey(oldKey: string, newKey: string) {
    if (!extracted || !newKey.trim() || oldKey === newKey) return;
    const value = extracted.specifications[oldKey];
    const { [oldKey]: _, ...rest } = extracted.specifications;
    setExtracted({ ...extracted, specifications: { ...rest, [newKey.trim()]: value } });
  }

  function updateSpecValue(key: string, value: string) {
    if (!extracted) return;
    setExtracted({ ...extracted, specifications: { ...extracted.specifications, [key]: value } });
  }

  /* ─── Render ─── */
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto bg-ivory border-line">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl text-ink flex items-center gap-2">
            <Link2 size={18} strokeWidth={1.5} />
            {step === 'input' ? 'Importar Equipamento via Link + IA' : 'Revisar Dados Extraídos'}
          </DialogTitle>
        </DialogHeader>

        {step === 'input' ? (
          <div className="space-y-4">
            {/* Step indicator */}
            <div className="flex items-center gap-2 text-xs font-sans text-olive">
              <span className="flex items-center gap-1 bg-ink text-ivory px-2 py-0.5 rounded-full">1 URL</span>
              <ChevronRight size={12} />
              <span className="px-2 py-0.5 rounded-full border border-line">2 Revisão</span>
              <ChevronRight size={12} />
              <span className="px-2 py-0.5 rounded-full border border-line">3 Guardar</span>
            </div>

            {/* URL Input */}
            <div>
              <Label className="text-ink font-sans text-sm flex items-center gap-1.5">
                <Globe size={14} strokeWidth={1.5} />
                URL do Produto
              </Label>
              <Input
                placeholder="https://www.basalte.com/products/dot4"
                value={url}
                onChange={e => setUrl(e.target.value)}
                className="bg-ivory border-line text-ink mt-1.5"
              />
              <p className="text-[11px] text-olive mt-1 font-sans">
                A IA vai analisar o URL e o texto fornecido para extrair nome, referência, descrição e especificações técnicas.
                Se o site bloquear o acesso, cole o texto da página abaixo.
              </p>
            </div>

            {/* Text fallback */}
            <div>
              <Label className="text-ink font-sans text-sm flex items-center gap-1.5">
                <FileText size={14} strokeWidth={1.5} />
                Texto / Especificações (opcional — use se o scraping falhar)
              </Label>
              <Textarea
                placeholder="Cole aqui o texto, HTML ou especificações do produto..."
                value={text}
                onChange={e => setText(e.target.value)}
                rows={5}
                className="bg-ivory border-line text-ink mt-1.5 font-mono text-xs"
              />
            </div>

            <Button
              onClick={handleAnalyze}
              disabled={isAnalyzing || (!url && !text)}
              className="w-full bg-ink text-ivory hover:bg-ink/90 font-sans"
            >
              {isAnalyzing ? <Loader2 size={16} className="animate-spin mr-2" /> : <Sparkles size={16} className="mr-2" />}
              {isAnalyzing ? 'A analisar com IA...' : 'Analisar com IA (DeepSeek)'}
            </Button>

            <p className="text-[10px] text-olive font-sans text-center">
              A análise pode demorar 10–20 segundos. A IA extrai dados estruturados a partir do URL e texto fornecidos.
            </p>
          </div>
        ) : extracted && (
          <div className="space-y-5">
            {/* Step indicator */}
            <div className="flex items-center gap-2 text-xs font-sans text-olive">
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full border border-line">1 URL</span>
              <ChevronRight size={12} />
              <span className="flex items-center gap-1 bg-ink text-ivory px-2 py-0.5 rounded-full">2 Revisão</span>
              <ChevronRight size={12} />
              <span className="px-2 py-0.5 rounded-full border border-line">3 Guardar</span>
            </div>

            {/* Image preview */}
            {extracted.image_url && (
              <div className="flex justify-center">
                <img
                  src={extracted.image_url}
                  alt={extracted.name}
                  className="max-h-36 object-contain rounded-md border border-line bg-white p-2"
                  onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
              </div>
            )}

            {/* Core Info */}
            <Card className="border-line bg-ivory">
              <CardHeader className="pb-2">
                <CardTitle className="font-serif text-base text-ink flex items-center gap-2">
                  <Package size={16} strokeWidth={1.5} />
                  Informação Principal
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label className="text-olive text-xs font-sans">Nome *</Label>
                  <Input value={extracted.name} onChange={e => updateField('name', e.target.value)} className="bg-ivory border-line text-ink mt-1" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-olive text-xs font-sans">Marca</Label>
                    <Input value={extracted.brand} onChange={e => updateField('brand', e.target.value)} className="bg-ivory border-line text-ink mt-1" />
                  </div>
                  <div>
                    <Label className="text-olive text-xs font-sans">Referência</Label>
                    <Input value={extracted.reference} onChange={e => updateField('reference', e.target.value)} className="bg-ivory border-line text-ink mt-1 font-mono text-xs" />
                  </div>
                </div>

                <div>
                  <Label className="text-olive text-xs font-sans">Descrição</Label>
                  <Textarea value={extracted.description} onChange={e => updateField('description', e.target.value)} rows={3} className="bg-ivory border-line text-ink mt-1" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-olive text-xs font-sans">Categoria</Label>
                    <Select value={extracted.category} onValueChange={v => updateField('category', v)}>
                      <SelectTrigger className="bg-ivory border-line text-ink mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-olive text-xs font-sans">Preço Unitário (€)</Label>
                    <Input
                      type="number" step="0.01"
                      value={extracted.unit_price ?? ''}
                      onChange={e => updateField('unit_price', e.target.value ? parseFloat(e.target.value) : null)}
                      className="bg-ivory border-line text-ink mt-1"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Project & Location */}
            <Card className="border-line bg-ivory">
              <CardHeader className="pb-2">
                <CardTitle className="font-serif text-base text-ink flex items-center gap-2">
                  <Router size={16} strokeWidth={1.5} />
                  Projeto & Localização
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-olive text-xs font-sans">Projeto</Label>
                    <Select value={selectedProjectId} onValueChange={v => setSelectedProjectId(v)}>
                      <SelectTrigger className="bg-ivory border-line text-ink mt-1">
                        <SelectValue placeholder="Sem projeto" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Sem projeto</SelectItem>
                        {projects.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-olive text-xs font-sans">Divisão (Room Code)</Label>
                    <Input
                      value={extracted.room_code}
                      onChange={e => updateField('room_code', e.target.value)}
                      placeholder="e.g. Sala, Suite, Cozinha"
                      className="bg-ivory border-line text-ink mt-1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-olive text-xs font-sans">Zona de Rede</Label>
                    <Select value={extracted.network_zone || 'none'} onValueChange={v => updateField('network_zone', v === 'none' ? '' : v)}>
                      <SelectTrigger className="bg-ivory border-line text-ink mt-1">
                        <SelectValue placeholder="Selecionar..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">— Nenhuma —</SelectItem>
                        {NETWORK_ZONES.map(z => <SelectItem key={z} value={z}>{z}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-olive text-xs font-sans">Status</Label>
                    <Select value={extracted.status} onValueChange={v => updateField('status', v)}>
                      <SelectTrigger className="bg-ivory border-line text-ink mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Technical Details */}
            <Card className="border-line bg-ivory">
              <CardHeader className="pb-2">
                <CardTitle className="font-serif text-base text-ink flex items-center gap-2">
                  <Wifi size={16} strokeWidth={1.5} />
                  Detalhes Técnicos
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label className="text-olive text-xs font-sans">Firmware</Label>
                    <Input value={extracted.firmware_version} onChange={e => updateField('firmware_version', e.target.value)} className="bg-ivory border-line text-ink mt-1 font-mono text-xs" />
                  </div>
                  <div>
                    <Label className="text-olive text-xs font-sans">Garantia (anos)</Label>
                    <Input
                      type="number" step="0.5"
                      value={extracted.warranty_years ?? ''}
                      onChange={e => updateField('warranty_years', e.target.value ? parseFloat(e.target.value) : null)}
                      className="bg-ivory border-line text-ink mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-olive text-xs font-sans">IP Address</Label>
                    <Input value={extracted.ip_address} onChange={e => updateField('ip_address', e.target.value)} placeholder="192.168.1.x" className="bg-ivory border-line text-ink mt-1 font-mono text-xs" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-olive text-xs font-sans">MAC Address</Label>
                    <Input value={extracted.mac_address} onChange={e => updateField('mac_address', e.target.value)} placeholder="AA:BB:CC:DD:EE:FF" className="bg-ivory border-line text-ink mt-1 font-mono text-xs" />
                  </div>
                  <div>
                    <Label className="text-olive text-xs font-sans">Fornecedor</Label>
                    <Input value={extracted.supplier} onChange={e => updateField('supplier', e.target.value)} className="bg-ivory border-line text-ink mt-1" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Specifications */}
            <Card className="border-line bg-ivory">
              <CardHeader className="pb-2">
                <CardTitle className="font-serif text-base text-ink flex items-center gap-2">
                  <FileText size={16} strokeWidth={1.5} />
                  Especificações Técnicas ({Object.keys(extracted.specifications).length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {Object.keys(extracted.specifications).length === 0 && (
                  <p className="text-xs text-olive font-sans">Nenhuma especificação extraída. Adicione manualmente abaixo.</p>
                )}
                <div className="space-y-2">
                  {Object.entries(extracted.specifications).map(([key, value]) => (
                    <div key={key} className="flex items-center gap-2">
                      <Input
                        value={key}
                        onChange={e => updateSpecKey(key, e.target.value)}
                        className="bg-ivory border-line text-ink text-xs w-1/3 font-sans"
                      />
                      <Input
                        value={value}
                        onChange={e => updateSpecValue(key, e.target.value)}
                        className="bg-ivory border-line text-ink text-xs flex-1 font-sans"
                      />
                      <button onClick={() => removeSpec(key)} className="p-1 hover:bg-red-50 rounded text-red-500">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Add new spec */}
                <div className="flex items-center gap-2 pt-2 border-t border-line/50">
                  <Input
                    placeholder="Nome da especificação"
                    value={newSpecKey}
                    onChange={e => setNewSpecKey(e.target.value)}
                    className="bg-ivory border-line text-ink text-xs w-1/3 font-sans"
                    onKeyDown={e => e.key === 'Enter' && addSpec()}
                  />
                  <Input
                    placeholder="Valor"
                    value={newSpecValue}
                    onChange={e => setNewSpecValue(e.target.value)}
                    className="bg-ivory border-line text-ink text-xs flex-1 font-sans"
                    onKeyDown={e => e.key === 'Enter' && addSpec()}
                  />
                  <Button size="sm" variant="outline" onClick={addSpec} className="border-line text-ink">
                    <Plus size={14} />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Links */}
            <Card className="border-line bg-ivory">
              <CardHeader className="pb-2">
                <CardTitle className="font-serif text-base text-ink flex items-center gap-2">
                  <Globe size={16} strokeWidth={1.5} />
                  Links & Fontes
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label className="text-olive text-xs font-sans">URL da Loja / Fonte</Label>
                  <Input value={extracted.source_url} onChange={e => updateField('source_url', e.target.value)} className="bg-ivory border-line text-ink mt-1 font-mono text-xs" />
                </div>
                <div>
                  <Label className="text-olive text-xs font-sans">URL da Ficha Técnica</Label>
                  <Input value={extracted.datasheet_url} onChange={e => updateField('datasheet_url', e.target.value)} className="bg-ivory border-line text-ink mt-1 font-mono text-xs" />
                </div>
                <div>
                  <Label className="text-olive text-xs font-sans">URL da Imagem</Label>
                  <Input value={extracted.image_url || ''} onChange={e => updateField('image_url', e.target.value || null)} className="bg-ivory border-line text-ink mt-1 font-mono text-xs" />
                </div>
              </CardContent>
            </Card>

            {/* Source badges */}
            <div className="flex flex-wrap gap-2">
              {extracted.source_url && (
                <Badge variant="outline" className="text-[10px] font-sans">
                  <Globe size={10} className="mr-1" />
                  {(() => { try { return new URL(extracted.source_url).hostname; } catch { return extracted.source_url; } })()}
                </Badge>
              )}
              {extracted.brand && (
                <Badge variant="outline" className="text-[10px] font-sans">
                  {extracted.brand}
                </Badge>
              )}
              {extracted.network_zone && (
                <Badge variant="outline" className="text-[10px] font-sans">
                  <Wifi size={10} className="mr-1" />
                  {extracted.network_zone}
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Footer actions */}
        {step === 'review' && extracted && (
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => { setStep('input'); setExtracted(null); }}
              className="font-sans border-line text-ink"
            >
              Voltar
            </Button>
            <Button
              onClick={handleSave}
              disabled={!extracted.name}
              className="bg-ink text-ivory hover:bg-ink/90 font-sans"
            >
              <Save size={16} className="mr-1.5" />
              Guardar no Catálogo
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
