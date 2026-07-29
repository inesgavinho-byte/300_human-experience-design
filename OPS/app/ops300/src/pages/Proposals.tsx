import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { askDeepSeek } from '@/lib/deepseek';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, ArrowRight, AlertTriangle, Sparkles, Download, FileText } from 'lucide-react';
import { Link } from 'react-router';
import { toastSuccess, toastError } from '@/lib/toast';
import type { Proposal, Client, Project, ProposalItemSupplier } from '@/types';

const statusColors: Record<string, string> = {
  'Rascunho': 'bg-line/40 text-ink',
  'Enviada': 'bg-olive/30 text-ink',
  'Negociação': 'bg-olive/40 text-ink',
  'Aprovada': 'bg-ink text-ivory',
  'Rejeitada': 'bg-red-100 text-red-800',
};

export default function Proposals() {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [pdfLoadingId, setPdfLoadingId] = useState<string | null>(null);

  // AI Generator state
  const [aiOpen, setAiOpen] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');
  const [aiProjectName, setAiProjectName] = useState('');
  const [aiClientName, setAiClientName] = useState('');
  const [aiProjectType, setAiProjectType] = useState('');
  const [aiArea, setAiArea] = useState('');
  const [aiBudget, setAiBudget] = useState('');
  const [aiRequirements, setAiRequirements] = useState('');

  useEffect(() => {
    async function fetchData() {
      try {
        setIsLoading(true);
        setError('');

        const [proposalsRes, clientsRes, projectsRes] = await Promise.all([
          supabase.from('proposals').select('*'),
          supabase.from('clients').select('*'),
          supabase.from('projects').select('*'),
        ]);

        if (proposalsRes.error) throw proposalsRes.error;
        if (clientsRes.error) throw clientsRes.error;
        if (projectsRes.error) throw projectsRes.error;

        setProposals(proposalsRes.data || []);
        setClients(clientsRes.data || []);
        setProjects(projectsRes.data || []);
      } catch (err: any) {
        setError(err.message || 'Erro ao carregar propostas');
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, []);

  const filtered = proposals.filter(p =>
    p.title.toLowerCase().includes(search.toLowerCase())
  );

async function exportProposalPDF(proposalId: string) {
    setPdfLoadingId(proposalId);
    try {
      const { data: proposal } = await supabase.from('proposals').select('*').eq('id', proposalId).single();
      if (!proposal) throw new Error('Proposta não encontrada');

      const [expRes, clientRes, projectRes, pisRes] = await Promise.all([
        supabase.from('proposal_experiences').select('*').eq('proposal_id', proposalId).order('order_index', { ascending: true }),
        proposal.client_id ? supabase.from('clients').select('*').eq('id', proposal.client_id).single() : Promise.resolve({ data: null, error: null }),
        proposal.project_id ? supabase.from('projects').select('*').eq('id', proposal.project_id).single() : Promise.resolve({ data: null, error: null }),
        supabase.from('proposal_item_suppliers').select('*, supplier:suppliers(*)').eq('proposal_id', proposalId),
      ]);

      const experiences = expRes.data || [];
      const client = clientRes.data;
      const project = projectRes.data;
      const itemSuppliers = pisRes.data || [];

      // Create hidden container
      const container = document.createElement('div');
      container.style.position = 'absolute';
      container.style.left = '-9999px';
      document.body.appendChild(container);

      // Render ProposalPDF into container using a temporary React root
      const root = document.createElement('div');
      root.style.width = '210mm';
      container.appendChild(root);

      // Use html2pdf directly on a simple rendered version
      const html2pdf = (await import('html2pdf.js')).default;

      // Build simple HTML for PDF
      const vatRate = 0.23;
      const includedTotal = experiences.filter((e: any) => (e.amount || 0) > 0).reduce((s: number, e: any) => s + (e.amount || 0), 0);
      const vatAmount = includedTotal * vatRate;
      const grandTotal = includedTotal + vatAmount;

      const pisByExp: Record<string, ProposalItemSupplier[]> = {};
      itemSuppliers.forEach((pis: any) => {
        if (!pisByExp[pis.proposal_experience_id]) pisByExp[pis.proposal_experience_id] = [];
        pisByExp[pis.proposal_experience_id].push(pis);
      });

      const SERVICE_LABELS: Record<string, string> = { purchase: 'Compra', installation: 'Instalação', configuration: 'Configuração', maintenance: 'Manutenção' };
      const ITEM_STATUS_LABELS: Record<string, string> = { pending: 'Pendente', quoted: 'Orçamentado', ordered: 'Encomendado', delivered: 'Entregue', cancelled: 'Cancelado' };

      root.innerHTML = `
        <div style="width:210mm;min-height:297mm;padding:20mm 18mm;background:#faf9f6;color:#1a1a1a;font-family:Georgia,serif;line-height:1.55;box-sizing:border-box;">
          <header style="margin-bottom:14mm;padding-bottom:8mm;border-bottom:0.5pt solid #c4bfb5;">
            <div style="display:flex;justify-content:space-between;align-items:flex-start;">
              <div>
                <h1 style="font-family:Georgia,serif;font-size:32pt;font-weight:400;letter-spacing:0.18em;color:#1a1a1a;margin:0;line-height:1;">300</h1>
                <p style="font-family:Georgia,serif;font-size:7.5pt;letter-spacing:0.35em;text-transform:uppercase;color:#7a7568;margin:4px 0 0 0;">Human Experience Design</p>
              </div>
              <div style="text-align:right;">
                <p style="font-size:7.5pt;color:#7a7568;margin:0;letter-spacing:0.08em;">PROPOSTA COMERCIAL</p>
                <p style="font-size:8.5pt;color:#1a1a1a;margin:2px 0 0 0;font-weight:400;">${proposal.reference || '—'}</p>
              </div>
            </div>
          </header>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10mm;margin-bottom:12mm;padding-bottom:8mm;border-bottom:0.25pt solid #d9d4c9;">
            <div>
              <p style="font-size:6.5pt;letter-spacing:0.2em;text-transform:uppercase;color:#9a9588;margin:0 0 3px 0;">Cliente</p>
              <p style="font-size:10pt;color:#1a1a1a;margin:0;font-weight:400;">${client?.name || '—'}</p>
              ${client?.address ? `<p style="font-size:8pt;color:#7a7568;margin:2px 0 0 0;">${client.address}</p>` : ''}
              ${client?.city ? `<p style="font-size:8pt;color:#7a7568;margin:0;">${client.city}</p>` : ''}
            </div>
            <div>
              <p style="font-size:6.5pt;letter-spacing:0.2em;text-transform:uppercase;color:#9a9588;margin:0 0 3px 0;">Projeto</p>
              <p style="font-size:10pt;color:#1a1a1a;margin:0;font-weight:400;">${project?.name || proposal.title}</p>
              ${project?.address ? `<p style="font-size:8pt;color:#7a7568;margin:2px 0 0 0;">${project.address}</p>` : ''}
            </div>
          </div>
          <div style="margin-bottom:10mm;">
            <h2 style="font-family:Georgia,serif;font-size:18pt;font-weight:400;color:#1a1a1a;margin:0;line-height:1.25;">${proposal.title}</h2>
            <div style="width:24mm;height:0.5pt;background-color:#1a1a1a;margin:5mm 0 0 0;"></div>
          </div>
          <div style="margin-bottom:12mm;max-width:140mm;">
            <p style="font-size:9pt;color:#5a564c;font-style:italic;margin:0;line-height:1.7;">
              A 300 concebe experiências habitacionais onde a tecnologia desaparece em favor do conforto.
              Cada sistema é pensado como uma extensão natural do espaço — iluminação que respira,
              som que envolve, controlo que antecipa. Esta proposta traduz a visão do seu projeto em realidade tangível.
            </p>
          </div>
          <section style="margin-bottom:10mm;">
            <h3 style="font-size:7pt;letter-spacing:0.25em;text-transform:uppercase;color:#9a9588;margin:0 0 6mm 0;font-weight:400;">Experiências Propostas</h3>
            ${experiences.map((e: any, idx: number) => `
              <div style="padding:5mm 0;border-bottom:${idx < experiences.length - 1 ? '0.25pt solid #e8e4db' : 'none'};">
                <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:2mm;">
                  <h4 style="font-family:Georgia,serif;font-size:10.5pt;font-weight:400;color:#1a1a1a;margin:0;">${e.name}</h4>
                  <span style="font-size:10.5pt;color:#1a1a1a;font-weight:400;white-space:nowrap;margin-left:8mm;">${(e.amount || 0).toLocaleString('pt-PT')}€</span>
                </div>
                ${e.description ? `<p style="font-size:8.5pt;color:#6a6558;margin:0 0 3mm 0;line-height:1.55;max-width:150mm;">${e.description}</p>` : ''}
                ${(pisByExp[e.id] || []).length > 0 ? `
                  <div style="margin-top:2mm;padding-left:4mm;border-left:0.5pt solid #d9d4c9;">
                    ${pisByExp[e.id].map((pis: any) => `
                      <p style="font-size:7.5pt;color:#8a8578;margin:0 0 1.5mm 0;line-height:1.4;">
                        ${pis.supplier?.name} · ${SERVICE_LABELS[pis.service_type] || pis.service_type}
                        · ${(pis.total_cost || 0).toLocaleString('pt-PT')}€
                        · ${ITEM_STATUS_LABELS[pis.status] || pis.status}
                      </p>
                    `).join('')}
                  </div>
                ` : ''}
              </div>
            `).join('')}
          </section>
          <div style="margin-top:10mm;padding:8mm 0;border-top:0.5pt solid #c4bfb5;margin-left:auto;max-width:90mm;">
            <div style="display:flex;justify-content:space-between;font-size:9pt;color:#5a564c;margin-bottom:2mm;"><span>Subtotal</span><span>${includedTotal.toLocaleString('pt-PT')}€</span></div>
            <div style="display:flex;justify-content:space-between;font-size:9pt;color:#5a564c;margin-bottom:4mm;"><span>IVA (23%)</span><span>${vatAmount.toLocaleString('pt-PT')}€</span></div>
            <div style="display:flex;justify-content:space-between;font-size:13pt;color:#1a1a1a;font-weight:400;padding-top:3mm;border-top:0.5pt solid #1a1a1a;font-family:Georgia,serif;"><span>Total</span><span>${grandTotal.toLocaleString('pt-PT')}€</span></div>
          </div>
          ${proposal.payment_terms ? `
            <div style="margin-top:10mm;padding-top:6mm;border-top:0.25pt solid #d9d4c9;">
              <div style="margin-bottom:4mm;">
                <p style="font-size:6.5pt;letter-spacing:0.2em;text-transform:uppercase;color:#9a9588;margin:0 0 2px 0;">Condições de Pagamento</p>
                <p style="font-size:8.5pt;color:#4a4538;margin:0;">${proposal.payment_terms}</p>
              </div>
            </div>
          ` : ''}
          ${proposal.valid_until ? `
            <div style="margin-top:4mm;">
              <p style="font-size:6.5pt;letter-spacing:0.2em;text-transform:uppercase;color:#9a9588;margin:0 0 2px 0;">Válida até</p>
              <p style="font-size:8.5pt;color:#4a4538;margin:0;">${new Date(proposal.valid_until).toLocaleDateString('pt-PT', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
            </div>
          ` : ''}
          <footer style="margin-top:14mm;padding-top:5mm;border-top:0.25pt solid #d9d4c9;display:flex;justify-content:space-between;align-items:flex-end;">
            <div>
              <p style="font-size:7pt;color:#9a9588;margin:0 0 1px 0;">300 — Human Experience Design</p>
              <p style="font-size:7pt;color:#9a9588;margin:0;">GAVINHO Group · www.300.pt</p>
            </div>
            <div style="text-align:right;">
              <p style="font-size:7pt;color:#9a9588;margin:0 0 1px 0;">Proposta gerada em ${new Date().toLocaleDateString('pt-PT')}</p>
              <p style="font-size:7pt;color:#9a9588;margin:0;">Versão ${proposal.version}</p>
            </div>
          </footer>
        </div>
      `;

      const opt = {
        margin: [10, 10, 10, 10] as [number, number, number, number],
        filename: `Proposta_${proposal.reference || proposal.id.slice(0, 8)}.pdf`,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const },
      };
      await html2pdf().set(opt).from(root).save();

      document.body.removeChild(container);
      toastSuccess('PDF exportado', `Proposta ${proposal.reference || proposal.id.slice(0, 8)}`);
    } catch (err: any) {
      toastError('Erro ao exportar PDF', err.message || 'Erro desconhecido');
    } finally {
      setPdfLoadingId(null);
    }
  }

  async function handleAIGenerate() {
    if (!aiProjectName.trim() || !aiClientName.trim() || !aiProjectType.trim()) {
      setAiError('Por favor, preencha o nome do projeto, cliente e tipo.');
      return;
    }
    setAiLoading(true);
    setAiError('');

    try {
      const prompt = `You are a proposal writer for 300 — Human Experience Design, a premium smart home integration company. 
Generate a professional proposal in Portuguese (Portugal) for the following project:

Project: ${aiProjectName}
Client: ${aiClientName}
Type: ${aiProjectType}
Area: ${aiArea || 'N/A'}m²
Budget: ${aiBudget || 'N/A'}
Special requirements: ${aiRequirements || 'Nenhum'}

Generate 3-5 experience/line items that would be typical for this project type. 
Each item should have: name, description, and estimated price in EUR.
Use 300's philosophy: invisible technology, 2700K lighting, Basalte/DOT logic, local-first systems.

Format your response as JSON:
{
  "title": "...",
  "experiences": [
    {"name": "...", "description": "...", "amount": 12345},
    ...
  ],
  "notes": "..."
}`;

      const response = await askDeepSeek([{ role: 'user', content: prompt }]);

      // Extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Resposta da IA não contém dados válidos. Tente novamente.');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      if (!parsed.title || !Array.isArray(parsed.experiences)) {
        throw new Error('Estrutura de resposta inválida.');
      }

      // Create or find client
      let clientId: string | null = null;
      const existingClient = clients.find(c => c.name.toLowerCase() === aiClientName.trim().toLowerCase());
      if (existingClient) {
        clientId = existingClient.id;
      } else {
        const { data: newClient, error: clientErr } = await supabase
          .from('clients')
          .insert({ name: aiClientName.trim() })
          .select()
          .single();
        if (clientErr) throw clientErr;
        clientId = newClient.id;
        setClients(prev => [...prev, newClient]);
      }

      // Generate reference
      const year = new Date().getFullYear();
      const ref = `PROP-${year}-${Math.floor(Math.random() * 9000 + 1000)}`;
      const totalAmount = parsed.experiences.reduce((s: number, e: any) => s + (Number(e.amount) || 0), 0);

      // Create proposal
      const { data: newProposal, error: proposalErr } = await supabase
        .from('proposals')
        .insert({
          title: parsed.title,
          reference: ref,
          client_id: clientId,
          status: 'Rascunho',
          total_amount: totalAmount,
          version: 1,
          payment_terms: parsed.notes || '50% no arranque, 50% na entrega',
          valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        })
        .select()
        .single();

      if (proposalErr) throw proposalErr;

      // Create experiences
      const experiencesToInsert = parsed.experiences.map((e: any, idx: number) => ({
        proposal_id: newProposal.id,
        name: e.name,
        description: e.description || '',
        amount: Number(e.amount) || 0,
        order_index: idx,
      }));

      const { error: expErr } = await supabase
        .from('proposal_experiences')
        .insert(experiencesToInsert);

      if (expErr) throw expErr;

      // Update local state
      setProposals(prev => [newProposal, ...prev]);
      toastSuccess('Proposta gerada com sucesso', `Ref: ${ref}`);
      setAiOpen(false);

      // Reset form
      setAiProjectName('');
      setAiClientName('');
      setAiProjectType('');
      setAiArea('');
      setAiBudget('');
      setAiRequirements('');
    } catch (err: any) {
      setAiError(err.message || 'Erro ao gerar proposta. Tente novamente.');
      toastError('Erro ao gerar proposta', err.message);
    } finally {
      setAiLoading(false);
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-10 w-80" />
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
        <h1 className="font-serif text-3xl text-ink">Propostas</h1>
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
          <h1 className="font-serif text-3xl text-ink">Propostas</h1>
          <p className="text-olive text-sm mt-1 font-sans">Framework de propostas 300</p>
        </div>
        <Button
          onClick={() => setAiOpen(true)}
          className="bg-ink text-ivory hover:bg-ink/90 font-sans"
          size="sm"
        >
          <Sparkles size={14} className="mr-1.5" /> Gerar com IA
        </Button>
      </div>

      <div className="relative w-full sm:w-80">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-olive" strokeWidth={1.5} />
        <Input
          placeholder="Pesquisar propostas..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9 bg-ivory border-line text-ink placeholder:text-olive/60"
        />
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filtered.map(p => {
          const client = clients.find(c => c.id === p.client_id);
          const project = projects.find(proj => proj.id === p.project_id);
          return (
            <Card key={p.id} className="border-line bg-ivory hover:border-ink/40 transition-colors">
              <CardContent className="p-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-serif text-lg text-ink">{p.title}</h3>
                      <Badge variant="outline" className={`text-[10px] ${statusColors[p.status || ''] || ''}`}>
                        {p.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-olive mt-1 font-sans">{client?.name || '—'} · {project?.name || '—'} · {(p.total_amount || 0).toLocaleString('pt-PT')}€</p>
                    <p className="text-xs text-olive mt-1 font-sans">Ref: {p.reference || '—'} · Válida até: {p.valid_until || '—'}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => exportProposalPDF(p.id)}
                      disabled={pdfLoadingId === p.id}
                      className="text-olive hover:text-ink hover:bg-line/30 font-sans"
                      title="Exportar PDF"
                    >
                      {pdfLoadingId === p.id ? (
                        <FileText size={14} className="animate-pulse" />
                      ) : (
                        <Download size={14} />
                      )}
                    </Button>
                    <Link to={`/propostas/${p.id}`}>
                      <Button variant="outline" size="sm" className="border-line text-ink hover:bg-ink hover:text-ivory font-sans">
                        Ver detalhe <ArrowRight size={14} className="ml-1" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
        {filtered.length === 0 && (
          <p className="text-sm text-olive font-sans">Nenhuma proposta encontrada.</p>
        )}
      </div>

      {/* AI Generator Dialog */}
      <Dialog open={aiOpen} onOpenChange={setAiOpen}>
        <DialogContent className="bg-ivory border-line text-ink max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl text-ink">Gerar Proposta com IA</DialogTitle>
            <DialogDescription className="text-olive font-sans text-sm">
              Preencha os detalhes do projeto e a IA irá gerar uma proposta estruturada com experiências recomendadas.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-ink font-sans text-xs">Nome do Projeto</Label>
              <Input
                value={aiProjectName}
                onChange={e => setAiProjectName(e.target.value)}
                placeholder="Ex: Moradia Algarve"
                className="bg-ivory border-line text-ink placeholder:text-olive/60 font-sans"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-ink font-sans text-xs">Nome do Cliente</Label>
              <Input
                value={aiClientName}
                onChange={e => setAiClientName(e.target.value)}
                placeholder="Ex: João Silva"
                className="bg-ivory border-line text-ink placeholder:text-olive/60 font-sans"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-ink font-sans text-xs">Tipo de Projeto</Label>
                <Select value={aiProjectType} onValueChange={setAiProjectType}>
                  <SelectTrigger className="bg-ivory border-line text-ink text-xs font-sans">
                    <SelectValue placeholder="Selecionar..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Apartamento">Apartamento</SelectItem>
                    <SelectItem value="Moradia">Moradia</SelectItem>
                    <SelectItem value="Escritório">Escritório</SelectItem>
                    <SelectItem value="Hotel">Hotel</SelectItem>
                    <SelectItem value="Restaurante">Restaurante</SelectItem>
                    <SelectItem value="Edifício Comercial">Edifício Comercial</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-ink font-sans text-xs">Área (m²)</Label>
                <Input
                  value={aiArea}
                  onChange={e => setAiArea(e.target.value)}
                  placeholder="Ex: 250"
                  className="bg-ivory border-line text-ink placeholder:text-olive/60 font-sans"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-ink font-sans text-xs">Orçamento Aproximado</Label>
              <Input
                value={aiBudget}
                onChange={e => setAiBudget(e.target.value)}
                placeholder="Ex: 50000€ - 80000€"
                className="bg-ivory border-line text-ink placeholder:text-olive/60 font-sans"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-ink font-sans text-xs">Requisitos Especiais</Label>
              <Textarea
                value={aiRequirements}
                onChange={e => setAiRequirements(e.target.value)}
                placeholder="Ex: Sistema de som multiroom, iluminação DALI, controlo de estores..."
                rows={3}
                className="bg-ivory border-line text-ink placeholder:text-olive/60 font-sans resize-none"
              />
            </div>

            {aiError && (
              <div className="flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md p-3">
                <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                <span>{aiError}</span>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAiOpen(false)} className="border-line text-ink hover:bg-ink hover:text-ivory font-sans">
              Cancelar
            </Button>
            <Button
              onClick={handleAIGenerate}
              disabled={aiLoading}
              className="bg-ink text-ivory hover:bg-ink/90 font-sans"
            >
              {aiLoading ? (
                <>A gerar...</>
              ) : (
                <><Sparkles size={14} className="mr-1.5" /> Gerar Proposta</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
