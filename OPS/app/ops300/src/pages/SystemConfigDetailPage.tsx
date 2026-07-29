import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertTriangle, ArrowLeft, Save, Trash2, Download, Bot } from 'lucide-react';
import type { SystemConfiguration, Project } from '@/types';
import RoomEditor from '@/components/system-config/RoomEditor';
import SceneEditor from '@/components/system-config/SceneEditor';
import DeviceSelector from '@/components/system-config/DeviceSelector';
import IntegrationPanel from '@/components/system-config/IntegrationPanel';
import ConfigValidator from '@/components/system-config/ConfigValidator';
import { generateSuggestion } from '@/lib/deepseek';

const statusColors: Record<string, string> = {
  draft: 'bg-line/40 text-ink',
  review: 'bg-amber-100 text-amber-800',
  approved: 'bg-green-100 text-green-800',
  implemented: 'bg-ink text-ivory',
};

const statusLabels: Record<string, string> = {
  draft: 'Rascunho',
  review: 'Revisão',
  approved: 'Aprovado',
  implemented: 'Implementado',
};

export default function SystemConfigDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [config, setConfig] = useState<SystemConfiguration | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<string>('');

  useEffect(() => {
    async function fetchData() {
      if (!id) return;
      try {
        setIsLoading(true);
        setError('');
        const { data, error } = await supabase.from('system_configurations').select('*').eq('id', id).single();
        if (error) throw error;
        const cfg = data as unknown as SystemConfiguration;
        setConfig(cfg);
        if (cfg.project_id) {
          const { data: proj } = await supabase.from('projects').select('*').eq('id', cfg.project_id).single();
          setProject(proj);
        }
      } catch (err: any) {
        setError(err.message || 'Erro ao carregar configuração');
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [id]);

  useEffect(() => {
    if (config) {
      const types: Array<'room' | 'device' | 'scene' | 'integration'> = ['room', 'scene', 'device', 'integration'];
      setAiSuggestion(generateSuggestion(types[Math.floor(Math.random() * types.length)]));
    }
  }, [config?.id]);

  async function handleSave() {
    if (!config || !id) return;
    setSaving(true);
    try {
      const { error } = await supabase.from('system_configurations').update({
        name: config.name,
        status: config.status,
        rooms: config.rooms as unknown as object,
        devices: config.devices as unknown as object,
        scenes: config.scenes as unknown as object,
        integrations: config.integrations as unknown as object,
        notes: config.notes,
        updated_at: new Date().toISOString(),
      }).eq('id', id);
      if (error) throw error;
    } catch (err: any) {
      setError(err.message || 'Erro ao guardar');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!id || !confirm('Tem a certeza que deseja eliminar esta configuração?')) return;
    try {
      const { error } = await supabase.from('system_configurations').delete().eq('id', id);
      if (error) throw error;
      navigate('/configuracoes-sistema');
    } catch (err: any) {
      setError(err.message || 'Erro ao eliminar');
    }
  }

  function handleExportJSON() {
    if (!config) return;
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${config.name.replace(/\s+/g, '_')}_config.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function updateConfig(updates: Partial<SystemConfiguration>) {
    setConfig(prev => prev ? { ...prev, ...updates } : null);
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-9 w-32" />
        <Skeleton className="h-12 w-96" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (error || !config) {
    return (
      <div className="space-y-4">
        <Link to="/configuracoes-sistema">
          <Button variant="outline" size="sm" className="border-line"><ArrowLeft size={14} className="mr-1" /> Voltar</Button>
        </Link>
        {error ? (
          <div className="flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md p-4">
            <AlertTriangle size={16} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        ) : (
          <p className="text-olive font-sans">Configuração não encontrada.</p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Link to="/configuracoes-sistema">
            <Button variant="outline" size="sm" className="border-line text-ink hover:bg-ink hover:text-ivory">
              <ArrowLeft size={14} className="mr-1" /> Voltar
            </Button>
          </Link>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="border-line text-ink" onClick={handleExportJSON}>
            <Download size={14} className="mr-1" /> Exportar JSON
          </Button>
          <Button variant="outline" size="sm" className="border-red-200 text-red-700 hover:bg-red-50" onClick={handleDelete}>
            <Trash2 size={14} className="mr-1" /> Eliminar
          </Button>
          <Button size="sm" className="bg-ink text-ivory hover:bg-dark" onClick={handleSave} disabled={saving}>
            <Save size={14} className="mr-1" /> {saving ? 'A guardar...' : 'Guardar'}
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <h1 className="font-serif text-3xl text-ink">{config.name}</h1>
        <Badge variant="outline" className={`text-[10px] ${statusColors[config.status] || ''}`}>
          {statusLabels[config.status] || config.status}
        </Badge>
        {project && (
          <Link to={`/projetos/${project.id}`}>
            <Badge variant="outline" className="text-[10px] border-line text-olive hover:border-ink cursor-pointer">
              {project.name}
            </Badge>
          </Link>
        )}
      </div>

      {/* AI Suggestion */}
      {aiSuggestion && (
        <div className="flex items-start gap-2 text-sm bg-ink/5 border border-ink/10 rounded-md p-3">
          <Bot size={16} className="mt-0.5 shrink-0 text-olive" />
          <span className="text-ink font-sans">{aiSuggestion}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main content */}
        <div className="lg:col-span-3">
          <Tabs defaultValue="rooms" className="w-full">
            <TabsList className="bg-line/30">
              <TabsTrigger value="rooms" className="text-xs font-sans">Divisões</TabsTrigger>
              <TabsTrigger value="scenes" className="text-xs font-sans">Cenários</TabsTrigger>
              <TabsTrigger value="devices" className="text-xs font-sans">Equipamentos</TabsTrigger>
              <TabsTrigger value="integrations" className="text-xs font-sans">Integrações</TabsTrigger>
              <TabsTrigger value="notes" className="text-xs font-sans">Notas</TabsTrigger>
            </TabsList>

            <TabsContent value="rooms" className="mt-4">
              <RoomEditor
                rooms={config.rooms}
                onChange={rooms => updateConfig({ rooms })}
              />
            </TabsContent>

            <TabsContent value="scenes" className="mt-4">
              <SceneEditor
                scenes={config.scenes}
                onChange={scenes => updateConfig({ scenes })}
              />
            </TabsContent>

            <TabsContent value="devices" className="mt-4">
              <DeviceSelector
                devices={config.devices}
                onChange={devices => updateConfig({ devices })}
              />
            </TabsContent>

            <TabsContent value="integrations" className="mt-4">
              <IntegrationPanel
                integrations={config.integrations}
                onChange={integrations => updateConfig({ integrations })}
              />
            </TabsContent>

            <TabsContent value="notes" className="mt-4">
              <Card className="border-line bg-white">
                <CardContent className="p-4">
                  <textarea
                    value={config.notes || ''}
                    onChange={e => updateConfig({ notes: e.target.value })}
                    className="w-full min-h-[200px] p-3 text-sm border border-line rounded-md bg-white font-sans resize-y"
                    placeholder="Notas técnicas sobre esta configuração..."
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <ConfigValidator config={config} />

          <Card className="border-line bg-white">
            <CardHeader className="pb-2">
              <CardTitle className="font-serif text-sm text-ink">Estado</CardTitle>
            </CardHeader>
            <CardContent>
              <select
                value={config.status}
                onChange={e => updateConfig({ status: e.target.value as SystemConfiguration['status'] })}
                className="w-full h-9 px-2 text-sm border border-line rounded-md bg-white font-sans"
              >
                <option value="draft">Rascunho</option>
                <option value="review">Em Revisão</option>
                <option value="approved">Aprovado</option>
                <option value="implemented">Implementado</option>
              </select>
            </CardContent>
          </Card>

          <Card className="border-line bg-white">
            <CardHeader className="pb-2">
              <CardTitle className="font-serif text-sm text-ink">Resumo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm font-sans">
              <div className="flex justify-between"><span className="text-olive">Divisões</span><span className="text-ink">{config.rooms.length}</span></div>
              <div className="flex justify-between"><span className="text-olive">DOTs</span><span className="text-ink">{config.rooms.reduce((sum, r) => sum + (r.dots?.length || 0), 0)}</span></div>
              <div className="flex justify-between"><span className="text-olive">Cenários</span><span className="text-ink">{config.scenes.length}</span></div>
              <div className="flex justify-between"><span className="text-olive">Equipamentos</span><span className="text-ink">{config.devices.length}</span></div>
              <div className="flex justify-between"><span className="text-olive">Integrações</span><span className="text-ink">{config.integrations.length}</span></div>
            </CardContent>
          </Card>
        </div>
      </div>

    </div>
  );
}
