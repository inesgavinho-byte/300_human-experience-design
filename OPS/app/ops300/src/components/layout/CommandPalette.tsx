import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router';
import { supabase } from '@/lib/supabase';
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from '@/components/ui/command';
import {
  FolderOpen, Users, FileText, HardHat, UsersRound,
  ArrowRight, Search,
} from 'lucide-react';

type SearchResult =
  | { type: 'project'; id: string; name: string; clientName?: string }
  | { type: 'client'; id: string; name: string; city?: string }
  | { type: 'proposal'; id: string; title: string; reference?: string; clientName?: string }
  | { type: 'task'; id: string; title: string; projectName?: string; status?: string }
  | { type: 'supplier'; id: string; name: string; category?: string };

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const hasFetched = useRef(false);

  // Keyboard shortcut: Cmd+K / Ctrl+K
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(o => !o);
      }
      if (e.key === 'Escape') {
        setOpen(false);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  // Fetch all data when palette opens
  const fetchData = useCallback(async () => {
    if (hasFetched.current) return;
    hasFetched.current = true;
    setIsLoading(true);
    try {
      const [projectsRes, clientsRes, proposalsRes, tasksRes, suppliersRes] = await Promise.all([
        supabase.from('projects').select('id, name, client_id, clients(name)'),
        supabase.from('clients').select('id, name, city'),
        supabase.from('proposals').select('id, title, reference, client_id, clients(name)'),
        supabase.from('tasks').select('id, title, project_id, status, projects(name)'),
        supabase.from('suppliers').select('id, name, category'),
      ]);

      const all: SearchResult[] = [];

      (projectsRes.data || []).forEach((p: any) =>
        all.push({ type: 'project', id: p.id, name: p.name, clientName: p.clients?.name })
      );
      (clientsRes.data || []).forEach((c: any) =>
        all.push({ type: 'client', id: c.id, name: c.name, city: c.city })
      );
      (proposalsRes.data || []).forEach((p: any) =>
        all.push({ type: 'proposal', id: p.id, title: p.title, reference: p.reference, clientName: p.clients?.name })
      );
      (tasksRes.data || []).forEach((t: any) =>
        all.push({ type: 'task', id: t.id, title: t.title, projectName: t.projects?.name, status: t.status })
      );
      (suppliersRes.data || []).forEach((s: any) =>
        all.push({ type: 'supplier', id: s.id, name: s.name, category: s.category })
      );

      setResults(all);
    } catch (err) {
      console.error('CommandPalette fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      fetchData();
    } else {
      setQuery('');
    }
  }, [open, fetchData]);

  const filtered = query.trim()
    ? results.filter(r => {
        const q = query.toLowerCase();
        if (r.type === 'project') return r.name.toLowerCase().includes(q) || (r.clientName || '').toLowerCase().includes(q);
        if (r.type === 'client') return r.name.toLowerCase().includes(q) || (r.city || '').toLowerCase().includes(q);
        if (r.type === 'proposal') return r.title.toLowerCase().includes(q) || (r.reference || '').toLowerCase().includes(q) || (r.clientName || '').toLowerCase().includes(q);
        if (r.type === 'task') return r.title.toLowerCase().includes(q) || (r.projectName || '').toLowerCase().includes(q);
        if (r.type === 'supplier') return r.name.toLowerCase().includes(q) || (r.category || '').toLowerCase().includes(q);
        return false;
      }).slice(0, 20)
    : [];

  const handleSelect = (r: SearchResult) => {
    setOpen(false);
    switch (r.type) {
      case 'project': navigate(`/projetos/${r.id}`); break;
      case 'client': navigate(`/clientes/${r.id}`); break;
      case 'proposal': navigate(`/propostas/${r.id}`); break;
      case 'task': navigate(`/tarefas`); break;
      case 'supplier': navigate(`/fornecedores`); break;
    }
  };

  const groupByType = (type: SearchResult['type']) => filtered.filter(r => r.type === type);

  const typeConfig: Record<SearchResult['type'], { label: string; icon: React.ElementType }> = {
    project: { label: 'Projetos', icon: FolderOpen },
    client: { label: 'Clientes', icon: Users },
    proposal: { label: 'Propostas', icon: FileText },
    task: { label: 'Tarefas', icon: HardHat },
    supplier: { label: 'Fornecedores', icon: UsersRound },
  };

  return (
    <>
      {/* Keyboard hint */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-4 left-4 z-30 hidden lg:flex items-center gap-2 px-3 py-2 rounded-md border border-line bg-ivory/90 backdrop-blur-sm text-olive text-xs font-sans hover:border-ink transition-colors shadow-sm"
      >
        <Search size={13} strokeWidth={1.5} />
        <span>Pesquisar</span>
        <kbd className="ml-1 px-1.5 py-0.5 rounded bg-line/40 text-[10px] font-mono">⌘K</kbd>
      </button>

      <CommandDialog open={open} onOpenChange={setOpen} title="Pesquisar" description="Pesquisar projetos, clientes, propostas, tarefas e fornecedores">
        <CommandInput
          placeholder="Pesquisar projetos, clientes, propostas..."
          value={query}
          onValueChange={setQuery}
          className="font-sans text-ink placeholder:text-olive/60"
        />
        <CommandList className="max-h-[420px]">
          {!query.trim() && (
            <div className="px-4 py-8 text-center">
              <Search size={24} className="mx-auto text-olive/30 mb-2" strokeWidth={1.5} />
              <p className="text-sm text-olive font-sans">Comece a escrever para pesquisar</p>
              <p className="text-[11px] text-olive/60 font-sans mt-1">Projetos · Clientes · Propostas · Tarefas · Fornecedores</p>
            </div>
          )}

          {query.trim() && filtered.length === 0 && !isLoading && (
            <CommandEmpty className="text-olive font-sans py-8">
              Nenhum resultado encontrado.
            </CommandEmpty>
          )}

          {isLoading && (
            <div className="px-4 py-8 text-center text-sm text-olive font-sans">
              A carregar...
            </div>
          )}

          {(['project', 'client', 'proposal', 'task', 'supplier'] as const).map(type => {
            const items = groupByType(type);
            if (items.length === 0) return null;
            const { label, icon: Icon } = typeConfig[type];
            return (
              <CommandGroup key={type} heading={label} className="font-sans">
                {items.map(item => (
                  <CommandItem
                    key={`${type}-${item.id}`}
                    onSelect={() => handleSelect(item)}
                    className="font-sans cursor-pointer data-[selected=true]:bg-ink data-[selected=true]:text-ivory"
                  >
                    <Icon size={14} strokeWidth={1.5} className="shrink-0" />
                    <span className="flex-1 truncate">
                      {'name' in item ? item.name : 'title' in item ? item.title : ''}
                    </span>
                    {'clientName' in item && item.clientName && (
                      <span className="text-[11px] text-olive/70 data-[selected=true]:text-ivory/70">
                        {item.clientName}
                      </span>
                    )}
                    {'projectName' in item && item.projectName && (
                      <span className="text-[11px] text-olive/70 data-[selected=true]:text-ivory/70">
                        {item.projectName}
                      </span>
                    )}
                    {'reference' in item && item.reference && (
                      <span className="text-[11px] text-olive/70 data-[selected=true]:text-ivory/70 font-mono">
                        {item.reference}
                      </span>
                    )}
                    <ArrowRight size={12} strokeWidth={1.5} className="shrink-0 opacity-50" />
                  </CommandItem>
                ))}
              </CommandGroup>
            );
          })}
        </CommandList>
      </CommandDialog>
    </>
  );
}
