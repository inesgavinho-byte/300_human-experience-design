import { IsString, IsOptional, IsNumber, IsEnum, IsDate } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { proposal_status } from '@prisma/client';

export class UpdateProposalDto {
  @ApiPropertyOptional({ description: 'Proposal title' })
  @IsOptional()
  @IsString()
  title?: string;

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

  @ApiPropertyOptional({ description: 'Valid until date' })
  @IsOptional()
  validUntil?: Date;

  @ApiPropertyOptional({ description: 'Proposal content as JSON' })
  @IsOptional()
  content?: any;
}
