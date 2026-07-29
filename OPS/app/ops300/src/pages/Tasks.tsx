import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Search, HardHat, AlertTriangle, Calendar, ArrowRight, ArrowLeft, Truck, Clock,
} from 'lucide-react';
import { toastSuccess, toastError } from '@/lib/toast';
import type { Task, Project, ProcurementTask, Supplier } from '@/types';

const COLUMNS = [
  { id: 'todo', label: 'Por Fazer', color: 'bg-line/40' },
  { id: 'in_progress', label: 'Em Progresso', color: 'bg-olive/30' },
  { id: 'in_review', label: 'Em Revisão', color: 'bg-amber-100/50' },
  { id: 'done', label: 'Concluída', color: 'bg-green-100/50' },
] as const;

const priorityColors: Record<string, string> = {
  low: 'border-line text-olive',
  medium: 'border-olive text-ink',
  high: 'border-ink text-ink',
  critical: 'border-red-400 text-red-700 bg-red-50',
};

const priorityLabels: Record<string, string> = {
  low: 'Baixa',
  medium: 'Média',
  high: 'Alta',
  critical: 'Crítica',
};

export default function Tasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [procurementTasks, setProcurementTasks] = useState<ProcurementTask[]>([]);
  const [suppliers, setSuppliers] = useState<Record<string, Supplier>>({});
  const [search, setSearch] = useState('');
  const [procSearch, setProcSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [movingId, setMovingId] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<'team' | 'procurement' | 'both'>('team');

  useEffect(() => {
    async function fetchData() {
      try {
        setIsLoading(true);
        setError('');

        const [tasksRes, projectsRes, procRes, supRes] = await Promise.all([
          supabase.from('tasks').select('*').order('due_date', { ascending: true }),
          supabase.from('projects').select('*'),
          supabase.from('procurement_tasks').select('*, supplier:suppliers(*)').order('due_date', { ascending: true }),
          supabase.from('suppliers').select('*'),
        ]);

        if (tasksRes.error) throw tasksRes.error;
        if (projectsRes.error) throw projectsRes.error;
        if (procRes.error) throw procRes.error;

        setTasks(tasksRes.data || []);
        setProjects(projectsRes.data || []);
        setProcurementTasks(procRes.data || []);

        const supMap: Record<string, Supplier> = {};
        (supRes.data || []).forEach((s: Supplier) => { supMap[s.id] = s; });
        setSuppliers(supMap);
      } catch (err: any) {
        setError(err.message || 'Erro ao carregar tarefas');
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, []);

  async function moveTask(taskId: string, newStatus: string) {
    setMovingId(taskId);
    const { error } = await supabase
      .from('tasks')
      .update({ status: newStatus })
      .eq('id', taskId);

    if (!error) {
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
      toastSuccess('Tarefa movida', `Para: ${newStatus}`);
    } else {
      toastError('Erro ao mover tarefa', error.message);
    }
    setMovingId(null);
  }

  async function moveProcTask(taskId: string, newStatus: string) {
    setMovingId(taskId);
    const { error } = await supabase
      .from('procurement_tasks')
      .update({ status: newStatus })
      .eq('id', taskId);

    if (!error) {
      setProcurementTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
      toastSuccess('Tarefa de procurement movida', `Para: ${newStatus}`);
    } else {
      toastError('Erro ao mover tarefa', error.message);
    }
    setMovingId(null);
  }

  const filtered = tasks.filter(t => t.title.toLowerCase().includes(search.toLowerCase()));
  const filteredProc = procurementTasks.filter(t =>
    t.title.toLowerCase().includes(procSearch.toLowerCase()) ||
    (t.supplier_id && suppliers[t.supplier_id]?.name?.toLowerCase().includes(procSearch.toLowerCase()))
  );

  function getColumnTasks(status: string) {
    return filtered.filter(t => t.status === status);
  }

  function getProcColumnTasks(status: string) {
    return filteredProc.filter(t => t.status === status);
  }

  function getAdjacentColumn(currentStatus: string, direction: 'left' | 'right') {
    const idx = COLUMNS.findIndex(c => c.id === currentStatus);
    if (idx === -1) return null;
    const nextIdx = direction === 'left' ? idx - 1 : idx + 1;
    return COLUMNS[nextIdx]?.id || null;
  }

  const now = new Date();
  const threeDaysFromNow = new Date(now); threeDaysFromNow.setDate(now.getDate() + 3);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="flex gap-4">
          <Skeleton className="h-10 w-80" />
        </div>
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-96" />)}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <h1 className="font-serif text-3xl text-ink">Tarefas</h1>
        <div className="flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md p-4">
          <AlertTriangle size={16} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl text-ink">Tarefas</h1>
          <p className="text-olive text-sm mt-1 font-sans">Gestão de tarefas da equipa — Kanban</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-md border border-line overflow-hidden">
            {[
              { key: 'team', label: 'Equipa' },
              { key: 'procurement', label: 'Procurement' },
              { key: 'both', label: 'Ambas' },
            ].map(v => (
              <button
                key={v.key}
                onClick={() => setActiveView(v.key as typeof activeView)}
                className={`text-xs px-3 py-1.5 font-sans transition-colors ${
                  activeView === v.key ? 'bg-ink text-ivory' : 'bg-white text-olive hover:bg-line/20'
                }`}
              >
                {v.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Team Tasks */}
      {(activeView === 'team' || activeView === 'both') && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <HardHat size={16} className="text-ink" strokeWidth={1.5} />
            <h2 className="font-serif text-lg text-ink">Tarefas da Equipa</h2>
            <div className="relative w-full sm:w-64 ml-auto">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-olive" strokeWidth={1.5} />
              <Input
                placeholder="Pesquisar..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-8 h-8 text-xs bg-ivory border-line text-ink placeholder:text-olive/60"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {COLUMNS.map(column => {
              const columnTasks = getColumnTasks(column.id);
              return (
                <div key={column.id} className="flex flex-col gap-3">
                  <div className={`flex items-center justify-between px-3 py-2 rounded-md ${column.color}`}>
                    <div className="flex items-center gap-2">
                      <HardHat size={14} strokeWidth={1.5} className="text-ink" />
                      <span className="text-sm font-medium font-sans text-ink">{column.label}</span>
                    </div>
                    <span className="text-xs text-olive font-sans">{columnTasks.length}</span>
                  </div>

                  <div className="flex flex-col gap-2">
                    {columnTasks.map(task => {
                      const project = projects.find(p => p.id === task.project_id);
                      const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'done';
                      const prevCol = getAdjacentColumn(task.status || '', 'left');
                      const nextCol = getAdjacentColumn(task.status || '', 'right');

                      return (
                        <Card
                          key={task.id}
                          className={`border-line bg-white hover:shadow-sm transition-shadow ${isOverdue ? 'border-red-300' : ''}`}
                        >
                          <CardContent className="p-3 space-y-2">
                            <div className="flex items-start justify-between gap-2">
                              <p className="text-sm font-medium text-ink font-sans leading-tight">{task.title}</p>
                              {isOverdue && <AlertTriangle size={14} className="text-red-500 shrink-0 mt-0.5" />}
                            </div>

                            {task.description && (
                              <p className="text-xs text-olive font-sans line-clamp-2">{task.description}</p>
                            )}

                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge variant="outline" className={`text-[10px] ${priorityColors[task.priority || ''] || ''}`}>
                                {priorityLabels[task.priority || ''] || task.priority}
                              </Badge>
                              {project && (
                                <span className="text-[10px] text-olive font-sans">{project.name}</span>
                              )}
                            </div>

                            {task.due_date && (
                              <div className={`flex items-center gap-1 text-xs font-sans ${isOverdue ? 'text-red-600' : 'text-olive'}`}>
                                <Calendar size={12} />
                                <span>{new Date(task.due_date).toLocaleDateString('pt-PT')}</span>
                              </div>
                            )}

                            <div className="flex items-center justify-between pt-1 border-t border-line/30">
                              {prevCol ? (
                                <button
                                  onClick={() => moveTask(task.id, prevCol!)}
                                  disabled={movingId === task.id}
                                  className="flex items-center gap-1 text-[10px] text-olive hover:text-ink font-sans transition-colors"
                                >
                                  <ArrowLeft size={12} />
                                  {COLUMNS.find(c => c.id === prevCol)?.label}
                                </button>
                              ) : <span />}
                              {nextCol ? (
                                <button
                                  onClick={() => moveTask(task.id, nextCol!)}
                                  disabled={movingId === task.id}
                                  className="flex items-center gap-1 text-[10px] text-olive hover:text-ink font-sans transition-colors"
                                >
                                  {COLUMNS.find(c => c.id === nextCol)?.label}
                                  <ArrowRight size={12} />
                                </button>
                              ) : <span />}
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}

                    {columnTasks.length === 0 && (
                      <div className="text-center py-6 border border-dashed border-line rounded-md">
                        <p className="text-xs text-olive font-sans">Sem tarefas</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Procurement Tasks */}
      {(activeView === 'procurement' || activeView === 'both') && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Truck size={16} className="text-ink" strokeWidth={1.5} />
            <h2 className="font-serif text-lg text-ink">Tarefas de Procurement</h2>
            <div className="relative w-full sm:w-64 ml-auto">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-olive" strokeWidth={1.5} />
              <Input
                placeholder="Pesquisar..."
                value={procSearch}
                onChange={e => setProcSearch(e.target.value)}
                className="pl-8 h-8 text-xs bg-ivory border-line text-ink placeholder:text-olive/60"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {COLUMNS.map(column => {
              const columnTasks = getProcColumnTasks(column.id);
              return (
                <div key={`proc-${column.id}`} className="flex flex-col gap-3">
                  <div className={`flex items-center justify-between px-3 py-2 rounded-md ${column.color}`}>
                    <div className="flex items-center gap-2">
                      <Truck size={14} strokeWidth={1.5} className="text-ink" />
                      <span className="text-sm font-medium font-sans text-ink">{column.label}</span>
                    </div>
                    <span className="text-xs text-olive font-sans">{columnTasks.length}</span>
                  </div>

                  <div className="flex flex-col gap-2">
                    {columnTasks.map(task => {
                      const supplier = suppliers[task.supplier_id || ''];
                      const isOverdue = task.status !== 'done' && task.due_date && new Date(task.due_date) < now;
                      const isUrgent = task.status !== 'done' && task.due_date &&
                        new Date(task.due_date) >= now && new Date(task.due_date) <= threeDaysFromNow;
                      const prevCol = getAdjacentColumn(task.status || '', 'left');
                      const nextCol = getAdjacentColumn(task.status || '', 'right');

                      return (
                        <Card
                          key={task.id}
                          className={`border-line bg-white hover:shadow-sm transition-shadow ${
                            isOverdue ? 'border-red-300' : isUrgent ? 'border-amber-300' : ''
                          }`}
                        >
                          <CardContent className="p-3 space-y-2">
                            <div className="flex items-start justify-between gap-2">
                              <p className="text-sm font-medium text-ink font-sans leading-tight">{task.title}</p>
                              <div className="flex items-center gap-1">
                                {isUrgent && !isOverdue && <Clock size={14} className="text-amber-500 shrink-0" />}
                                {isOverdue && <AlertTriangle size={14} className="text-red-500 shrink-0" />}
                              </div>
                            </div>

                            {task.description && (
                              <p className="text-xs text-olive font-sans line-clamp-2">{task.description}</p>
                            )}

                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge variant="outline" className={`text-[10px] ${priorityColors[task.priority || ''] || ''}`}>
                                {priorityLabels[task.priority || ''] || task.priority}
                              </Badge>
                              {supplier && (
                                <span className="text-[10px] text-olive font-sans">{supplier.name}</span>
                              )}
                            </div>

                            {task.due_date && (
                              <div className={`flex items-center gap-1 text-xs font-sans ${
                                isOverdue ? 'text-red-600' : isUrgent ? 'text-amber-600' : 'text-olive'
                              }`}>
                                <Calendar size={12} />
                                <span>{new Date(task.due_date).toLocaleDateString('pt-PT')}</span>
                              </div>
                            )}

                            <div className="flex items-center justify-between pt-1 border-t border-line/30">
                              {prevCol ? (
                                <button
                                  onClick={() => moveProcTask(task.id, prevCol!)}
                                  disabled={movingId === task.id}
                                  className="flex items-center gap-1 text-[10px] text-olive hover:text-ink font-sans transition-colors"
                                >
                                  <ArrowLeft size={12} />
                                  {COLUMNS.find(c => c.id === prevCol)?.label}
                                </button>
                              ) : <span />}
                              {nextCol ? (
                                <button
                                  onClick={() => moveProcTask(task.id, nextCol!)}
                                  disabled={movingId === task.id}
                                  className="flex items-center gap-1 text-[10px] text-olive hover:text-ink font-sans transition-colors"
                                >
                                  {COLUMNS.find(c => c.id === nextCol)?.label}
                                  <ArrowRight size={12} />
                                </button>
                              ) : <span />}
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}

                    {columnTasks.length === 0 && (
                      <div className="text-center py-6 border border-dashed border-line rounded-md">
                        <p className="text-xs text-olive font-sans">Sem tarefas</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
