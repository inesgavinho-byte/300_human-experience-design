import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Trash2, Link2 } from 'lucide-react';
import type { SystemIntegration } from '@/types';

interface IntegrationPanelProps {
  integrations: SystemIntegration[];
  onChange: (integrations: SystemIntegration[]) => void;
}

export default function IntegrationPanel({ integrations, onChange }: IntegrationPanelProps) {
  function addIntegration() {
    onChange([...integrations, { system: 'Novo Sistema', role: 'Função' }]);
  }

  function removeIntegration(idx: number) {
    onChange(integrations.filter((_, i) => i !== idx));
  }

  function updateIntegration(idx: number, updated: SystemIntegration) {
    onChange(integrations.map((int, i) => i === idx ? updated : int));
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-serif text-sm text-ink">Sistemas Integrados</h4>
        <Button variant="outline" size="sm" className="border-line text-ink" onClick={addIntegration}>
          <Plus size={14} className="mr-1" /> Integração
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {integrations.map((int, idx) => (
          <Card key={idx} className="border-line bg-white">
            <CardContent className="p-4 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Link2 size={14} className="text-olive" strokeWidth={1.5} />
                  <Input
                    value={int.system}
                    onChange={e => updateIntegration(idx, { ...int, system: e.target.value })}
                    className="h-7 text-sm border-line font-sans w-40"
                  />
                </div>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-olive hover:text-red-600" onClick={() => removeIntegration(idx)}>
                  <Trash2 size={12} />
                </Button>
              </div>
              <div>
                <Label className="text-[10px] text-olive font-sans">Função / Role</Label>
                <Input
                  value={int.role}
                  onChange={e => updateIntegration(idx, { ...int, role: e.target.value })}
                  className="h-7 text-xs border-line mt-0.5"
                />
              </div>
              <div>
                <Label className="text-[10px] text-olive font-sans">Modelo (opcional)</Label>
                <Input
                  value={int.model || ''}
                  onChange={e => updateIntegration(idx, { ...int, model: e.target.value })}
                  className="h-7 text-xs border-line mt-0.5"
                />
              </div>
              <div>
                <Label className="text-[10px] text-olive font-sans">Protocolos (separados por vírgula)</Label>
                <Input
                  value={int.protocols?.join(', ') || ''}
                  onChange={e => updateIntegration(idx, { ...int, protocols: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                  className="h-7 text-xs border-line mt-0.5"
                  placeholder="KNX, DALI, IP"
                />
              </div>
              {int.protocols && int.protocols.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {int.protocols.map((p, i) => (
                    <Badge key={i} variant="outline" className="text-[10px] border-line text-olive">{p}</Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {integrations.length === 0 && (
        <p className="text-sm text-olive font-sans">Sem integrações configuradas.</p>
      )}
    </div>
  );
}
