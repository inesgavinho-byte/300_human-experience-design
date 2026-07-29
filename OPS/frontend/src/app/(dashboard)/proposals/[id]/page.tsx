import { mockProposals } from '@/lib/mock-data';
import ProposalDetailClient from './ProposalDetailClient';

export function generateStaticParams() {
  return mockProposals.map((proposal) => ({
    id: proposal.id,
  }));
}

export default function ProposalDetailPage({ params }: { params: { id: string } }) {
  return <ProposalDetailClient proposalId={params.id} />;
}
