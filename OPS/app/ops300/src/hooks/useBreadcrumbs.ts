import { useState, useEffect } from 'react';
import { useLocation } from 'react-router';
import { supabase } from '@/lib/supabase';

const staticLabels: Record<string, string> = {
  '/': 'Dashboard',
  '/projetos': 'Projetos',
  '/clientes': 'Clientes',
  '/propostas': 'Propostas',
  '/configuracoes-sistema': 'Sistemas',
  '/documentacao': 'Documentação',
  '/catalogo': 'Catálogo',
  '/tarefas': 'Tarefas',
  '/manutencao': 'Manutenção',
  '/manutencao/historico': 'Histórico',
  '/financeiro': 'Finanças',
  '/relatorios': 'Relatórios',
  '/configuracoes': 'Configurações',
  '/perfil': 'Perfil',
  '/equipa': 'Equipa',
  '/fornecedores': 'Fornecedores',
  '/procurement': 'Procurement',
};

interface Breadcrumb {
  label: string;
  path?: string;
  isLast: boolean;
}

export function useBreadcrumbs(): Breadcrumb[] {
  const location = useLocation();
  const [dynamicLabel, setDynamicLabel] = useState<string>('');

  const segments = location.pathname.split('/').filter(Boolean);

  // Fetch dynamic label for detail pages
  useEffect(() => {
    if (segments.length < 2) {
      setDynamicLabel('');
      return;
    }

    const resource = segments[0];
    const id = segments[1];
    if (!id || id === 'novo') {
      setDynamicLabel('');
      return;
    }

    let cancelled = false;

    async function fetchName() {
      try {
        let label = 'Detalhe';
        switch (resource) {
          case 'projetos': {
            const res = await supabase.from('projects').select('name').eq('id', id).single();
            if (res.data?.name) label = res.data.name;
            break;
          }
          case 'clientes': {
            const res = await supabase.from('clients').select('name').eq('id', id).single();
            if (res.data?.name) label = res.data.name;
            break;
          }
          case 'propostas': {
            const res = await supabase.from('proposals').select('title').eq('id', id).single();
            if (res.data?.title) label = res.data.title;
            break;
          }
          case 'configuracoes-sistema': {
            const res = await supabase.from('system_configurations').select('name').eq('id', id).single();
            if (res.data?.name) label = res.data.name;
            break;
          }
          default:
            return;
        }
        if (!cancelled) {
          setDynamicLabel(label);
        }
      } catch {
        // ignore
      }
    }

    fetchName();
    return () => { cancelled = true; };
  }, [segments]);

  // Build breadcrumbs
  const crumbs: Breadcrumb[] = [];

  if (segments.length === 0) {
    crumbs.push({ label: 'Dashboard', isLast: true });
    return crumbs;
  }

  // Parent section
  const parentPath = '/' + segments[0];
  const parentLabel = staticLabels[parentPath] || segments[0];
  crumbs.push({ label: parentLabel, path: parentPath, isLast: segments.length === 1 });

  // Sub-paths
  if (segments.length >= 2) {
    const subPath = '/' + segments.slice(0, 2).join('/');
    const subLabel = staticLabels[subPath];
    if (subLabel && subPath !== parentPath) {
      crumbs.push({ label: subLabel, path: subPath, isLast: segments.length === 2 });
    } else if (dynamicLabel) {
      crumbs.push({ label: dynamicLabel, isLast: segments.length === 2 });
    } else {
      crumbs.push({ label: 'Detalhe', isLast: segments.length === 2 });
    }
  }

  // Deeper paths
  for (let i = 2; i < segments.length; i++) {
    const seg = segments[i];
    const label = staticLabels['/' + segments.slice(0, i + 1).join('/')] || seg;
    crumbs.push({ label, isLast: i === segments.length - 1 });
  }

  return crumbs;
}
