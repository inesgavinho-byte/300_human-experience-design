import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ArrowLeft, Calendar, Users, FileText, AlertTriangle, Settings2, Plus,
  Bot, Building2, DoorOpen, Lightbulb, Music, Thermometer,
  Shield, Wifi, Layers,
} from 'lucide-react';
import type { Project, Client, Task, ProjectPhase, SystemConfiguration } from '@/types';
import SystemConfigWizard from '@/components/system-config/SystemConfigWizard';

const statusColors: Record<string, string> = {
  'Estudo': 'bg-olive/20 text-ink',
  'Projeto Executivo': 'bg-line/40 text-ink',
  'Fornecimento': 'bg-olive/30 text-ink',
  'Instalação': 'bg-ink text-ivory',
  'Commissioning': 'bg-olive/40 text-ink',
  'Entregue': 'bg-dark text-ivory',
};

const sysStatusColors: Record<string, string> = {
  draft: 'bg-line/40 text-ink',
  review: 'bg-amber-100 text-amber-800',
  approved: 'bg-green-100 text-green-800',
  implemented: 'bg-ink text-ivory',
};

const sysStatusLabels: Record<string, string> = {
  draft: 'Rascunho',
  review: 'Revisão',
  approved: 'Aprovado',
  implemented: 'Implementado',
};

/* ─── Room icon by system type ─── */
function RoomIcon({ systems }: { systems: string[] }) {
  if (systems.includes('audio')) return <Music size={14} strokeWidth={1.5} className="text-olive" />;
  if (systems.includes('lighting')) return <Lightbulb size={14} strokeWidth={1.5} className="text-olive" />;
  if (systems.includes('climate')) return <Thermometer size={14} strokeWidth={1.5} className="text-olive" />;
  if (systems.includes('security')) return <Shield size={14} strokeWidth={1.5} className="text-olive" />;
  if (systems.includes('network')) return <Wifi size={14} strokeWidth={1.5} className="text-olive" />;
  return <DoorOpen size={14} strokeWidth={1.5} className="text-olive" />;
}

/* ═════════════════════════════════════════════
   PROJECT DETAIL — Object-oriented explorer
   ═════════════════════════════════════════════ */
