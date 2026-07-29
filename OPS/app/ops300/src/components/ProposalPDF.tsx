import { forwardRef } from 'react';
import type {
  Proposal, ProposalExperience, Client, Project,
  ProposalItemSupplier, ServiceType, ItemSupplierStatus,
} from '@/types';

/* ─── Labels ─── */
const SERVICE_LABELS: Record<ServiceType, string> = {
  purchase: 'Compra',
  installation: 'Instalação',
  configuration: 'Configuração',
  maintenance: 'Manutenção',
};

const ITEM_STATUS_LABELS: Record<ItemSupplierStatus, string> = {
  pending: 'Pendente',
  quoted: 'Orçamentado',
  ordered: 'Encomendado',
  delivered: 'Entregue',
  cancelled: 'Cancelado',
};

/* ─── Props ─── */
interface ProposalPDFProps {
  proposal: Proposal;
  client: Client | null;
  project: Project | null;
  experiences: ProposalExperience[];
  itemSuppliers: ProposalItemSupplier[];
}

/* ─── Component ─── */
const ProposalPDF = forwardRef<HTMLDivElement, ProposalPDFProps>(
  ({ proposal, client, project, experiences, itemSuppliers }, ref) => {
    const vatRate = 0.23;
    const includedTotal = experiences
      .filter(e => (e.amount || 0) > 0)
      .reduce((s, e) => s + (e.amount || 0), 0);
    const vatAmount = includedTotal * vatRate;
    const grandTotal = includedTotal + vatAmount;

    const pisByExp: Record<string, ProposalItemSupplier[]> = {};
    itemSuppliers.forEach(pis => {
      if (!pisByExp[pis.proposal_experience_id]) pisByExp[pis.proposal_experience_id] = [];
      pisByExp[pis.proposal_experience_id].push(pis);
    });

    return (
      <div
        ref={ref}
        style={{
          width: '210mm',
          minHeight: '297mm',
          padding: '20mm 18mm',
          backgroundColor: '#faf9f6',
          color: '#1a1a1a',
          fontFamily: "'Georgia', 'Times New Roman', serif",
          lineHeight: 1.55,
          boxSizing: 'border-box',
        }}
      >
        {/* ═════ HEADER ═════ */}
        <header style={{ marginBottom: '14mm', paddingBottom: '8mm', borderBottom: '0.5pt solid #c4bfb5' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h1
                style={{
                  fontFamily: "'Georgia', serif",
                  fontSize: '32pt',
                  fontWeight: 400,
                  letterSpacing: '0.18em',
                  color: '#1a1a1a',
                  margin: 0,
                  lineHeight: 1,
                }}
              >
                300
              </h1>
              <p
                style={{
                  fontFamily: "'Georgia', serif",
                  fontSize: '7.5pt',
                  letterSpacing: '0.35em',
                  textTransform: 'uppercase',
                  color: '#7a7568',
                  margin: '4px 0 0 0',
                }}
              >
                Human Experience Design
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: '7.5pt', color: '#7a7568', margin: 0, letterSpacing: '0.08em' }}>
                PROPOSTA COMERCIAL
              </p>
              <p style={{ fontSize: '8.5pt', color: '#1a1a1a', margin: '2px 0 0 0', fontWeight: 400 }}>
                {proposal.reference || '—'}
              </p>
            </div>
          </div>
        </header>

        {/* ═════ META ═════ */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '10mm',
            marginBottom: '12mm',
            paddingBottom: '8mm',
            borderBottom: '0.25pt solid #d9d4c9',
          }}
        >
          <div>
            <p
              style={{
                fontSize: '6.5pt',
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                color: '#9a9588',
                margin: '0 0 3px 0',
              }}
            >
              Cliente
            </p>
            <p style={{ fontSize: '10pt', color: '#1a1a1a', margin: 0, fontWeight: 400 }}>
              {client?.name || '—'}
            </p>
            {client?.address && (
              <p style={{ fontSize: '8pt', color: '#7a7568', margin: '2px 0 0 0' }}>{client.address}</p>
            )}
            {client?.city && (
              <p style={{ fontSize: '8pt', color: '#7a7568', margin: 0 }}>{client.city}</p>
            )}
          </div>
          <div>
            <p
              style={{
                fontSize: '6.5pt',
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                color: '#9a9588',
                margin: '0 0 3px 0',
              }}
            >
              Projeto
            </p>
            <p style={{ fontSize: '10pt', color: '#1a1a1a', margin: 0, fontWeight: 400 }}>
              {project?.name || proposal.title}
            </p>
            {project?.address && (
              <p style={{ fontSize: '8pt', color: '#7a7568', margin: '2px 0 0 0' }}>{project.address}</p>
            )}
          </div>
        </div>

        {/* ═════ TITLE ═════ */}
        <div style={{ marginBottom: '10mm' }}>
          <h2
            style={{
              fontFamily: "'Georgia', serif",
              fontSize: '18pt',
              fontWeight: 400,
              color: '#1a1a1a',
              margin: 0,
              lineHeight: 1.25,
            }}
          >
            {proposal.title}
          </h2>
          <div
            style={{
              width: '24mm',
              height: '0.5pt',
              backgroundColor: '#1a1a1a',
              margin: '5mm 0 0 0',
            }}
          />
        </div>

        {/* ═════ INTRO ═════ */}
        <div style={{ marginBottom: '12mm', maxWidth: '140mm' }}>
          <p
            style={{
              fontSize: '9pt',
              color: '#5a564c',
              fontStyle: 'italic',
              margin: 0,
              lineHeight: 1.7,
            }}
          >
            A 300 concebe experiências habitacionais onde a tecnologia desaparece em favor do
            conforto. Cada sistema é pensado como uma extensão natural do espaço — iluminação
            que respira, som que envolve, controlo que antecipa. Esta proposta traduz a visão do
            seu projeto em realidade tangível.
          </p>
        </div>

        {/* ═════ EXPERIENCES ═════ */}
        <section style={{ marginBottom: '10mm' }}>
          <h3
            style={{
              fontSize: '7pt',
              letterSpacing: '0.25em',
              textTransform: 'uppercase',
              color: '#9a9588',
              margin: '0 0 6mm 0',
              fontWeight: 400,
            }}
          >
            Experiências Propostas
          </h3>

          {experiences.map((e, idx) => (
            <div
              key={e.id}
              style={{
                padding: '5mm 0',
                borderBottom: idx < experiences.length - 1 ? '0.25pt solid #e8e4db' : 'none',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '2mm' }}>
                <h4
                  style={{
                    fontFamily: "'Georgia', serif",
                    fontSize: '10.5pt',
                    fontWeight: 400,
                    color: '#1a1a1a',
                    margin: 0,
                  }}
                >
                  {e.name}
                </h4>
                <span
                  style={{
                    fontSize: '10.5pt',
                    color: '#1a1a1a',
                    fontWeight: 400,
                    whiteSpace: 'nowrap',
                    marginLeft: '8mm',
                  }}
                >
                  {(e.amount || 0).toLocaleString('pt-PT')}€
                </span>
              </div>

              {e.description && (
                <p
                  style={{
                    fontSize: '8.5pt',
                    color: '#6a6558',
                    margin: '0 0 3mm 0',
                    lineHeight: 1.55,
                    maxWidth: '150mm',
                  }}
                >
                  {e.description}
                </p>
              )}

              {/* Fornecedores desta experiência */}
              {(pisByExp[e.id] || []).length > 0 && (
                <div style={{ marginTop: '2mm', paddingLeft: '4mm', borderLeft: '0.5pt solid #d9d4c9' }}>
                  {pisByExp[e.id].map(pis => (
                    <p
                      key={pis.id}
                      style={{
                        fontSize: '7.5pt',
                        color: '#8a8578',
                        margin: '0 0 1.5mm 0',
                        lineHeight: 1.4,
                      }}
                    >
                      {pis.supplier?.name} · {SERVICE_LABELS[pis.service_type as ServiceType]}
                      {' · '}
                      {(pis.total_cost || 0).toLocaleString('pt-PT')}€
                      {' · '}
                      {ITEM_STATUS_LABELS[pis.status as ItemSupplierStatus]}
                    </p>
                  ))}
                </div>
              )}
            </div>
          ))}
        </section>

        {/* ═════ TOTALS ═════ */}
        <div
          style={{
            marginTop: '10mm',
            padding: '8mm 0',
            borderTop: '0.5pt solid #c4bfb5',
            marginLeft: 'auto',
            maxWidth: '90mm',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '9pt',
              color: '#5a564c',
              marginBottom: '2mm',
            }}
          >
            <span>Subtotal</span>
            <span>{includedTotal.toLocaleString('pt-PT')}€</span>
          </div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '9pt',
              color: '#5a564c',
              marginBottom: '4mm',
            }}
          >
            <span>IVA (23%)</span>
            <span>{vatAmount.toLocaleString('pt-PT')}€</span>
          </div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '13pt',
              color: '#1a1a1a',
              fontWeight: 400,
              paddingTop: '3mm',
              borderTop: '0.5pt solid #1a1a1a',
              fontFamily: "'Georgia', serif",
            }}
          >
            <span>Total</span>
            <span>{grandTotal.toLocaleString('pt-PT')}€</span>
          </div>
        </div>

        {/* ═════ TERMS ═════ */}
        {(proposal.payment_terms || proposal.valid_until) && (
          <div
            style={{
              marginTop: '10mm',
              paddingTop: '6mm',
              borderTop: '0.25pt solid #d9d4c9',
            }}
          >
            {proposal.payment_terms && (
              <div style={{ marginBottom: '4mm' }}>
                <p
                  style={{
                    fontSize: '6.5pt',
                    letterSpacing: '0.2em',
                    textTransform: 'uppercase',
                    color: '#9a9588',
                    margin: '0 0 2px 0',
                  }}
                >
                  Condições de Pagamento
                </p>
                <p style={{ fontSize: '8.5pt', color: '#4a4538', margin: 0 }}>{proposal.payment_terms}</p>
              </div>
            )}
            {proposal.valid_until && (
              <div>
                <p
                  style={{
                    fontSize: '6.5pt',
                    letterSpacing: '0.2em',
                    textTransform: 'uppercase',
                    color: '#9a9588',
                    margin: '0 0 2px 0',
                  }}
                >
                  Válida até
                </p>
                <p style={{ fontSize: '8.5pt', color: '#4a4538', margin: 0 }}>
                  {new Date(proposal.valid_until).toLocaleDateString('pt-PT', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </p>
              </div>
            )}
          </div>
        )}

        {/* ═════ FOOTER ═════ */}
        <footer
          style={{
            marginTop: '14mm',
            paddingTop: '5mm',
            borderTop: '0.25pt solid #d9d4c9',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
          }}
        >
          <div>
            <p style={{ fontSize: '7pt', color: '#9a9588', margin: '0 0 1px 0' }}>
              300 — Human Experience Design
            </p>
            <p style={{ fontSize: '7pt', color: '#9a9588', margin: 0 }}>
              GAVINHO Group · www.300.pt
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: '7pt', color: '#9a9588', margin: '0 0 1px 0' }}>
              Proposta gerada em {new Date().toLocaleDateString('pt-PT')}
            </p>
            <p style={{ fontSize: '7pt', color: '#9a9588', margin: 0 }}>
              Versão {proposal.version}
            </p>
          </div>
        </footer>
      </div>
    );
  }
);

ProposalPDF.displayName = 'ProposalPDF';

export default ProposalPDF;
