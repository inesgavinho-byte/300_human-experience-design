import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, AlertTriangle, XCircle, Lightbulb } from 'lucide-react';
import type { SystemConfiguration } from '@/types';

interface ConfigValidatorProps {
  config: SystemConfiguration;
}

export default function ConfigValidator({ config }: ConfigValidatorProps) {
  const checks = [
    { id: 'rooms', label: 'Divisões configuradas', test: config.rooms.length > 0 },
    { id: 'dots', label: 'DOTs definidos em cada divisão', test: config.rooms.every(r => (r.dots?.length || 0) > 0) },
    { id: 'lighting', label: 'Iluminação configurada', test: config.rooms.every(r => !!r.lighting?.temp) },
    { id: 'temp2700', label: 'Temperatura de cor 2700K (padrão)', test: config.rooms.every(r => r.lighting?.temp === '2700K' || r.code === 'COZINHA' || r.code.includes('GINASIO')) },
    { id: 'scenes', label: 'Cenários definidos', test: config.scenes.length >= 3 },
    { id: 'masteroff', label: 'Cena Master OFF presente', test: config.scenes.some(s => s.name.toLowerCase().includes('master off')) },
    { id: 'integrations', label: 'Integrações configuradas', test: config.integrations.length > 0 },
    { id: 'name', label: 'Nome da configuração definido', test: !!config.name && config.name.length > 0 },
  ];

  const passed = checks.filter(c => c.test).length;
  const score = Math.round((passed / checks.length) * 100);

  let statusColor = 'text-red-600';
  let statusIcon = <XCircle size={16} />;
  let statusLabel = 'Revisar';

  if (score >= 90) {
    statusColor = 'text-green-700';
    statusIcon = <CheckCircle2 size={16} />;
    statusLabel = 'Aprovado';
  } else if (score >= 60) {
    statusColor = 'text-amber-700';
    statusIcon = <AlertTriangle size={16} />;
    statusLabel = 'Quase lá';
  }

  return (
    <div className="space-y-4">
      <Card className="border-line bg-white">
        <CardHeader className="pb-2">
          <CardTitle className="font-serif text-sm text-ink flex items-center gap-2">
            <CheckCircle2 size={16} strokeWidth={1.5} />
            Validação 300
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-3xl font-serif text-ink">{score}%</p>
              <p className="text-xs text-olive font-sans">{passed} de {checks.length} critérios</p>
            </div>
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border ${statusColor}`}>
              {statusIcon}
              <span className="text-xs font-sans font-medium">{statusLabel}</span>
            </div>
          </div>

          <div className="space-y-1.5">
            {checks.map(check => (
              <div key={check.id} className="flex items-center gap-2 text-sm font-sans">
                {check.test ? (
                  <CheckCircle2 size={14} className="text-green-600 shrink-0" />
                ) : (
                  <XCircle size={14} className="text-red-500 shrink-0" />
                )}
                <span className={check.test ? 'text-ink' : 'text-olive'}>{check.label}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="border-line bg-white">
        <CardHeader className="pb-2">
          <CardTitle className="font-serif text-sm text-ink flex items-center gap-2">
            <Lightbulb size={16} strokeWidth={1.5} />
            Sugestões da IA
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {config.rooms.some(r => !r.sensors || r.sensors.length === 0) && (
            <div className="flex items-start gap-2 text-sm font-sans text-olive">
              <AlertTriangle size={14} className="mt-0.5 shrink-0" />
              <span>Adicione sensores de presença (Basalte Auro) nas divisões principais para iluminação antecipatória.</span>
            </div>
          )}
          {!config.scenes.some(s => s.name.toLowerCase().includes('boa noite')) && (
            <div className="flex items-start gap-2 text-sm font-sans text-olive">
              <AlertTriangle size={14} className="mt-0.5 shrink-0" />
              <span>Considere adicionar uma cena "Boa Noite" com luzes a 5% e cortinas fechadas.</span>
            </div>
          )}
          {!config.scenes.some(s => s.name.toLowerCase().includes('bem-vindo')) && (
            <div className="flex items-start gap-2 text-sm font-sans text-olive">
              <AlertTriangle size={14} className="mt-0.5 shrink-0" />
              <span>Uma cena "Bem-Vindo" ativada na chegada melhora a experiência do utilizador.</span>
            </div>
          )}
          {config.rooms.some(r => r.lighting?.temp === '4000K') && (
            <div className="flex items-start gap-2 text-sm font-sans text-olive">
              <AlertTriangle size={14} className="mt-0.5 shrink-0" />
              <span>4000K é usado em espaços comerciais. Para residencial, prefira 2700K (3000K apenas em zonas de trabalho).</span>
            </div>
          )}
          {config.integrations.length === 0 && (
            <div className="flex items-start gap-2 text-sm font-sans text-olive">
              <AlertTriangle size={14} className="mt-0.5 shrink-0" />
              <span>Adicione pelo menos um servidor central (ex: Basalte Core Plus) e um sistema de supervisão.</span>
            </div>
          )}
          {checks.every(c => c.test) && (
            <div className="flex items-start gap-2 text-sm font-sans text-green-700">
              <CheckCircle2 size={14} className="mt-0.5 shrink-0" />
              <span>Configuração validada com sucesso. Todos os critérios 300 foram cumpridos.</span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
