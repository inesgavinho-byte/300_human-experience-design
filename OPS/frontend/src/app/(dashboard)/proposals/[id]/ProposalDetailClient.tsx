'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getProposals, API_BASE_URL } from '@/lib/api';
import { mockProjects } from '@/lib/mock-data';
import type { Proposal } from '@/types';
import {
  ChevronLeft,
  Download,
  Eye,
  FileText,
  Send,
} from 'lucide-react';

interface ProposalDetailClientProps {
  proposalId: string;
}

export default function ProposalDetailClient({ proposalId }: ProposalDetailClientProps) {
  const router = useRouter();

  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [projectName, setProjectName] = useState('');
  const [loading, setLoading] = useState(true);
  const [previewHtml, setPreviewHtml] = useState('');
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    loadProposal();
  }, [proposalId]);

  async function loadProposal() {
    try {
      for (const project of mockProjects) {
        const proposals = await getProposals(project.id);
        const found = proposals.find((p) => p.id === proposalId);
        if (found) {
          setProposal(found);
          setProjectName(project.name);
          break;
        }
      }
    } catch (error) {
      console.error('Error loading proposal:', error);
    } finally {
      setLoading(false);
    }
  }

  async function generatePreview() {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const response = await fetch(`${API_BASE_URL}/documents/proposal/${proposalId}/html`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      
      if (response.ok) {
        const html = await response.text();
        setPreviewHtml(html);
        setShowPreview(true);
      } else {
        setPreviewHtml(generateFallbackPreview());
        setShowPreview(true);
      }
    } catch {
      setPreviewHtml(generateFallbackPreview());
      setShowPreview(true);
    }
  }

  function generateFallbackPreview() {
    if (!proposal) return '';
    return `
      <html>
        <head>
          <style>
            body { font-family: 'Inter', sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; color: #2C2C2C; }
            h1 { font-family: 'Cormorant Garamond', serif; font-size: 32px; color: #2C2C2C; }
            h2 { font-family: 'Cormorant Garamond', serif; font-size: 20px; color: #B08D57; margin-top: 30px; }
            .meta { color: #8A8279; font-size: 12px; margin-bottom: 20px; }
            .cost { font-size: 24px; font-weight: 600; color: #2C2C2C; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th { background: #2C2C2C; color: white; padding: 10px; text-align: left; }
            td { padding: 10px; border-bottom: 1px solid #E8E4DF; }
          </style>
        </head>
        <body>
          <h1>${proposal.title}</h1>
          <div class="meta">Projeto: ${projectName} | Estado: ${proposal.status}</div>
          <p>${proposal.description}</p>
          <h2>Investimento</h2>
          <div class="cost">${new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(proposal.total_cost)}</div>
          <table>
            <tr><th>Categoria</th><th>Valor</th></tr>
            <tr><td>Equipamentos</td><td>${new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(proposal.equipment_cost)}</td></tr>
            <tr><td>Instalação</td><td>${new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(proposal.installation_cost)}</td></tr>
            <tr><td>Programação</td><td>${new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(proposal.programming_cost)}</td></tr>
          </table>
          <h2>Sistemas Incluídos</h2>
          <ul>
            ${proposal.included_systems.map((s) => `<li>${s}</li>`).join('')}
          </ul>
        </body>
      </html>
    `;
  }

  function downloadHtml() {
    if (!previewHtml) return;
    const blob = new Blob([previewHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `proposta-${proposal?.title?.replace(/\s+/g, '-').toLowerCase()}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <p className="text-muted-foreground">A carregar proposta...</p>
      </div>
    );
  }

  if (!proposal) {
    return (
      <div className="flex h-96 items-center justify-center">
        <p className="text-muted-foreground">Proposta não encontrada</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <Button
            variant="ghost"
            size="sm"
            className="mb-1 -ml-2"
            onClick={() => router.push('/dashboard/proposals')}
          >
            <ChevronLeft className="mr-1 h-4 w-4" />
            Voltar
          </Button>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">
              {proposal.title}
            </h1>
            <StatusBadge status={proposal.status} />
          </div>
          <p className="text-sm text-muted-foreground">
            {projectName} • {proposal.level}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={generatePreview}>
            <Eye className="mr-2 h-4 w-4" />
            Preview
          </Button>
          <Button variant="outline" size="sm" onClick={downloadHtml} disabled={!previewHtml}>
            <Download className="mr-2 h-4 w-4" />
            HTML
          </Button>
          <Button size="sm">
            <Send className="mr-2 h-4 w-4" />
            Enviar
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border bg-card p-4">
          <p className="text-xs text-muted-foreground">Investimento Total</p>
          <p className="text-xl font-bold">
            {new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(proposal.total_cost)}
          </p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <p className="text-xs text-muted-foreground">Equipamentos</p>
          <p className="text-xl font-bold">
            {new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(proposal.equipment_cost)}
          </p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <p className="text-xs text-muted-foreground">Instalação</p>
          <p className="text-xl font-bold">
            {new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(proposal.installation_cost)}
          </p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <p className="text-xs text-muted-foreground">Duração Estimada</p>
          <p className="text-xl font-bold">{proposal.estimated_duration_weeks} semanas</p>
        </div>
      </div>

      <Tabs defaultValue="details">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="details">Detalhes</TabsTrigger>
          <TabsTrigger value="systems">Sistemas</TabsTrigger>
          <TabsTrigger value="preview">Preview PDF</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-4">
          <div className="rounded-xl border bg-card p-6">
            <h3 className="mb-4 text-sm font-medium">Descrição</h3>
            <p className="text-sm text-muted-foreground">{proposal.description}</p>
          </div>
          <div className="rounded-xl border bg-card p-6">
            <h3 className="mb-4 text-sm font-medium">Breakdown de Custos</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span>Equipamentos e Materiais</span>
                <span className="font-medium">
                  {new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(proposal.equipment_cost)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Instalação e Montagem</span>
                <span className="font-medium">
                  {new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(proposal.installation_cost)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Programação e Configuração</span>
                <span className="font-medium">
                  {new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(proposal.programming_cost)}
                </span>
              </div>
              <div className="border-t pt-3 flex justify-between text-sm font-bold">
                <span>Total</span>
                <span>
                  {new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(proposal.total_cost)}
                </span>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="systems" className="space-y-4">
          <div className="rounded-xl border bg-card p-6">
            <h3 className="mb-4 text-sm font-medium">Sistemas Incluídos</h3>
            <div className="flex flex-wrap gap-2">
              {proposal.included_systems.map((system) => (
                <span
                  key={system}
                  className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary"
                >
                  {system}
                </span>
              ))}
            </div>
          </div>
          {proposal.excluded_systems.length > 0 && (
            <div className="rounded-xl border bg-card p-6">
              <h3 className="mb-4 text-sm font-medium">Sistemas Excluídos</h3>
              <div className="flex flex-wrap gap-2">
                {proposal.excluded_systems.map((system) => (
                  <span
                    key={system}
                    className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground"
                  >
                    {system}
                  </span>
                ))}
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="preview" className="space-y-4">
          {!showPreview ? (
            <div className="flex h-96 flex-col items-center justify-center rounded-xl border bg-card">
              <FileText className="h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-medium">Preview da Proposta</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Gere o preview da proposta em formato editorial.
              </p>
              <Button className="mt-4" onClick={generatePreview}>
                <Eye className="mr-2 h-4 w-4" />
                Gerar Preview
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium">Preview da Proposta</h3>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={downloadHtml}>
                    <Download className="mr-2 h-4 w-4" />
                    Download HTML
                  </Button>
                </div>
              </div>
              <div className="rounded-xl border bg-white">
                <iframe
                  srcDoc={previewHtml}
                  className="w-full h-[800px] rounded-xl"
                  title="Proposal Preview"
                />
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
