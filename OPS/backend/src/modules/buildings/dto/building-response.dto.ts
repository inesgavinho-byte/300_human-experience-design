import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class BuildingResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  projectId: string;

  @ApiPropertyOptional()
  projectName?: string;

  @ApiProperty()
  name: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiProperty()
  type: string;

  @ApiPropertyOptional()
  address?: string;

  @ApiPropertyOptional()
  floorsCount?: number;

  @ApiPropertyOptional()
  totalArea?: number;

  @ApiPropertyOptional()
  location?: any;

  @ApiProperty()
  solutionLevel: string;

  @ApiProperty()
  detectionState: string;

  @ApiProperty()
  createdAt: string;

  @ApiProperty()
  updatedAt: string;

  @ApiPropertyOptional()
  counts?: any;
}
