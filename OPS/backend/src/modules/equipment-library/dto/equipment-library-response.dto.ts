import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class EquipmentLibraryResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  category: string;

  @ApiPropertyOptional()
  manufacturer?: string;

  @ApiPropertyOptional()
  model?: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiPropertyOptional()
  specifications?: any;

  @ApiPropertyOptional()
  datasheetUrl?: string;

  @ApiPropertyOptional()
  imageUrl?: string;

  @ApiProperty()
  isPublic: boolean;

  @ApiProperty()
  createdAt: string;

  @ApiProperty()
  updatedAt: string;
}
