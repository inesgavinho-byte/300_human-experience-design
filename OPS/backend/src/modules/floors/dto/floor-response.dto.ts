import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class FloorResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  buildingId: string;

  @ApiPropertyOptional()
  buildingName?: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  number: number;

  @ApiPropertyOptional()
  description?: string;

  @ApiPropertyOptional()
  totalArea?: number;

  @ApiPropertyOptional()
  floorPlan?: any;

  @ApiProperty()
  createdAt: string;

  @ApiProperty()
  updatedAt: string;

  @ApiPropertyOptional()
  counts?: any;
}
