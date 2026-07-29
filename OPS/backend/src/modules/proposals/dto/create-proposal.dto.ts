import { IsString, IsOptional, IsUUID, IsNumber, IsEnum, IsJSON, IsDate } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { proposal_status } from '@prisma/client';

export class CreateProposalDto {
  @ApiProperty({ description: 'Project ID' })
  @IsUUID()
  projectId: string;

  @ApiProperty({ description: 'Proposal title' })
  @IsString()
  title: string;

  @ApiPropertyOptional({ description: 'Proposal description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Proposal status' })
  @IsOptional()
  @IsEnum(proposal_status)
  status?: proposal_status;

  @ApiPropertyOptional({ description: 'Proposal amount' })
  @IsOptional()
  @IsNumber()
  amount?: number;

  @ApiPropertyOptional({ description: 'Currency', default: 'EUR' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional({ description: 'Valid until date' })
  @IsOptional()
  validUntil?: Date;

  @ApiPropertyOptional({ description: 'Proposal content as JSON' })
  @IsOptional()
  content?: any;
}
