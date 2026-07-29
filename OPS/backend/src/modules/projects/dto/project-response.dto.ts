import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ProjectResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiPropertyOptional()
  clientId?: string;

  @ApiPropertyOptional()
  clientName?: string;

  @ApiPropertyOptional()
  responsibleId?: string;

  @ApiPropertyOptional()
  responsibleName?: string;

  @ApiPropertyOptional()
  startDate?: string;

  @ApiPropertyOptional()
  endDate?: string;

  @ApiPropertyOptional()
  status?: string;

  @ApiPropertyOptional()
  budget?: number;

  @ApiPropertyOptional()
  location?: any;

  @ApiProperty()
  createdAt: string;

  @ApiProperty()
  updatedAt: string;

  @ApiPropertyOptional()
  counts?: any;
}
