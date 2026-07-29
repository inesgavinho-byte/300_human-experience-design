import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RequirementResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  projectId: string;

  @ApiPropertyOptional()
  projectName?: string;

  @ApiPropertyOptional()
  roomId?: string;

  @ApiPropertyOptional()
  roomName?: string;

  @ApiProperty()
  category: string;

  @ApiProperty()
  title: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiProperty()
  priority: number;

  @ApiPropertyOptional()
  actions?: any;

  @ApiPropertyOptional()
  source?: string;

  @ApiPropertyOptional()
  createdBy?: string;

  @ApiPropertyOptional()
  authorName?: string;

  @ApiProperty()
  createdAt: string;

  @ApiProperty()
  updatedAt: string;
}
