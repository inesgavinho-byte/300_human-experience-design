import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RoomResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  floorId: string;

  @ApiPropertyOptional()
  floorName?: string;

  @ApiPropertyOptional()
  buildingName?: string;

  @ApiProperty()
  name: string;

  @ApiPropertyOptional()
  number?: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiPropertyOptional()
  area?: number;

  @ApiPropertyOptional()
  capacity?: number;

  @ApiPropertyOptional()
  purpose?: string;

  @ApiProperty()
  detectionState: string;

  @ApiPropertyOptional()
  layout?: any;

  @ApiProperty()
  createdAt: string;

  @ApiProperty()
  updatedAt: string;

  @ApiPropertyOptional()
  counts?: any;
}
