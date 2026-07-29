import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Trash2 } from 'lucide-react';
import type { SystemDevice } from '@/types';

interface DeviceSelectorProps {
  devices: SystemDevice[];
  onChange: (devices: SystemDevice[]) => void;
}

const CATEGORIES = [
  'Iluminação', 'Controlo', 'Climatização', 'Áudio', 'Vídeo',
  'Cortinas', 'Segurança', 'Rede', 'Servidor', 'Sensor', 'Outro'
];

export default function DeviceSelector({ devices, onChange }: DeviceSelectorProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('Todas');

  function addDevice() {
    onChange([...devices, { name: 'Novo Equipamento', category: 'Outro', quantity: 1 }]);
  }

  function removeDevice(idx: number) {
    onChange(devices.filter((_, i) => i !== idx));
  }

  function updateDevice(idx: number, updated: SystemDevice) {
    onChange(devices.map((d, i) => i === idx ? updated : d));
  }

  const filtered = selectedCategory === 'Todas' ? devices : devices.filter(d => d.category === selectedCategory);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-1 flex-wrap">
          <button
            onClick={() => setSelectedCategory('Todas')}
            className={`px-2 py-1 text-[10px] rounded-full border font-sans transition-colors ${
              selectedCategory === 'Todas' ? 'bg-ink text-ivory border-ink' : 'border-line text-olive hover:border-ink'
            }`}
          >
            Todas
          </button>
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-2 py-1 text-[10px] rounded-full border font-sans transition-colors ${
                selectedCategory === cat ? 'bg-ink text-ivory border-ink' : 'border-line text-olive hover:border-ink'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
        <Button variant="outline" size="sm" className="border-line text-ink" onClick={addDevice}>
          <Plus size={14} className="mr-1" /> Equipamento
        </Button>
      </div>

      <div className="space-y-2">
        {filtered.map((device, idx) => {
          const realIdx = devices.findIndex(d => d === device);
          return (
            <Card key={idx} className="border-line bg-white">
              <CardContent className="p-3">
                <div className="grid grid-cols-12 gap-2 items-end">
                  <div className="col-span-3">
                    <Label className="text-[10px] text-olive font-sans">Nome</Label>
                    <Input
                      value={device.name}
                      onChange={e => updateDevice(realIdx, { ...device, name: e.target.value })}
                      className="h-7 text-xs border-line mt-0.5"
                    />
                  </div>
                  <div className="col-span-2">
                    <Label className="text-[10px] text-olive font-sans">Marca</Label>
                    <Input
                      value={device.brand || ''}
                      onChange={e => updateDevice(realIdx, { ...device, brand: e.target.value })}
                      className="h-7 text-xs border-line mt-0.5"
                    />
                  </div>
                  <div className="col-span-2">
                    <Label className="text-[10px] text-olive font-sans">Ref.</Label>
                    <Input
                      value={device.reference || ''}
                      onChange={e => updateDevice(realIdx, { ...device, reference: e.target.value })}
                      className="h-7 text-xs border-line mt-0.5"
                    />
                  </div>
                  <div className="col-span-2">
                    <Label className="text-[10px] text-olive font-sans">Categoria</Label>
                    <select
                      value={device.category || 'Outro'}
                      onChange={e => updateDevice(realIdx, { ...device, category: e.target.value })}
                      className="w-full h-7 px-1 text-xs border border-line rounded-md bg-white mt-0.5 font-sans"
                    >
                      {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="col-span-1">
                    <Label className="text-[10px] text-olive font-sans">Qtd</Label>
                    <Input
                      type="number"
                      value={device.quantity || 1}
                      onChange={e => updateDevice(realIdx, { ...device, quantity: parseInt(e.target.value) || 1 })}
                      className="h-7 text-xs border-line mt-0.5"
                    />
                  </div>
                  <div className="col-span-1">
                    <Label className="text-[10px] text-olive font-sans">Div.</Label>
                    <Input
                      value={device.room_code || ''}
                      onChange={e => updateDevice(realIdx, { ...device, room_code: e.target.value })}
                      className="h-7 text-xs border-line mt-0.5"
                      placeholder="Global"
                    />
                  </div>
                  <div className="col-span-1 flex justify-end">
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-olive hover:text-red-600" onClick={() => removeDevice(realIdx)}>
                      <Trash2 size={12} />
                    </Button>
                  </div>
                </div>
                {device.notes && (
                  <p className="text-[10px] text-olive font-sans mt-1 pl-0.5">{device.notes}</p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {devices.length === 0 && (
        <p className="text-sm text-olive font-sans">Sem equipamentos configurados.</p>
      )}
    </div>
  );
}
