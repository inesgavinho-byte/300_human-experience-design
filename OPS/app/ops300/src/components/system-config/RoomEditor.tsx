import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Trash2, Lightbulb, Thermometer, Music, Wifi } from 'lucide-react';
import type { SystemRoom, SystemDot } from '@/types';

interface RoomEditorProps {
  rooms: SystemRoom[];
  onChange: (rooms: SystemRoom[]) => void;
}

export default function RoomEditor({ rooms, onChange }: RoomEditorProps) {
  const [selectedRoomIdx, setSelectedRoomIdx] = useState(0);
  const room = rooms[selectedRoomIdx];

  function updateRoom(updated: SystemRoom) {
    onChange(rooms.map((r, i) => i === selectedRoomIdx ? updated : r));
  }

  function addDot() {
    if (!room) return;
    const newDot: SystemDot = { type: 'DOT4', position: '', buttons: ['Luz', 'Cortina', '—', 'Master OFF'] };
    updateRoom({ ...room, dots: [...(room.dots || []), newDot] });
  }

  function removeDot(dotIdx: number) {
    if (!room) return;
    updateRoom({ ...room, dots: room.dots?.filter((_, i) => i !== dotIdx) || [] });
  }

  function updateDot(dotIdx: number, dot: SystemDot) {
    if (!room) return;
    updateRoom({ ...room, dots: room.dots?.map((d, i) => i === dotIdx ? dot : d) || [] });
  }

  if (!room) {
    return <p className="text-sm text-olive font-sans">Sem divisões configuradas.</p>;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Room list */}
      <div className="space-y-2">
        <h4 className="font-serif text-sm text-ink">Divisões</h4>
        {rooms.map((r, i) => (
          <button
            key={i}
            onClick={() => setSelectedRoomIdx(i)}
            className={`w-full text-left px-3 py-2 rounded-md text-sm font-sans transition-colors ${
              i === selectedRoomIdx ? 'bg-ink text-ivory' : 'bg-white border border-line text-ink hover:bg-line/20'
            }`}
          >
            <div className="flex items-center justify-between">
              <span>{r.name}</span>
              <Badge variant="outline" className={`text-[10px] ${i === selectedRoomIdx ? 'border-ivory/30 text-ivory' : 'border-line text-olive'}`}>
                {r.code}
              </Badge>
            </div>
          </button>
        ))}
      </div>

      {/* Room detail */}
      <div className="lg:col-span-2 space-y-4">
        <Tabs defaultValue="general" className="w-full">
          <TabsList className="bg-line/30">
            <TabsTrigger value="general" className="text-xs font-sans">Geral</TabsTrigger>
            <TabsTrigger value="dots" className="text-xs font-sans">DOTs</TabsTrigger>
            <TabsTrigger value="lighting" className="text-xs font-sans">Iluminação</TabsTrigger>
            <TabsTrigger value="systems" className="text-xs font-sans">Sistemas</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-3 mt-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-olive font-sans">Código</Label>
                <Input value={room.code} onChange={e => updateRoom({ ...room, code: e.target.value })} className="border-line mt-1" />
              </div>
              <div>
                <Label className="text-xs text-olive font-sans">Nome</Label>
                <Input value={room.name} onChange={e => updateRoom({ ...room, name: e.target.value })} className="border-line mt-1" />
              </div>
            </div>
            <div>
              <Label className="text-xs text-olive font-sans">Notas</Label>
              <Input value={room.notes || ''} onChange={e => updateRoom({ ...room, notes: e.target.value })} className="border-line mt-1" placeholder="Notas técnicas da divisão..." />
            </div>
          </TabsContent>

          <TabsContent value="dots" className="space-y-3 mt-3">
            {room.dots?.map((dot, idx) => (
              <Card key={idx} className="border-line bg-white">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="font-serif text-sm text-ink">DOT {idx + 1}</CardTitle>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-olive hover:text-red-600" onClick={() => removeDot(idx)}>
                      <Trash2 size={12} />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs text-olive font-sans">Tipo</Label>
                      <select
                        value={dot.type}
                        onChange={e => updateDot(idx, { ...dot, type: e.target.value })}
                        className="w-full h-9 px-2 text-sm border border-line rounded-md bg-white mt-1 font-sans"
                      >
                        <option value="DOT2">DOT2</option>
                        <option value="DOT4">DOT4</option>
                        <option value="DOT8">DOT8</option>
                      </select>
                    </div>
                    <div>
                      <Label className="text-xs text-olive font-sans">Posição</Label>
                      <Input value={dot.position || ''} onChange={e => updateDot(idx, { ...dot, position: e.target.value })} className="border-line mt-1" placeholder="ex: entrada" />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs text-olive font-sans">Botões</Label>
                    <div className="grid grid-cols-4 gap-1 mt-1">
                      {dot.buttons.map((btn, bidx) => (
                        <Input
                          key={bidx}
                          value={btn}
                          onChange={e => {
                            const newButtons = [...dot.buttons];
                            newButtons[bidx] = e.target.value;
                            updateDot(idx, { ...dot, buttons: newButtons });
                          }}
                          className="text-[10px] h-7 border-line px-1 text-center"
                        />
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            <Button variant="outline" size="sm" className="border-line text-ink" onClick={addDot}>
              <Plus size={14} className="mr-1" /> Adicionar DOT
            </Button>
          </TabsContent>

          <TabsContent value="lighting" className="space-y-3 mt-3">
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="text-xs text-olive font-sans flex items-center gap-1"><Lightbulb size={12} /> Tipo</Label>
                <Input value={room.lighting?.type || ''} onChange={e => updateRoom({ ...room, lighting: { ...room.lighting, type: e.target.value } })} className="border-line mt-1" placeholder="spots_trimless" />
              </div>
              <div>
                <Label className="text-xs text-olive font-sans">Temperatura</Label>
                <select
                  value={room.lighting?.temp || '2700K'}
                  onChange={e => updateRoom({ ...room, lighting: { ...room.lighting, temp: e.target.value } })}
                  className="w-full h-9 px-2 text-sm border border-line rounded-md bg-white mt-1 font-sans"
                >
                  <option value="2700K">2700K (padrão)</option>
                  <option value="3000K">3000K (zona trabalho)</option>
                  <option value="4000K">4000K (comercial)</option>
                </select>
              </div>
              <div>
                <Label className="text-xs text-olive font-sans">CRI</Label>
                <Input value={room.lighting?.cri || ''} onChange={e => updateRoom({ ...room, lighting: { ...room.lighting, cri: e.target.value } })} className="border-line mt-1" placeholder="≥90" />
              </div>
            </div>
            <div>
              <Label className="text-xs text-olive font-sans">Cenas de Iluminação</Label>
              <Input value={room.lighting?.scenes?.join(', ') || ''} onChange={e => updateRoom({ ...room, lighting: { ...room.lighting, scenes: e.target.value.split(',').map(s => s.trim()).filter(Boolean) } })} className="border-line mt-1" placeholder="Cinema, Jantar, Recepção (separado por vírgulas)" />
            </div>
          </TabsContent>

          <TabsContent value="systems" className="space-y-3 mt-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-olive font-sans flex items-center gap-1"><Thermometer size={12} /> Climatização</Label>
                <Input value={room.climate || ''} onChange={e => updateRoom({ ...room, climate: e.target.value })} className="border-line mt-1" placeholder="ex: Shelly H&T Gen3" />
              </div>
              <div>
                <Label className="text-xs text-olive font-sans flex items-center gap-1"><Music size={12} /> Áudio</Label>
                <Input value={room.audio || ''} onChange={e => updateRoom({ ...room, audio: e.target.value })} className="border-line mt-1" placeholder="ex: Sonos Arc" />
              </div>
            </div>
            <div>
              <Label className="text-xs text-olive font-sans flex items-center gap-1"><Wifi size={12} /> Sensores</Label>
              <Input value={room.sensors?.join(', ') || ''} onChange={e => updateRoom({ ...room, sensors: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })} className="border-line mt-1" placeholder="Auro presença, H&T (separado por vírgulas)" />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
