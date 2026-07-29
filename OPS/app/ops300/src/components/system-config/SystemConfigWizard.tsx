import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent } from '@/components/ui/card';
import {
  ArrowRight, ArrowLeft, Check, Home, Sun, Cpu, Apple, Wrench,
  Building2, Lightbulb, ChevronDown, ChevronUp, Layers, Plug, Zap,
  Thermometer, Music, Eye
} from 'lucide-react';
import type { SystemConfiguration, SystemRoom, Project } from '@/types';
import { getTemplateByType } from '@/lib/system-templates';

interface WizardProps {
  project: Project;
  onComplete: (config: Partial<SystemConfiguration>) => void;
  onCancel: () => void;
}

const TEMPLATE_META: Record<string, { label: string; icon: React.ElementType; desc: string; badge: string; badgeColor: string }> = {
  basalte_knx: { label: 'Basalte Home KNX', icon: Home, desc: 'Hiperminimalismo tecnológico. 2700K uniforme. Lógica DOT universal.', badge: 'KNX', badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  lutron_dali: { label: 'Lutron HomeWorks QS + DALI', icon: Sun, desc: 'Sistema americano premium. Estore Sivoia QS silencioso. Keypads Palladiom/seeTouch.', badge: 'DALI', badgeColor: 'bg-amber-100 text-amber-800 border-amber-200' },
  crestron: { label: 'Crestron Home', icon: Cpu, desc: 'Automação completa A/V, iluminação, climatização. Processador CP4-R.', badge: 'IP', badgeColor: 'bg-sky-100 text-sky-800 border-sky-200' },
  savant: { label: 'Savant Pro', icon: Apple, desc: 'Experiência intuitiva. Integração nativa Apple HomeKit. Host Pro.', badge: 'HomeKit', badgeColor: 'bg-rose-100 text-rose-800 border-rose-200' },
  custom: { label: 'Configuração Personalizada', icon: Wrench, desc: 'Começar de raiz com um sistema totalmente personalizado.', badge: 'Custom', badgeColor: 'bg-stone-100 text-stone-800 border-stone-200' },
};

function getTempColor(temp?: string) {
  if (!temp) return 'bg-stone-100 text-stone-700 border-stone-200';
  if (temp.includes('DT8') || temp.includes('tunable')) return 'bg-violet-100 text-violet-800 border-violet-200';
  if (temp.includes('3000')) return 'bg-amber-100 text-amber-800 border-amber-200';
  if (temp.includes('2700')) return 'bg-orange-100 text-orange-800 border-orange-200';
  return 'bg-stone-100 text-stone-700 border-stone-200';
}

function getControlLabel(type?: string) {
  if (!type) return 'Controlo';
  if (type.includes('DOT')) return 'DOT';
  if (type.includes('Palladiom') || type.includes('seeTouch')) return 'Keypad';
  if (type.includes('TSW') || type.includes('Cameo') || type.includes('HR-310')) return 'Touch/Keypad';
  if (type.includes('Savant')) return 'Savant';
  return 'Controlo';
}

export default function SystemConfigWizard({ project, onComplete, onCancel }: WizardProps) {
  const [step, setStep] = useState(1);
  const [templateType, setTemplateType] = useState<string>('basalte_knx');
  const [configName, setConfigName] = useState('');
  const [rooms, setRooms] = useState<SystemRoom[]>([]);
  const [expandedRooms, setExpandedRooms] = useState<Set<number>>(new Set());

  const templateMeta = TEMPLATE_META[templateType] || TEMPLATE_META.custom;

  function handleNext() {
    if (step === 1) {
      const template = getTemplateByType(templateType);
      if (template) {
        setConfigName(template.name);
        setRooms(template.rooms.map(r => ({ ...r })));
      }
    }
    setStep(s => s + 1);
  }

  function handleBack() {
    setStep(s => s - 1);
  }

  function handleFinish() {
    const template = getTemplateByType(templateType);
    onComplete({
      project_id: project.id,
      name: configName || 'Nova Configuração',
      template_type: templateType as SystemConfiguration['template_type'],
      status: 'draft',
      rooms,
      devices: template?.integrations?.map(i => ({ name: i.system, category: 'Integração', notes: i.role })) || [],
      scenes: template?.scenes || [],
      integrations: template?.integrations || [],
      notes: template?.description || null,
    });
  }

  function addRoom() {
    setRooms(prev => [...prev, { code: `SALA_${prev.length + 1}`, name: 'Nova Divisão', dots: [{ type: 'DOT4', buttons: ['Luz', 'Cortina', '—', 'Master OFF'] }], lighting: { temp: '2700K' } }]);
  }

  function removeRoom(idx: number) {
    setRooms(prev => prev.filter((_, i) => i !== idx));
  }

  function updateRoom(idx: number, field: keyof SystemRoom, value: string) {
    setRooms(prev => prev.map((r, i) => i === idx ? { ...r, [field]: value } : r));
  }

  function toggleRoomExpand(idx: number) {
    setExpandedRooms(prev => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  }

  const deviceCount = rooms.reduce((sum, r) => sum + (r.dots?.length || 0), 0);
  const sceneCount = getTemplateByType(templateType)?.scenes?.length || 0;
  const integrationCount = getTemplateByType(templateType)?.integrations?.length || 0;

  return (
    <Dialog open onOpenChange={onCancel}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto bg-ivory border-line">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl text-ink">
            Nova Configuração de Sistema — {project.name}
          </DialogTitle>
        </DialogHeader>

        {/* Progress */}
        <div className="flex items-center gap-2 mb-4">
          {[1, 2, 3].map(s => (
            <div key={s} className={`flex-1 h-1 rounded-full ${s <= step ? 'bg-ink' : 'bg-line'}`} />
          ))}
        </div>

        {step === 1 && (
          <div className="space-y-4">
            <p className="text-sm text-olive font-sans">Escolha o template base para o sistema:</p>
            <RadioGroup value={templateType} onValueChange={setTemplateType} className="space-y-3">
              {Object.entries(TEMPLATE_META).map(([key, meta]) => {
                const Icon = meta.icon;
                return (
                  <Label key={key} className="cursor-pointer">
                    <Card className={`border transition-colors ${templateType === key ? 'border-ink bg-ink/5' : 'border-line hover:border-olive'}`}>
                      <CardContent className="p-4 flex items-start gap-3">
                        <RadioGroupItem value={key} className="mt-1" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <Icon size={16} className="text-olive" strokeWidth={1.5} />
                            <span className="text-sm font-medium text-ink font-sans">{meta.label}</span>
                            <Badge variant="outline" className={`text-[10px] ${meta.badgeColor}`}>
                              {meta.badge}
                            </Badge>
                          </div>
                          <p className="text-xs text-olive font-sans mt-1">{meta.desc}</p>
                        </div>
                      </CardContent>
                    </Card>
                  </Label>
                );
              })}
            </RadioGroup>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-olive font-sans">Defina as divisões do sistema:</p>
              <Badge variant="outline" className="text-[10px] border-line text-olive">
                {rooms.length} divisões · {deviceCount} controlos
              </Badge>
            </div>
            <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
              {rooms.map((room, idx) => {
                const isExpanded = expandedRooms.has(idx);
                const dotCount = room.dots?.length || 0;
                return (
                  <Card key={idx} className="border border-line bg-white overflow-hidden">
                    <CardContent className="p-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 grid grid-cols-2 gap-2">
                          <Input
                            value={room.code}
                            onChange={e => updateRoom(idx, 'code', e.target.value)}
                            placeholder="Código"
                            className="text-xs h-8 border-line"
                          />
                          <Input
                            value={room.name}
                            onChange={e => updateRoom(idx, 'name', e.target.value)}
                            placeholder="Nome"
                            className="text-xs h-8 border-line"
                          />
                        </div>
                        <Badge variant="outline" className={`text-[10px] border-line ${getTempColor(room.lighting?.temp)}`}>
                          {room.lighting?.temp || '—'}
                        </Badge>
                        <Badge variant="outline" className="text-[10px] border-line text-olive">
                          {dotCount} {getControlLabel(room.dots?.[0]?.type)}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-olive hover:text-ink"
                          onClick={() => toggleRoomExpand(idx)}
                        >
                          {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-olive hover:text-red-600"
                          onClick={() => removeRoom(idx)}
                        >
                          ×
                        </Button>
                      </div>

                      {isExpanded && (
                        <div className="mt-3 pt-3 border-t border-line/50 space-y-2">
                          {room.dots && room.dots.length > 0 && (
                            <div className="space-y-1">
                              <p className="text-[10px] font-medium text-olive uppercase tracking-wide">Controlos</p>
                              {room.dots.map((dot, dIdx) => (
                                <div key={dIdx} className="text-xs text-ink font-sans flex items-center gap-2 bg-ivory/60 rounded px-2 py-1">
                                  <Zap size={10} className="text-olive" />
                                  <span className="font-medium">{dot.type}</span>
                                  {dot.position && <span className="text-olive">({dot.position})</span>}
                                  <span className="text-olive truncate">{dot.buttons.join(' · ')}</span>
                                </div>
                              ))}
                            </div>
                          )}
                          {room.lighting && (
                            <div className="flex items-center gap-2 text-xs text-ink font-sans">
                              <Lightbulb size={10} className="text-olive" />
                              <span>Iluminação:</span>
                              <Badge variant="outline" className={`text-[10px] ${getTempColor(room.lighting.temp)}`}>
                                {room.lighting.temp}
                              </Badge>
                              {room.lighting.cri && <span className="text-olive">CRI {room.lighting.cri}</span>}
                              {room.lighting.scenes && (
                                <span className="text-olive">Cenas: {room.lighting.scenes.join(', ')}</span>
                              )}
                            </div>
                          )}
                          {room.sensors && room.sensors.length > 0 && (
                            <div className="flex items-center gap-2 text-xs text-ink font-sans">
                              <Eye size={10} className="text-olive" />
                              <span>Sensores: {room.sensors.join(', ')}</span>
                            </div>
                          )}
                          {room.climate && (
                            <div className="flex items-center gap-2 text-xs text-ink font-sans">
                              <Thermometer size={10} className="text-olive" />
                              <span>Climatização: {room.climate}</span>
                            </div>
                          )}
                          {room.audio && (
                            <div className="flex items-center gap-2 text-xs text-ink font-sans">
                              <Music size={10} className="text-olive" />
                              <span>Áudio: {room.audio}</span>
                            </div>
                          )}
                          {room.notes && (
                            <div className="text-[11px] text-olive font-sans italic">
                              Nota: {room.notes}
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
            <Button variant="outline" size="sm" className="border-line text-ink" onClick={addRoom}>
              + Adicionar Divisão
            </Button>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <p className="text-sm text-olive font-sans">Revise e finalize:</p>
            <div className="space-y-3">
              <div>
                <Label className="text-xs text-olive font-sans">Nome da Configuração</Label>
                <Input value={configName} onChange={e => setConfigName(e.target.value)} className="border-line mt-1" />
              </div>

              {/* Summary cards */}
              <div className="grid grid-cols-3 gap-2">
                <Card className="border border-line bg-white">
                  <CardContent className="p-3 flex flex-col items-center text-center">
                    <Layers size={18} className="text-olive mb-1" strokeWidth={1.5} />
                    <span className="text-lg font-serif text-ink">{rooms.length}</span>
                    <span className="text-[10px] text-olive font-sans uppercase tracking-wide">Divisões</span>
                  </CardContent>
                </Card>
                <Card className="border border-line bg-white">
                  <CardContent className="p-3 flex flex-col items-center text-center">
                    <Zap size={18} className="text-olive mb-1" strokeWidth={1.5} />
                    <span className="text-lg font-serif text-ink">{deviceCount}</span>
                    <span className="text-[10px] text-olive font-sans uppercase tracking-wide">Controlos</span>
                  </CardContent>
                </Card>
                <Card className="border border-line bg-white">
                  <CardContent className="p-3 flex flex-col items-center text-center">
                    <Plug size={18} className="text-olive mb-1" strokeWidth={1.5} />
                    <span className="text-lg font-serif text-ink">{integrationCount}</span>
                    <span className="text-[10px] text-olive font-sans uppercase tracking-wide">Integrações</span>
                  </CardContent>
                </Card>
              </div>

              <div className="p-3 border border-line rounded-md bg-white space-y-2">
                <div className="flex justify-between text-sm font-sans">
                  <span className="text-olive">Template</span>
                  <span className="text-ink flex items-center gap-1">
                    <templateMeta.icon size={12} className="text-olive" />
                    {templateMeta.label}
                  </span>
                </div>
                <div className="flex justify-between text-sm font-sans">
                  <span className="text-olive">Divisões</span>
                  <span className="text-ink">{rooms.length}</span>
                </div>
                <div className="flex justify-between text-sm font-sans">
                  <span className="text-olive">Cenas</span>
                  <span className="text-ink">{sceneCount}</span>
                </div>
                <div className="flex justify-between text-sm font-sans">
                  <span className="text-olive">Projeto</span>
                  <span className="text-ink">{project.name}</span>
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-[10px] font-medium text-olive uppercase tracking-wide">Divisões configuradas</p>
                {rooms.map((r, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-ink font-sans bg-white border border-line rounded px-2 py-1.5">
                    <Building2 size={12} className="text-olive" />
                    <span className="font-medium">{r.name}</span>
                    <span className="text-olive">({r.code})</span>
                    {r.lighting?.temp && (
                      <Badge variant="outline" className={`text-[9px] ml-auto ${getTempColor(r.lighting.temp)}`}>
                        {r.lighting.temp}
                      </Badge>
                    )}
                    <span className="text-olive">{r.dots?.length || 0} {getControlLabel(r.dots?.[0]?.type)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex justify-between pt-4 border-t border-line">
          <Button variant="outline" size="sm" className="border-line text-ink" onClick={step === 1 ? onCancel : handleBack}>
            {step === 1 ? 'Cancelar' : <><ArrowLeft size={14} className="mr-1" /> Anterior</>}
          </Button>
          {step < 3 ? (
            <Button size="sm" className="bg-ink text-ivory hover:bg-dark" onClick={handleNext}>
              Seguinte <ArrowRight size={14} className="ml-1" />
            </Button>
          ) : (
            <Button size="sm" className="bg-ink text-ivory hover:bg-dark" onClick={handleFinish}>
              <Check size={14} className="mr-1" /> Criar Configuração
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
