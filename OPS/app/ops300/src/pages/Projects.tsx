import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, ArrowRight, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router';
import type { Project, Client } from '@/types';

const filters = ['Todos', 'Estudo', 'Projeto Executivo', 'Fornecimento', 'Instalação', 'Commissioning', 'Entregue'];

const statusColors: Record<string, string> = {
  'Estudo': 'bg-olive/20 text-ink',
  'Projeto Executivo': 'bg-line/40 text-ink',
  'Fornecimento': 'bg-olive/30 text-ink',
  'Instalação': 'bg-ink text-ivory',
  'Commissioning': 'bg-olive/40 text-ink',
  'Entregue': 'bg-dark text-ivory',
};

export default function Projects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('Todos');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchData() {
      try {
        setIsLoading(true);
        setError('');

        const [projectsRes, clientsRes] = await Promise.all([
          supabase.from('projects').select('*'),
          supabase.from('clients').select('*'),
        ]);

        if (projectsRes.error) throw projectsRes.error;
        if (clientsRes.error) throw clientsRes.error;

        setProjects(projectsRes.data || []);
        setClients(clientsRes.data || []);
      } catch (err: any) {
        setError(err.message || 'Erro ao carregar projetos');
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, []);

  const filtered = projects.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'Todos' || p.status === filter;
    return matchesSearch && matchesFilter;
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="flex gap-4">
          <Skeleton className="h-10 w-80" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <h1 className="font-serif text-3xl text-ink">Projetos</h1>
        <div className="flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md p-4">
          <AlertTriangle size={16} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="font-serif text-3xl text-ink">Projetos</h1>
          <p className="text-olive text-sm mt-1 font-sans">Gestão de projetos 300</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-olive" strokeWidth={1.5} />
          <Input
            placeholder="Pesquisar projetos..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 bg-ivory border-line text-ink placeholder:text-olive/60"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {filters.map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1 text-xs rounded-full border transition-colors font-sans ${
                filter === f
                  ? 'bg-ink text-ivory border-ink'
                  : 'bg-transparent text-olive border-line hover:border-ink'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filtered.map(p => {
          const client = clients.find(c => c.id === p.client_id);
          return (
            <Card key={p.id} className="border-line bg-ivory hover:border-ink/40 transition-colors">
              <CardContent className="p-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-serif text-lg text-ink">{p.name}</h3>
                      <Badge variant="outline" className={`text-[10px] ${statusColors[p.status || ''] || ''}`}>
                        {p.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-olive mt-1 font-sans">{client?.name || '—'} · {(p.value || 0).toLocaleString('pt-PT')}€ · {p.phase || '—'}</p>
                    <div className="mt-3 max-w-md">
                      <Progress value={50} className="h-1.5 bg-line" />
                      <p className="text-[10px] text-olive mt-1 font-sans">{p.phase || '—'} · Início: {p.start_date || '—'}{p.end_date ? ` · Fim previsto: ${p.end_date}` : ''}</p>
                    </div>
                  </div>
                  <Link to={`/projetos/${p.id}`}>
                    <Button variant="outline" size="sm" className="border-line text-ink hover:bg-ink hover:text-ivory font-sans">
                      Ver detalhe <ArrowRight size={14} className="ml-1" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          );
        })}
        {filtered.length === 0 && (
          <p className="text-sm text-olive font-sans">Nenhum projeto encontrado.</p>
        )}
      </div>
    </div>
  );
}