export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [projectTasks, setProjectTasks] = useState<Task[]>([]);
  const [phases, setPhases] = useState<ProjectPhase[]>([]);
  const [sysConfigs, setSysConfigs] = useState<SystemConfiguration[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showWizard, setShowWizard] = useState(false);

  // Explorer state: selected system config + room
  const [selectedConfigId, setSelectedConfigId] = useState<string | null>(null);
  const [selectedRoomCode, setSelectedRoomCode] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      if (!id) return;
      try {
        setIsLoading(true);
        setError('');

        const { data: projectData, error: projectError } = await supabase
          .from('projects')
          .select('*')
          .eq('id', id)
          .single();

        if (projectError) throw projectError;
        setProject(projectData);

        const [clientRes, tasksRes, phasesRes, sysRes] = await Promise.all([
          projectData.client_id
            ? supabase.from('clients').select('*').eq('id', projectData.client_id).single()
            : Promise.resolve({ data: null, error: null }),
          supabase.from('tasks').select('*').eq('project_id', id),
          supabase.from('project_phases').select('*').eq('project_id', id).order('order_index', { ascending: true }),
          supabase.from('system_configurations').select('*').eq('project_id', id).order('updated_at', { ascending: false }),
        ]);

        setClient(clientRes.data);
        setProjectTasks(tasksRes.data || []);
        setPhases(phasesRes.data || []);
        const configs = (sysRes.data || []) as unknown as SystemConfiguration[];
        setSysConfigs(configs);

        // Auto-select first config and room
        if (configs.length > 0) {
          setSelectedConfigId(configs[0].id);
          const rooms = (configs[0].rooms as unknown[]) || [];
          if (rooms.length > 0) {
            setSelectedRoomCode((rooms[0] as any).code || null);
          }
        }
      } catch (err: any) {
        setError(err.message || 'Erro ao carregar projeto');
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [id]);

  async function handleWizardComplete(configData: Partial<SystemConfiguration>) {
    if (!id) return;
    try {
      const { error } = await supabase.from('system_configurations').insert({
        ...configData,
        project_id: id,
      });
      if (error) throw error;
      setShowWizard(false);
      const { data } = await supabase.from('system_configurations').select('*').eq('project_id', id).order('updated_at', { ascending: false });
      const configs = (data || []) as unknown as SystemConfiguration[];
      setSysConfigs(configs);
      if (configs.length > 0 && !selectedConfigId) {
        setSelectedConfigId(configs[0].id);
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao criar configuração');
    }
  }

  const selectedConfig = sysConfigs.find(c => c.id === selectedConfigId);
  const selectedRoom = selectedConfig
    ? (selectedConfig.rooms as unknown[]).find((r: any) => r.code === selectedRoomCode) as any
    : null;

  // Devices in selected room
  const roomDevices = selectedConfig
    ? (selectedConfig.devices as unknown[]).filter((d: any) => d.room_code === selectedRoomCode)
    : [];

  // Scenes for selected room
  const roomScenes = selectedConfig
    ? (selectedConfig.scenes as unknown[]).filter((s: any) => s.room_code === selectedRoomCode || !s.room_code)
    : [];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-9 w-32" />
        <Skeleton className="h-12 w-96" />
        <div className="flex gap-4">
          <Skeleton className="h-[500px] w-64" />
          <Skeleton className="h-[500px] flex-1" />
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="space-y-4">
        <Link to="/projetos"><Button variant="outline" size="sm" className="border-line"><ArrowLeft size={14} className="mr-1" /> Voltar</Button></Link>
        {error ? (
          <div className="flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md p-4">
            <AlertTriangle size={16} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        ) : (
          <p className="text-olive font-sans">Projeto não encontrado.</p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link to="/projetos">
          <Button variant="outline" size="sm" className="border-line text-ink hover:bg-ink hover:text-ivory">
            <ArrowLeft size={14} className="mr-1" /> Voltar
          </Button>
        </Link>
      </div>

      <div>
        <div className="flex items-center gap-3">
          <h1 className="font-serif text-3xl text-ink">{project.name}</h1>
          <Badge variant="outline" className={`text-[10px] ${statusColors[project.status || ''] || ''}`}>
            {project.status}
          </Badge>
        </div>
        <p className="text-olive text-sm mt-1 font-sans">{client?.name || '—'} · {(project.value || 0).toLocaleString('pt-PT')}€ · {project.typology || '—'} · {project.area_m2 ? `${project.area_m2}m²` : '—'}</p>
      </div>

      {/* ════════════════════════════════════════
          MAIN LAYOUT: Explorer Tree + Detail Panel
          ════════════════════════════════════════ */}
      {sysConfigs.length === 0 ? (
        /* No configs yet — show overview + prompt to create */
        <NoConfigView
          project={project}
          client={client}
          phases={phases}
          projectTasks={projectTasks}
          onCreateConfig={() => setShowWizard(true)}
        />
      ) : (
        <div className="flex gap-4 h-[calc(100vh-220px)] min-h-[500px]">
          {/* ─── Left: Explorer Tree ─── */}
          <aside className="w-64 shrink-0 bg-ivory border border-line rounded-lg overflow-hidden flex flex-col">
            <div className="px-4 py-3 border-b border-line">
              <p className="text-[10px] uppercase tracking-wider text-olive font-sans">Edifício</p>
              <p className="text-sm font-medium text-ink font-sans">{project.name}</p>
            </div>

            <div className="flex-1 overflow-y-auto py-2">
              {sysConfigs.map(cfg => {
                const rooms = (cfg.rooms as unknown[]) || [];
                const isSelected = cfg.id === selectedConfigId;
                return (
                  <div key={cfg.id}>
                    {/* System config header */}
                    <button
                      onClick={() => { setSelectedConfigId(cfg.id); setSelectedRoomCode(null); }}
                      className={`w-full text-left px-4 py-2 flex items-center gap-2 text-sm transition-colors ${
                        isSelected && !selectedRoomCode ? 'bg-ink text-ivory' : 'text-ink hover:bg-line/30'
                      }`}
                    >
                      <Building2 size={14} strokeWidth={1.5} />
                      <span className="font-sans truncate">{cfg.name}</span>
                      <Badge variant="outline" className={`ml-auto text-[9px] shrink-0 ${isSelected ? 'border-ivory/30 text-ivory' : 'border-line text-olive'}`}>
                        {sysStatusLabels[cfg.status] || cfg.status}
                      </Badge>
                    </button>

                    {/* Rooms */}
                    {rooms.map((room: any) => {
                      const isRoomSelected = isSelected && room.code === selectedRoomCode;
                      const roomSystems: string[] = [];
                      if (room.lighting) roomSystems.push('lighting');
                      if (room.audio) roomSystems.push('audio');
                      if (room.climate) roomSystems.push('climate');
                      if (room.sensors?.length) roomSystems.push('security');

                      return (
                        <button
                          key={room.code}
                          onClick={() => { setSelectedConfigId(cfg.id); setSelectedRoomCode(room.code); }}
                          className={`w-full text-left pl-10 pr-4 py-1.5 flex items-center gap-2 text-sm transition-colors ${
                            isRoomSelected ? 'bg-ink/10 text-ink font-medium' : 'text-olive hover:bg-line/20'
                          }`}
                        >
                          <RoomIcon systems={roomSystems} />
                          <span className="font-sans truncate">{room.name}</span>
                          {room.dots && (
                            <span className="ml-auto text-[10px] text-olive/60 font-sans">
                              {room.dots.length}x DOT
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </div>

            {/* Add config button */}
            <div className="p-3 border-t border-line">
              <Button
                variant="outline"
                size="sm"
                className="w-full border-line text-ink font-sans text-xs"
                onClick={() => setShowWizard(true)}
              >
                <Plus size={12} className="mr-1" />
                Novo Sistema
              </Button>
            </div>
          </aside>

          {/* ─── Right: Detail Panel ─── */}
          <main className="flex-1 bg-ivory border border-line rounded-lg overflow-hidden flex flex-col">
            {selectedRoom ? (
              <>
                {/* Room header */}
                <div className="px-5 py-4 border-b border-line">
                  <div className="flex items-center gap-2">
                    <DoorOpen size={18} strokeWidth={1.5} className="text-ink" />
                    <h2 className="font-serif text-xl text-ink">{selectedRoom.name}</h2>
                  </div>
                  <p className="text-xs text-olive font-sans mt-0.5">{selectedConfig?.name} · {selectedRoom.code}</p>
                </div>

                {/* Room tabs */}
                <div className="flex-1 overflow-auto">
                  <Tabs defaultValue="overview" className="w-full">
                    <TabsList className="bg-line/30 mx-5 mt-4">
                      <TabsTrigger value="overview" className="text-xs font-sans">Overview</TabsTrigger>
                      <TabsTrigger value="devices" className="text-xs font-sans">Equipamentos</TabsTrigger>
                      <TabsTrigger value="scenes" className="text-xs font-sans">Experiências</TabsTrigger>
                      <TabsTrigger value="lighting" className="text-xs font-sans">Iluminação</TabsTrigger>
                      <TabsTrigger value="network" className="text-xs font-sans">Rede</TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview" className="px-5 py-4 space-y-4">
                      <RoomOverview room={selectedRoom} devices={roomDevices} scenes={roomScenes} />
                    </TabsContent>

                    <TabsContent value="devices" className="px-5 py-4">
                      {roomDevices.length === 0 ? (
                        <p className="text-sm text-olive font-sans">Sem equipamentos nesta divisão.</p>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                          {roomDevices.map((device: any, i) => (
                            <DeviceCard key={i} device={device} />
                          ))}
                        </div>
                      )}
                    </TabsContent>

                    <TabsContent value="scenes" className="px-5 py-4">
                      {roomScenes.length === 0 ? (
                        <p className="text-sm text-olive font-sans">Sem cenários configurados.</p>
                      ) : (
                        <div className="space-y-3">
                          {roomScenes.map((scene: any, i) => (
                            <SceneCard key={i} scene={scene} />
                          ))}
                        </div>
                      )}
                    </TabsContent>

                    <TabsContent value="lighting" className="px-5 py-4">
                      <LightingPanel room={selectedRoom} />
                    </TabsContent>

                    <TabsContent value="network" className="px-5 py-4">
                      <NetworkPanel />
                    </TabsContent>
                  </Tabs>
                </div>
              </>
            ) : selectedConfig ? (
              /* System config selected (no room) */
              <div className="p-8 text-center">
                <Building2 size={32} className="mx-auto text-olive/40 mb-3" strokeWidth={1.5} />
                <h3 className="font-serif text-lg text-ink">{selectedConfig.name}</h3>
                <p className="text-sm text-olive font-sans mt-1">
                  {selectedConfig.template_type === 'basalte_knx' ? 'Basalte KNX' : selectedConfig.template_type} · {(selectedConfig.rooms as unknown[])?.length || 0} divisões
                </p>
                <div className="mt-4 flex justify-center gap-2">
                  <Badge variant="outline" className={`text-[10px] ${sysStatusColors[selectedConfig.status] || ''}`}>
                    {sysStatusLabels[selectedConfig.status] || selectedConfig.status}
                  </Badge>
                </div>
                <p className="text-xs text-olive font-sans mt-4">
                  Selecione uma divisão na árvore à esquerda para ver detalhes.
                </p>
              </div>
            ) : (
              <div className="p-8 text-center">
                <Layers size={32} className="mx-auto text-olive/40 mb-3" strokeWidth={1.5} />
                <p className="text-sm text-olive font-sans">Selecione um sistema ou divisão na árvore.</p>
              </div>
            )}
          </main>
        </div>
      )}

      {showWizard && project && (
        <SystemConfigWizard
          project={project}
          onComplete={handleWizardComplete}
          onCancel={() => setShowWizard(false)}
        />
      )}
    </div>
  );
}

/* ═════════════════════════════════════════════
   SUB-COMPONENTS
   ═════════════════════════════════════════════ */

function NoConfigView({ project, client, phases, projectTasks, onCreateConfig }: {
  project: Project; client: Client | null; phases: ProjectPhase[];
  projectTasks: Task[]; onCreateConfig: () => void;
}) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="border-line bg-ivory lg:col-span-2">
          <CardHeader>
            <CardTitle className="font-serif text-lg text-ink">Descrição</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-ink leading-relaxed font-sans">{project.description || 'Sem descrição.'}</p>
            {phases.length > 0 && (
              <div className="mt-6 space-y-3">
                <h4 className="font-serif text-sm text-ink">Fases do Projeto</h4>
                {phases.map(phase => (
                  <div key={phase.id} className="flex items-center justify-between py-2 border-b border-line/50 last:border-0">
                    <span className="text-sm text-ink font-sans">{phase.name}</span>
                    <Badge variant="outline" className="text-[10px] border-line text-olive">{phase.status || '—'}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="border-line bg-ivory">
            <CardHeader className="pb-2">
              <CardTitle className="font-serif text-sm text-ink flex items-center gap-2">
                <Calendar size={14} strokeWidth={1.5} /> Cronograma
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm font-sans">
              <div className="flex justify-between"><span className="text-olive">Início</span><span className="text-ink">{project.start_date || '—'}</span></div>
              {project.end_date && <div className="flex justify-between"><span className="text-olive">Fim previsto</span><span className="text-ink">{project.end_date}</span></div>}
              <div className="flex justify-between"><span className="text-olive">Fase atual</span><span className="text-ink">{project.phase || '—'}</span></div>
            </CardContent>
          </Card>

          <Card className="border-line bg-ivory">
            <CardHeader className="pb-2">
              <CardTitle className="font-serif text-sm text-ink flex items-center gap-2">
                <Users size={14} strokeWidth={1.5} /> Cliente
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm font-sans">
              <div className="text-ink font-medium">{client?.name || '—'}</div>
              {client?.email && <div className="text-olive">{client.email}</div>}
              {client?.phone && <div className="text-olive">{client.phone}</div>}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Prompt to create system config */}
      <Card className="border-line bg-ivory">
        <CardContent className="p-8 text-center">
          <Settings2 size={32} className="text-olive mx-auto mb-3" strokeWidth={1.5} />
          <h3 className="font-serif text-lg text-ink">Sem configuração de sistema</h3>
          <p className="text-sm text-olive font-sans mt-1 max-w-md mx-auto">
            Este projeto ainda não tem um edifício configurado. Crie uma configuração para começar a adicionar divisões, equipamentos e cenários.
          </p>
          <Button className="mt-4 bg-ink text-ivory hover:bg-dark" onClick={onCreateConfig}>
            <Plus size={14} className="mr-1" /> Criar Configuração de Sistema
          </Button>
        </CardContent>
      </Card>

      {projectTasks.length > 0 && (
        <Card className="border-line bg-ivory">
          <CardHeader>
            <CardTitle className="font-serif text-lg text-ink flex items-center gap-2">
              <FileText size={16} strokeWidth={1.5} /> Tarefas do Projeto
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {projectTasks.map(t => (
                <div key={t.id} className="flex items-center justify-between py-2 border-b border-line/50 last:border-0">
                  <div>
                    <p className="text-sm text-ink font-sans">{t.title}</p>
                    <p className="text-xs text-olive font-sans">{t.status || '—'} · Prazo: {t.due_date || '—'}</p>
                  </div>
                  <Badge variant="outline" className="text-[10px] border-line text-olive">{t.priority || '—'}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

/* ─── Room Overview ─── */
function RoomOverview({ room, devices, scenes }: { room: any; devices: any[]; scenes: any[] }) {
  return (
    <div className="space-y-4">
      {/* Quick stats */}
      <div className="grid grid-cols-4 gap-3">
        <StatBox icon={Lightbulb} label="Iluminação" value={room.lighting ? 'Configurada' : '—'} />
        <StatBox icon={Music} label="Áudio" value={room.audio || '—'} />
        <StatBox icon={Thermometer} label="Clima" value={room.climate || '—'} />
        <StatBox icon={Settings2} label="Equipamentos" value={devices.length.toString()} />
      </div>

      {/* Dots */}
      {room.dots && room.dots.length > 0 && (
        <Card className="border-line bg-ivory">
          <CardHeader className="pb-2">
            <CardTitle className="font-serif text-sm text-ink">Painéis de Controlo (DOT)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {room.dots.map((dot: any, i: number) => (
              <div key={i} className="flex items-center gap-3 py-2 border-b border-line/50 last:border-0">
                <Badge variant="outline" className="text-[10px] border-line text-olive shrink-0">{dot.type}</Badge>
                <span className="text-sm text-ink font-sans">{dot.position || 'Posição não definida'}</span>
                <div className="ml-auto flex gap-1">
                  {dot.buttons?.map((btn: string, bi: number) => (
                    <span key={bi} className="text-[10px] px-1.5 py-0.5 bg-line/30 rounded text-olive font-sans">{btn}</span>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Sensors */}
      {room.sensors && room.sensors.length > 0 && (
        <Card className="border-line bg-ivory">
          <CardHeader className="pb-2">
            <CardTitle className="font-serif text-sm text-ink">Sensores</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {room.sensors.map((sensor: string, i: number) => (
                <Badge key={i} variant="outline" className="text-[10px] border-line text-olive">{sensor}</Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Notes */}
      {room.notes && (
        <div className="bg-ink/5 border border-ink/10 rounded-md p-3">
          <p className="text-sm text-ink font-sans">{room.notes}</p>
        </div>
      )}

      {/* Quick AI suggestion */}
      <div className="flex items-start gap-2 text-sm bg-amber-50/50 border border-amber-200 rounded-md p-3">
        <Bot size={16} className="mt-0.5 shrink-0 text-amber-600" />
        <span className="text-ink font-sans">
          {scenes.length === 0
            ? `Recomenda-se adicionar uma cena "Master OFF" à ${room.name}.`
            : scenes.length < 3
              ? `Sugere-se adicionar mais ${3 - scenes.length} cenário(s) à ${room.name} (Cinema, Jantar, Boa Noite).`
              : `A ${room.name} tem ${scenes.length} cenários configurados. Verifique se há validação 300.`}
        </span>
      </div>
    </div>
  );
}

function StatBox({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="bg-ivory border border-line rounded-md p-3 text-center">
      <Icon size={16} className="mx-auto text-olive mb-1" strokeWidth={1.5} />
      <p className="text-xs text-olive font-sans">{label}</p>
      <p className="text-sm font-medium text-ink font-sans">{value}</p>
    </div>
  );
}

/* ─── Device Card ─── */
function DeviceCard({ device }: { device: any }) {
  return (
    <Card className="border-line bg-ivory hover:border-ink/50 transition-colors">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-ink font-sans">{device.name}</p>
            <p className="text-[11px] text-olive font-sans mt-0.5">
              {device.brand || '—'} · {device.reference || '—'}
            </p>
          </div>
          {device.category && (
            <Badge variant="outline" className="text-[9px] border-line text-olive shrink-0">
              {device.category}
            </Badge>
          )}
        </div>
        {device.notes && (
          <p className="text-[11px] text-olive font-sans mt-2">{device.notes}</p>
        )}
        {device.quantity && device.quantity > 1 && (
          <p className="text-[11px] text-olive font-sans mt-1">Qtd: {device.quantity}</p>
        )}
      </CardContent>
    </Card>
  );
}

/* ─── Scene Card ─── */
function SceneCard({ scene }: { scene: any }) {
  return (
    <Card className="border-line bg-ivory">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lightbulb size={14} className="text-olive" strokeWidth={1.5} />
            <p className="text-sm font-medium text-ink font-sans">{scene.name}</p>
          </div>
          {scene.trigger && (
            <Badge variant="outline" className="text-[9px] border-line text-olive">
              {scene.trigger}
            </Badge>
          )}
        </div>
        {scene.actions && scene.actions.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {scene.actions.map((action: string, i: number) => (
              <span key={i} className="text-[10px] px-2 py-0.5 bg-line/30 rounded-full text-olive font-sans">{action}</span>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ─── Lighting Panel ─── */
function LightingPanel({ room }: { room: any }) {
  if (!room.lighting) {
    return (
      <div className="text-center py-8">
        <Lightbulb size={24} className="mx-auto text-olive/40 mb-2" strokeWidth={1.5} />
        <p className="text-sm text-olive font-sans">Iluminação não configurada para esta divisão.</p>
      </div>
    );
  }

  const l = room.lighting;
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <StatBox icon={Lightbulb} label="Tipo" value={l.type || '—'} />
        <StatBox icon={Thermometer} label="Temperatura" value={l.temp || '—'} />
        <StatBox icon={Settings2} label="CRI" value={l.cri || '—'} />
      </div>
      {l.scenes && l.scenes.length > 0 && (
        <Card className="border-line bg-ivory">
          <CardHeader className="pb-2">
            <CardTitle className="font-serif text-sm text-ink">Cenas de Iluminação</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {l.scenes.map((scene: string, i: number) => (
                <Badge key={i} variant="outline" className="text-[10px] border-line text-olive">{scene}</Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
      {l.notes && (
        <p className="text-sm text-ink font-sans">{l.notes}</p>
      )}
    </div>
  );
}

/* ─── Network Panel ─── */
function NetworkPanel() {
  return (
    <div className="text-center py-8">
      <Wifi size={24} className="mx-auto text-olive/40 mb-2" strokeWidth={1.5} />
      <p className="text-sm text-olive font-sans">Configuração de rede por divisão será implementada em breve.</p>
    </div>
  );
}
