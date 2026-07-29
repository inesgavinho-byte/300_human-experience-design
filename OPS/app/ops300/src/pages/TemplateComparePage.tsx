import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import {
  GitCompare, Download, MessageSquare, Star, ExternalLink,
  DollarSign, Clock, Hash,
} from 'lucide-react';

interface EquipmentItem {
  name: string;
  ref: string;
  qty: number;
  unit_price: number;
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

interface FlatEquipment {
  ref: string;
  name: string;
  unit_price: number;
  qty: number;
  brand: string;
  room: string;
}

interface EquipmentScore {
  ref: string;
  brand: string;
  name: string;
  score_300: number | null;
  score_reviews: number | null;
  review_sources: { source: string; score: number; url?: string }[];
  review_summary: string | null;
}

const BRAND_COLORS: Record<string, string> = {
  Basalte: 'bg-amber-50 border-amber-200 text-amber-800',
  Lutron: 'bg-blue-50 border-blue-200 text-blue-800',
  Crestron: 'bg-purple-50 border-purple-200 text-purple-800',
  Savant: 'bg-emerald-50 border-emerald-200 text-emerald-800',
  Custom: 'bg-gray-50 border-gray-200 text-gray-800',
};

function flattenTemplate(t: SystemTemplate | null): FlatEquipment[] {
  if (!t) return [];
  const items: FlatEquipment[] = [];
  t.rooms.forEach(room => {
    room.equipment.forEach(eq => {
      items.push({
        ref: eq.ref,
        name: eq.name,
        unit_price: eq.unit_price,
        qty: eq.qty,
        brand: t.brand,
        room: room.name,
      });
    });
  });
  return items;
}

function getUniqueRefs(a: FlatEquipment[], b: FlatEquipment[]): string[] {
  const set = new Set<string>();
  a.forEach(x => set.add(x.ref));
  b.forEach(x => set.add(x.ref));
  return Array.from(set).sort();
}

function findByRef(items: FlatEquipment[], ref: string): FlatEquipment | undefined {
  return items.find(x => x.ref === ref);
}

function scoreColor(score: number | null): string {
  if (score === null) return 'bg-gray-100 text-gray-400';
  if (score >= 90) return 'bg-emerald-100 text-emerald-700 border-emerald-200';
  if (score >= 75) return 'bg-blue-100 text-blue-700 border-blue-200';
  if (score >= 60) return 'bg-amber-100 text-amber-700 border-amber-200';
  return 'bg-red-100 text-red-700 border-red-200';
}

function scoreBarColor(score: number | null): string {
  if (score === null) return 'bg-gray-200';
  if (score >= 90) return 'bg-emerald-500';
  if (score >= 75) return 'bg-blue-500';
  if (score >= 60) return 'bg-amber-500';
  return 'bg-red-500';
}

export default function TemplateComparePage() {
  const [templates, setTemplates] = useState<SystemTemplate[]>([]);
  const [leftTemplate, setLeftTemplate] = useState<SystemTemplate | null>(null);
  const [rightTemplate, setRightTemplate] = useState<SystemTemplate | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [conclusion, setConclusion] = useState('');
  const [scores, setScores] = useState<Record<string, EquipmentScore>>({});
  const [showScoreDetail, setShowScoreDetail] = useState<string | null>(null);
  const pdfRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchTemplates();
  }, []);

  useEffect(() => {
    if (leftTemplate || rightTemplate) {
      fetchScores();
    }
  }, [leftTemplate, rightTemplate]);

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

  async function fetchScores() {
    const refs = new Set<string>();
    if (leftTemplate) {
      leftTemplate.rooms.forEach(r => r.equipment.forEach(e => refs.add(e.ref)));
    }
    if (rightTemplate) {
      rightTemplate.rooms.forEach(r => r.equipment.forEach(e => refs.add(e.ref)));
    }
    if (refs.size === 0) return;

    try {
      const { data, error } = await supabase
        .from('equipment_scores')
        .select('*')
        .in('ref', Array.from(refs));
      if (error) throw error;
      const map: Record<string, EquipmentScore> = {};
      (data || []).forEach((s: any) => {
        map[s.ref] = s;
      });
      setScores(map);
    } catch (err) {
      console.error('Erro ao carregar scores:', err);
    }
  }

  async function handleExportPdf() {
    if (!pdfRef.current || !leftTemplate || !rightTemplate) return;
    setExportingPdf(true);

    const printWrapper = document.createElement('div');
    printWrapper.style.cssText = 'position:fixed;left:-9999px;top:0;width:210mm;background:#fff;padding:20px;font-family:system-ui,-apple-system,sans-serif;color:#1a1a1a;';

    const today = new Date().toLocaleDateString('pt-PT', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });

    const conclusionHtml = conclusion.trim()
      ? `<div style="margin:24px 0;padding:16px;border:1px solid #e5e5e5;border-radius:4px;background:#fafafa;">
           <div style="font-size:10px;color:#666;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;font-weight:600;">Conclusão e Recomendação</div>
           <div style="font-size:11px;color:#333;line-height:1.6;white-space:pre-wrap;">${conclusion.replace(/\n/g, '<br>')}</div>
         </div>`
      : '';

    printWrapper.innerHTML = `
      <div style="border-bottom:2px solid #1a1a1a;padding-bottom:16px;margin-bottom:24px;display:flex;justify-content:space-between;align-items:flex-end;">
        <div>
          <div style="font-family:Georgia,serif;font-size:28px;letter-spacing:4px;font-weight:400;color:#1a1a1a;">300</div>
          <div style="font-size:9px;text-transform:uppercase;letter-spacing:2px;color:#666;margin-top:2px;">Human Experience Design</div>
        </div>
        <div style="text-align:right;">
          <div style="font-size:10px;color:#666;text-transform:uppercase;letter-spacing:1px;">Comparativo de Sistemas</div>
          <div style="font-size:9px;color:#999;margin-top:4px;">${today}</div>
        </div>
      </div>
      <div style="margin-bottom:16px;">
        <div style="font-size:11px;color:#666;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;">Sistemas em comparação</div>
        <div style="display:flex;gap:16px;">
          <div style="flex:1;border:1px solid #e5e5e5;padding:12px;border-radius:4px;">
            <div style="font-size:9px;color:#999;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;">Sistema A</div>
            <div style="font-family:Georgia,serif;font-size:16px;color:#1a1a1a;">${leftTemplate.brand}</div>
            <div style="font-size:11px;color:#444;margin-top:2px;">${leftTemplate.name}</div>
          </div>
          <div style="flex:1;border:1px solid #e5e5e5;padding:12px;border-radius:4px;">
            <div style="font-size:9px;color:#999;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;">Sistema B</div>
            <div style="font-family:Georgia,serif;font-size:16px;color:#1a1a1a;">${rightTemplate.brand}</div>
            <div style="font-size:11px;color:#444;margin-top:2px;">${rightTemplate.name}</div>
          </div>
        </div>
      </div>
    `;

    const contentClone = pdfRef.current.cloneNode(true) as HTMLElement;
    const conclusionSection = contentClone.querySelector('[data-conclusion-section]');
    if (conclusionSection) conclusionSection.remove();
    printWrapper.appendChild(contentClone);

    if (conclusionHtml) {
      const conclusionDiv = document.createElement('div');
      conclusionDiv.innerHTML = conclusionHtml;
      printWrapper.appendChild(conclusionDiv);
    }

    const footer = document.createElement('div');
    footer.style.cssText = 'margin-top:32px;padding-top:16px;border-top:1px solid #e5e5e5;font-size:8px;color:#999;line-height:1.6;';
    footer.innerHTML = `
      <div style="display:flex;justify-content:space-between;">
        <div>
          <strong style="color:#666;">Notas:</strong><br>
          • Preços indicativos em EUR, sujeitos a confirmação de fornecedor.<br>
          • Prazos estimados dependem da complexidade do projeto e disponibilidade.<br>
          • Diferenças de preço por referência calculadas em base unitária.<br>
          • Equipamentos marcados como "Só em A/B" são exclusivos do respetivo sistema.<br>
          • Scores da 300 e de reviews são indicativos e atualizados periodicamente.
        </div>
        <div style="text-align:right;white-space:nowrap;margin-left:24px;">
          <span style="font-family:Georgia,serif;font-size:12px;letter-spacing:2px;color:#1a1a1a;">300</span><br>
          <span style="font-size:7px;color:#bbb;">Documento gerado automaticamente pela plataforma 300 OPS</span>
        </div>
      </div>
    `;
    printWrapper.appendChild(footer);

    document.body.appendChild(printWrapper);

    try {
      const html2pdf = (await import('html2pdf.js')).default;
      const opt = {
        margin: [12, 12, 12, 12] as [number, number, number, number],
        filename: `Comparacao_${leftTemplate.brand}_vs_${rightTemplate.brand}_${new Date().toISOString().slice(0, 10)}.pdf`,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const },
      };
      await html2pdf().set(opt).from(printWrapper).save();
      toast.success('PDF exportado com sucesso');
    } catch (err) {
      console.error('PDF generation failed:', err);
      toast.error('Erro ao gerar PDF');
    } finally {
      document.body.removeChild(printWrapper);
      setExportingPdf(false);
    }
  }

  const leftItems = flattenTemplate(leftTemplate);
  const rightItems = flattenTemplate(rightTemplate);
  const allRefs = getUniqueRefs(leftItems, rightItems);

  function calcTotal(items: FlatEquipment[]): number {
    return items.reduce((sum, i) => sum + i.qty * i.unit_price, 0);
  }

  function calcSummary(t: SystemTemplate | null, items: FlatEquipment[]) {
    if (!t) return null;
    const equipTotal = calcTotal(items);
    return {
      brand: t.brand,
      name: t.name,
      category: t.category,
      estimatedDays: t.estimated_days,
      basePrice: t.base_price_eur,
      pricePerSqm: t.price_per_sqm,
      equipCount: items.length,
      equipTotal,
      total: equipTotal + t.base_price_eur,
      tags: t.tags,
    };
  }

  const leftSummary = calcSummary(leftTemplate, leftItems);
  const rightSummary = calcSummary(rightTemplate, rightItems);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-serif text-3xl text-ink flex items-center gap-2">
            <GitCompare size={22} strokeWidth={1.5} />
            Comparador de Templates
          </h1>
          <p className="text-olive text-sm mt-1 font-sans">Compare dois sistemas lado a lado</p>
        </div>
        {leftTemplate && rightTemplate && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportPdf}
            disabled={exportingPdf}
            className="gap-1.5"
          >
            <Download size={14} strokeWidth={1.5} />
            {exportingPdf ? 'A gerar...' : 'Exportar PDF'}
          </Button>
        )}
      </div>

      {/* Selectores */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-[10px] text-olive font-sans uppercase tracking-wider mb-1 block">Sistema A</label>
          <select
            value={leftTemplate?.id || ''}
            onChange={e => setLeftTemplate(templates.find(t => t.id === e.target.value) || null)}
            className="w-full px-3 py-2 text-sm border border-line rounded-md bg-white text-ink font-sans focus:outline-none focus:ring-1 focus:ring-ink"
          >
            <option value="">— Escolher template —</option>
            {templates.map(t => (
              <option key={t.id} value={t.id}>{t.brand} — {t.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-[10px] text-olive font-sans uppercase tracking-wider mb-1 block">Sistema B</label>
          <select
            value={rightTemplate?.id || ''}
            onChange={e => setRightTemplate(templates.find(t => t.id === e.target.value) || null)}
            className="w-full px-3 py-2 text-sm border border-line rounded-md bg-white text-ink font-sans focus:outline-none focus:ring-1 focus:ring-ink"
          >
            <option value="">— Escolher template —</option>
            {templates.map(t => (
              <option key={t.id} value={t.id}>{t.brand} — {t.name}</option>
            ))}
          </select>
        </div>
      </div>

      {leftTemplate && rightTemplate && (
        <>
          <div ref={pdfRef} className="space-y-6">
            {/* Resumo comparativo */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <CompareCard
                label="Equipamentos"
                left={leftSummary?.equipCount ?? 0}
                right={rightSummary?.equipCount ?? 0}
                format="count"
                icon={Hash}
              />
              <CompareCard
                label="Custo Equip."
                left={leftSummary?.equipTotal ?? 0}
                right={rightSummary?.equipTotal ?? 0}
                format="eur"
                icon={DollarSign}
              />
              <CompareCard
                label="Prazo Est."
                left={leftSummary?.estimatedDays ?? 0}
                right={rightSummary?.estimatedDays ?? 0}
                format="days"
                icon={Clock}
              />
              <CompareCard
                label="Total Est."
                left={leftSummary?.total ?? 0}
                right={rightSummary?.total ?? 0}
                format="eur"
                icon={DollarSign}
                highlight
              />
            </div>

            {/* Tabela comparativa de equipamentos com Scores */}
            <Card className="border-line bg-ivory overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle className="font-serif text-base text-ink">Comparação de Equipamentos</CardTitle>
              </CardHeader>
              <CardContent className="p-0 overflow-x-auto">
                <table className="w-full text-xs font-sans">
                  <thead className="bg-line/20 text-[10px] uppercase tracking-wider text-olive">
                    <tr>
                      <th className="text-left px-3 py-2 w-1/5">Equipamento</th>
                      <th className="text-left px-3 py-2">Ref.</th>
                      <th className="text-center px-3 py-2 w-12">Qtd</th>
                      <th className="text-right px-3 py-2 w-20">{leftSummary?.brand || 'A'}</th>
                      <th className="text-right px-3 py-2 w-20">{rightSummary?.brand || 'B'}</th>
                      <th className="text-center px-3 py-2 w-16">Score 300</th>
                      <th className="text-center px-3 py-2 w-16">Reviews</th>
                      <th className="text-right px-3 py-2 w-16">Dif.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allRefs.map(ref => {
                      const left = findByRef(leftItems, ref);
                      const right = findByRef(rightItems, ref);
                      const isOnlyLeft = left && !right;
                      const isOnlyRight = !left && right;
                      const bothPresent = left && right;
                      const diff = bothPresent ? right.unit_price - left.unit_price : 0;
                      const showName = left?.name || right?.name || ref;
                      const showRoom = left?.room || right?.room || '';
                      const score = scores[ref];

                      return (
                        <tr key={ref} className={`border-t border-line/30 ${isOnlyLeft ? 'bg-blue-50/30' : isOnlyRight ? 'bg-amber-50/30' : ''}`}>
                          <td className="px-3 py-2">
                            <span className="text-ink">{showName}</span>
                            {showRoom && <span className="block text-[9px] text-olive/60">{showRoom}</span>}
                          </td>
                          <td className="px-3 py-2 text-olive">{ref}</td>
                          <td className="px-3 py-2 text-center text-ink">
                            {bothPresent ? (
                              left.qty === right.qty ? left.qty : `${left.qty} / ${right.qty}`
                            ) : left ? left.qty : right ? right.qty : '—'}
                          </td>
                          <td className="px-3 py-2 text-right">
                            {left ? (
                              <span className="text-ink">{left.unit_price.toLocaleString('pt-PT')}€</span>
                            ) : (
                              <span className="text-olive/30">—</span>
                            )}
                          </td>
                          <td className="px-3 py-2 text-right">
                            {right ? (
                              <span className="text-ink">{right.unit_price.toLocaleString('pt-PT')}€</span>
                            ) : (
                              <span className="text-olive/30">—</span>
                            )}
                          </td>
                          {/* Score 300 */}
                          <td className="px-3 py-2">
                            {score?.score_300 !== null && score?.score_300 !== undefined ? (
                              <button
                                onClick={() => setShowScoreDetail(showScoreDetail === ref ? null : ref)}
                                className={`w-full text-center text-[10px] font-medium py-0.5 rounded border ${scoreColor(score.score_300)} cursor-pointer hover:opacity-80 transition-opacity`}
                              >
                                {score.score_300}
                              </button>
                            ) : (
                              <span className="block text-center text-[10px] text-olive/30">—</span>
                            )}
                          </td>
                          {/* Score Reviews */}
                          <td className="px-3 py-2">
                            {score?.score_reviews !== null && score?.score_reviews !== undefined ? (
                              <button
                                onClick={() => setShowScoreDetail(showScoreDetail === ref ? null : ref)}
                                className={`w-full flex items-center justify-center gap-0.5 text-[10px] font-medium py-0.5 rounded border ${scoreColor(score.score_reviews)} cursor-pointer hover:opacity-80 transition-opacity`}
                              >
                                <Star size={8} strokeWidth={2} />
                                {score.score_reviews}
                              </button>
                            ) : (
                              <span className="block text-center text-[10px] text-olive/30">—</span>
                            )}
                          </td>
                          <td className="px-3 py-2 text-right">
                            {bothPresent ? (
                              <span className={`font-medium ${diff > 0 ? 'text-amber-700' : diff < 0 ? 'text-blue-700' : 'text-olive'}`}>
                                {diff > 0 ? '+' : ''}{diff.toLocaleString('pt-PT')}€
                              </span>
                            ) : isOnlyLeft ? (
                              <span className="text-blue-600 text-[10px]">Só A</span>
                            ) : isOnlyRight ? (
                              <span className="text-amber-600 text-[10px]">Só B</span>
                            ) : null}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </CardContent>
            </Card>

            {/* Score Detail Panel */}
            {showScoreDetail && scores[showScoreDetail] && (
              <Card className="border-line bg-ivory">
                <CardHeader className="pb-2 flex flex-row items-center justify-between">
                  <CardTitle className="font-serif text-sm text-ink">
                    Scorecard: {scores[showScoreDetail].name || showScoreDetail}
                  </CardTitle>
                  <button
                    onClick={() => setShowScoreDetail(null)}
                    className="text-olive hover:text-ink text-xs"
                  >
                    Fechar
                  </button>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Score 300 */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase tracking-wider text-olive font-sans">Score 300</span>
                        <span className={`text-sm font-serif font-medium ${scores[showScoreDetail].score_300 !== null ? scoreColor(scores[showScoreDetail].score_300).split(' ')[1] : 'text-olive'}`}>
                          {scores[showScoreDetail].score_300 ?? '—'}/100
                        </span>
                      </div>
                      <div className="h-2 bg-line/30 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${scoreBarColor(scores[showScoreDetail].score_300)} transition-all duration-500`}
                          style={{ width: `${scores[showScoreDetail].score_300 ?? 0}%` }}
                        />
                      </div>
                      <p className="text-[10px] text-olive leading-relaxed">
                        Avaliação interna da 300 baseada em critérios técnicos, fiabilidade, 
                        integração com outros sistemas e experiência de instalação.
                      </p>
                    </div>
                    {/* Score Reviews */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase tracking-wider text-olive font-sans">Reviews na Net</span>
                        <span className={`text-sm font-serif font-medium ${scores[showScoreDetail].score_reviews !== null ? scoreColor(scores[showScoreDetail].score_reviews!).split(' ')[1] : 'text-olive'}`}>
                          {scores[showScoreDetail].score_reviews ?? '—'}/100
                        </span>
                      </div>
                      <div className="h-2 bg-line/30 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${scoreBarColor(scores[showScoreDetail].score_reviews)} transition-all duration-500`}
                          style={{ width: `${scores[showScoreDetail].score_reviews ?? 0}%` }}
                        />
                      </div>
                      <p className="text-[10px] text-olive leading-relaxed">
                        Média ponderada de reviews credíveis: AVS Forum, CNET, Reddit r/HomeAutomation, 
                        Amazon, Trustpilot e publicações especializadas.
                      </p>
                    </div>
                  </div>

                  {scores[showScoreDetail].review_summary && (
                    <div className="pt-2 border-t border-line/30">
                      <span className="text-[10px] uppercase tracking-wider text-olive font-sans block mb-1">Resumo das Reviews</span>
                      <p className="text-xs text-ink leading-relaxed">{scores[showScoreDetail].review_summary}</p>
                    </div>
                  )}

                  {scores[showScoreDetail].review_sources && scores[showScoreDetail].review_sources.length > 0 && (
                    <div className="pt-2 border-t border-line/30">
                      <span className="text-[10px] uppercase tracking-wider text-olive font-sans block mb-2">Fontes</span>
                      <div className="flex flex-wrap gap-2">
                        {scores[showScoreDetail].review_sources.map((src: any, i: number) => (
                          <a
                            key={i}
                            href={src.url || '#'}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[10px] bg-line/20 text-ink px-2 py-1 rounded hover:bg-line/40 transition-colors"
                          >
                            {src.source}
                            <span className="text-olive">({src.score}/5)</span>
                            <ExternalLink size={8} strokeWidth={2} />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Tags / Features comparison */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="border-line bg-ivory">
                <CardHeader className="pb-2">
                  <CardTitle className="font-serif text-sm text-ink flex items-center gap-2">
                    <span className={`text-[10px] font-sans uppercase tracking-wider px-2 py-0.5 rounded border ${BRAND_COLORS[leftSummary?.brand || 'Custom']}`}>
                      {leftSummary?.brand}
                    </span>
                    {leftSummary?.name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-1.5">
                    {leftSummary?.tags.map(tag => (
                      <span key={tag} className="text-[10px] font-sans bg-line/30 text-ink px-2 py-0.5 rounded">{tag}</span>
                    ))}
                  </div>
                </CardContent>
              </Card>
              <Card className="border-line bg-ivory">
                <CardHeader className="pb-2">
                  <CardTitle className="font-serif text-sm text-ink flex items-center gap-2">
                    <span className={`text-[10px] font-sans uppercase tracking-wider px-2 py-0.5 rounded border ${BRAND_COLORS[rightSummary?.brand || 'Custom']}`}>
                      {rightSummary?.brand}
                    </span>
                    {rightSummary?.name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-1.5">
                    {rightSummary?.tags.map(tag => (
                      <span key={tag} className="text-[10px] font-sans bg-line/30 text-ink px-2 py-0.5 rounded">{tag}</span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* ── Conclusão / Recomendação ── */}
          <div data-conclusion-section className="space-y-2">
            <label className="text-[10px] text-olive font-sans uppercase tracking-wider flex items-center gap-1.5">
              <MessageSquare size={12} strokeWidth={1.5} />
              Conclusão e Recomendação
            </label>
            <textarea
              value={conclusion}
              onChange={e => setConclusion(e.target.value)}
              placeholder="Escreva aqui a sua análise, conclusão ou recomendação para o cliente. Este texto será incluído no PDF exportado."
              rows={5}
              className="w-full px-3 py-2.5 text-sm border border-line rounded-md bg-white text-ink font-sans focus:outline-none focus:ring-1 focus:ring-ink resize-y placeholder:text-olive/40 leading-relaxed"
            />
            {conclusion.trim() && (
              <p className="text-[10px] text-olive font-sans">
                {conclusion.length} caracteres · será incluído no PDF
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════
   Compare Card
   ═══════════════════════════════════════════ */
function CompareCard({
  label,
  left,
  right,
  format,
  icon: Icon,
  highlight = false,
}: {
  label: string;
  left: number;
  right: number;
  format: 'count' | 'eur' | 'days';
  icon: React.ElementType;
  highlight?: boolean;
}) {
  const diff = right - left;
  const pct = left !== 0 ? ((diff / left) * 100).toFixed(0) : '—';

  function fmt(n: number): string {
    if (format === 'eur') return n.toLocaleString('pt-PT') + '€';
    if (format === 'days') return `≈ ${n} dias`;
    return String(n);
  }

  return (
    <Card className={`border ${highlight ? 'border-ink bg-ink' : 'border-line bg-ivory'}`}>
      <CardContent className="p-3">
        <div className="flex items-center gap-1.5 mb-2">
          <Icon size={12} className={highlight ? 'text-ivory/50' : 'text-olive'} strokeWidth={1.5} />
          <span className={`text-[10px] uppercase tracking-wider font-sans ${highlight ? 'text-ivory/60' : 'text-olive'}`}>{label}</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="text-center">
            <p className={`text-sm font-serif ${highlight ? 'text-ivory' : 'text-ink'}`}>{fmt(left)}</p>
            <p className="text-[9px] text-olive font-sans">A</p>
          </div>
          <div className="text-center border-l border-line/30">
            <p className={`text-sm font-serif ${highlight ? 'text-ivory' : 'text-ink'}`}>{fmt(right)}</p>
            <p className="text-[9px] text-olive font-sans">B</p>
          </div>
        </div>
        {diff !== 0 && (
          <div className={`mt-2 text-center text-[10px] font-sans ${diff > 0 ? 'text-amber-600' : 'text-blue-600'}`}>
            {diff > 0 ? '+' : ''}{format === 'eur' ? diff.toLocaleString('pt-PT') + '€' : format === 'days' ? `${diff} dias` : String(diff)}
            {format === 'eur' && left > 0 && <span className="ml-1 text-olive/50">({pct}%)</span>}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
