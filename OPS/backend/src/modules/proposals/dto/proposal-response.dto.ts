import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ProposalResponseDto {
  @ApiProperty({ description: 'Proposal ID' })
  id: string;

  @ApiProperty({ description: 'Project ID' })
  projectId: string;

  @ApiProperty({ description: 'Project name' })
  projectName?: string;

  @ApiProperty({ description: 'Proposal title' })
  title: string;

  @ApiPropertyOptional({ description: 'Proposal description' })
  description?: string;

  @ApiProperty({ description: 'Proposal status' })
  status: string;

  @ApiPropertyOptional({ description: 'Proposal amount' })
  amount?: number;

  @ApiProperty({ description: 'Currency' })
  currency: string;

  @ApiPropertyOptional({ description: 'Valid until date' })
  validUntil?: string;

  @ApiPropertyOptional({ description: 'Proposal content' })
  content?: any;

  @ApiPropertyOptional({ description: 'Author ID' })
  createdBy?: string;

  @ApiPropertyOptional({ description: 'Author name' })
  authorName?: string;

  @ApiProperty({ description: 'Created at' })
  createdAt: string;

  @ApiProperty({ description: 'Updated at' })
  updatedAt: string;
}
