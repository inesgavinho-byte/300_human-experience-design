import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Trash2, Play } from 'lucide-react';
import type { SystemScene } from '@/types';

interface SceneEditorProps {
  scenes: SystemScene[];
  onChange: (scenes: SystemScene[]) => void;
}

export default function SceneEditor({ scenes, onChange }: SceneEditorProps) {
  function addScene() {
    onChange([...scenes, { name: 'Nova Cena', trigger: 'manual', actions: ['Ação 1'] }]);
  }

  function removeScene(idx: number) {
    onChange(scenes.filter((_, i) => i !== idx));
  }

  function updateScene(idx: number, updated: SystemScene) {
    onChange(scenes.map((s, i) => i === idx ? updated : s));
  }

  const triggerColors: Record<string, string> = {
    'chegada': 'bg-green-100 text-green-800',
    'partida': 'bg-amber-100 text-amber-800',
    'manual': 'bg-line/40 text-ink',
    'horário': 'bg-blue-100 text-blue-800',
    'sensor': 'bg-purple-100 text-purple-800',
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-serif text-sm text-ink">Cenários Programáveis</h4>
        <Button variant="outline" size="sm" className="border-line text-ink" onClick={addScene}>
          <Plus size={14} className="mr-1" /> Adicionar Cena
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {scenes.map((scene, idx) => (
          <Card key={idx} className="border-line bg-white">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Play size={14} className="text-olive" strokeWidth={1.5} />
                  <Input
                    value={scene.name}
                    onChange={e => updateScene(idx, { ...scene, name: e.target.value })}
                    className="h-7 text-sm border-line font-sans w-40"
                  />
                </div>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-olive hover:text-red-600" onClick={() => removeScene(idx)}>
                  <Trash2 size={12} />
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-[10px] text-olive font-sans">Trigger</Label>
                  <select
                    value={scene.trigger || 'manual'}
                    onChange={e => updateScene(idx, { ...scene, trigger: e.target.value })}
                    className="w-full h-7 px-2 text-xs border border-line rounded-md bg-white mt-0.5 font-sans"
                  >
                    <option value="manual">Manual</option>
                    <option value="chegada">Chegada</option>
                    <option value="partida">Partida</option>
                    <option value="horário">Horário</option>
                    <option value="sensor">Sensor</option>
                  </select>
                </div>
                <div>
                  <Label className="text-[10px] text-olive font-sans">Divisão</Label>
                  <Input
                    value={scene.room_code || ''}
                    onChange={e => updateScene(idx, { ...scene, room_code: e.target.value })}
                    className="h-7 text-xs border-line mt-0.5"
                    placeholder="Global"
                  />
                </div>
              </div>

              <div>
                <Label className="text-[10px] text-olive font-sans">Ações (uma por linha)</Label>
                <textarea
                  value={scene.actions.join('\n')}
                  onChange={e => updateScene(idx, { ...scene, actions: e.target.value.split('\n').filter(Boolean) })}
                  className="w-full min-h-[60px] px-2 py-1.5 text-xs border border-line rounded-md bg-white mt-0.5 font-sans resize-y"
                  placeholder="Luzes 30%&#10;Cortinas fechadas"
                />
              </div>

              <div className="flex flex-wrap gap-1">
                <Badge variant="outline" className={`text-[10px] ${triggerColors[scene.trigger || 'manual'] || 'bg-line/40 text-ink'}`}>
                  {scene.trigger || 'manual'}
                </Badge>
                {scene.room_code && (
                  <Badge variant="outline" className="text-[10px] border-line text-olive">
                    {scene.room_code}
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {scenes.length === 0 && (
        <p className="text-sm text-olive font-sans">Sem cenários configurados. Adicione cenários para automatizar experiências.</p>
      )}
    </div>
  );
}
