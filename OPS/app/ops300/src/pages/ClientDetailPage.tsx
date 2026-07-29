import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Building2, Phone, Mail, MapPin, FileText, AlertTriangle } from 'lucide-react';
import type { Client, Project } from '@/types';

export default function ClientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [client, setClient] = useState<Client | null>(null);
  const [clientProjects, setClientProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchData() {
      if (!id) return;
      try {
        setIsLoading(true);
        setError('');

        const { data: clientData, error: clientError } = await supabase
          .from('clients')
          .select('*')
          .eq('id', id)
          .single();

        if (clientError) throw clientError;
        setClient(clientData);

        const { data: projectsData, error: projectsError } = await supabase
          .from('projects')
          .select('*')
          .eq('client_id', id);

        if (projectsError) throw projectsError;
        setClientProjects(projectsData || []);
      } catch (err: any) {
        setError(err.message || 'Erro ao carregar cliente');
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [id]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-9 w-32" />
        <Skeleton className="h-12 w-64" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-48" />
          <Skeleton className="h-48 lg:col-span-2" />
        </div>
      </div>
    );
  }

  if (error || !client) {
    return (
      <div className="space-y-4">
        <Link to="/clientes"><Button variant="outline" size="sm" className="border-line"><ArrowLeft size={14} className="mr-1" /> Voltar</Button></Link>
        {error ? (
          <div className="flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md p-4">
            <AlertTriangle size={16} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        ) : (
          <p className="text-olive font-sans">Cliente não encontrado.</p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link to="/clientes">
        <Button variant="outline" size="sm" className="border-line text-ink hover:bg-ink hover:text-ivory">
          <ArrowLeft size={14} className="mr-1" /> Voltar
        </Button>
      </Link>

      <div>
        <h1 className="font-serif text-3xl text-ink">{client.name}</h1>
        <p className="text-olive text-sm mt-1 font-sans">{client.city || ''}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="border-line bg-ivory">
          <CardHeader>
            <CardTitle className="font-serif text-lg text-ink">Contacto</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm font-sans">
            {client.email && <div className="flex items-center gap-2 text-olive"><Mail size={14} strokeWidth={1.5} /> {client.email}</div>}
            {client.phone && <div className="flex items-center gap-2 text-olive"><Phone size={14} strokeWidth={1.5} /> {client.phone}</div>}
            {client.address && <div className="flex items-center gap-2 text-olive"><MapPin size={14} strokeWidth={1.5} /> {client.address}</div>}
          </CardContent>
        </Card>

        <Card className="border-line bg-ivory lg:col-span-2">
          <CardHeader>
            <CardTitle className="font-serif text-lg text-ink">Notas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-ink leading-relaxed font-sans">{client.notes || 'Sem notas registadas.'}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-line bg-ivory">
        <CardHeader>
          <CardTitle className="font-serif text-lg text-ink flex items-center gap-2">
            <Building2 size={16} strokeWidth={1.5} /> Projetos Associados
          </CardTitle>
        </CardHeader>
        <CardContent>
          {clientProjects.length === 0 ? (
            <p className="text-sm text-olive font-sans">Sem projetos associados.</p>
          ) : (
            <div className="space-y-2">
              {clientProjects.map(p => (
                <div key={p.id} className="flex items-center justify-between py-2 border-b border-line/50 last:border-0">
                  <div>
                    <p className="text-sm text-ink font-sans">{p.name}</p>
                    <p className="text-xs text-olive font-sans">{p.status || '—'} · {(p.value || 0).toLocaleString('pt-PT')}€</p>
                  </div>
                  <Link to={`/projetos/${p.id}`}>
                    <Button variant="outline" size="sm" className="border-line text-ink hover:bg-ink hover:text-ivory">
                      <FileText size={14} />
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
