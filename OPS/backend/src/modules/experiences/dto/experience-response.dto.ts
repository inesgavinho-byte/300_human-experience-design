import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ExperienceResponseDto {
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

  @ApiPropertyOptional()
  actions?: any;

  @ApiPropertyOptional()
  triggers?: any;

  @ApiPropertyOptional()
  createdBy?: string;

  @ApiPropertyOptional()
  authorName?: string;

  @ApiProperty()
  createdAt: string;

  @ApiProperty()
  updatedAt: string;
}
