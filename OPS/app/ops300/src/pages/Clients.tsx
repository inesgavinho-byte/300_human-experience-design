import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, ArrowRight, Building2, Phone, Mail, MapPin, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router';
import type { Client, Project } from '@/types';

export default function Clients() {
  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchData() {
      try {
        setIsLoading(true);
        setError('');

        const [clientsRes, projectsRes] = await Promise.all([
          supabase.from('clients').select('*'),
          supabase.from('projects').select('*'),
        ]);

        if (clientsRes.error) throw clientsRes.error;
        if (projectsRes.error) throw projectsRes.error;

        setClients(clientsRes.data || []);
        setProjects(projectsRes.data || []);
      } catch (err: any) {
        setError(err.message || 'Erro ao carregar clientes');
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, []);

  const filtered = clients.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-10 w-80" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-36" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <h1 className="font-serif text-3xl text-ink">Clientes</h1>
        <div className="flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md p-4">
          <AlertTriangle size={16} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl text-ink">Clientes</h1>
        <p className="text-olive text-sm mt-1 font-sans">CRM 300 — Gestão de relacionamento</p>
      </div>

      <div className="relative w-full sm:w-80">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-olive" strokeWidth={1.5} />
        <Input
          placeholder="Pesquisar clientes..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9 bg-ivory border-line text-ink placeholder:text-olive/60"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map(c => {
          const clientProjects = projects.filter(p => p.client_id === c.id);
          return (
            <Card key={c.id} className="border-line bg-ivory hover:border-ink/40 transition-colors">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-serif text-lg text-ink">{c.name}</h3>
                    <p className="text-sm text-olive font-sans">{c.city || ''}</p>
                  </div>
                  <Link to={`/clientes/${c.id}`}>
                    <Button variant="outline" size="sm" className="border-line text-ink hover:bg-ink hover:text-ivory">
                      <ArrowRight size={14} />
                    </Button>
                  </Link>
                </div>
                <div className="mt-3 space-y-1 text-xs text-olive font-sans">
                  {c.email && <div className="flex items-center gap-1.5"><Mail size={12} strokeWidth={1.5} /> {c.email}</div>}
                  {c.phone && <div className="flex items-center gap-1.5"><Phone size={12} strokeWidth={1.5} /> {c.phone}</div>}
                  {c.address && <div className="flex items-center gap-1.5"><MapPin size={12} strokeWidth={1.5} /> {c.address}</div>}
                </div>
                <div className="mt-3 flex items-center gap-1.5 text-xs text-ink font-sans">
                  <Building2 size={12} strokeWidth={1.5} />
                  {clientProjects.length} projeto{clientProjects.length !== 1 ? 's' : ''}
                </div>
              </CardContent>
            </Card>
          );
        })}
        {filtered.length === 0 && (
          <p className="text-sm text-olive font-sans col-span-full">Nenhum cliente encontrado.</p>
        )}
      </div>
    </div>
  );
}
