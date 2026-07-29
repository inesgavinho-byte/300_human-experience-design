import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PrescriptionResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  projectId: string;

  @ApiPropertyOptional()
  projectName?: string;

  @ApiPropertyOptional()
  systemId?: string;

  @ApiPropertyOptional()
  systemName?: string;

  @ApiPropertyOptional()
  roomId?: string;

  @ApiPropertyOptional()
  roomName?: string;

  @ApiProperty()
  title: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiProperty()
  status: string;

  @ApiProperty()
  priority: string;

  @ApiPropertyOptional()
  actions?: any;

  @ApiPropertyOptional()
  approvedBy?: string;

  @ApiPropertyOptional()
  approvedAt?: string;

  @ApiPropertyOptional()
  createdBy?: string;

  @ApiPropertyOptional()
  authorName?: string;

  @ApiProperty()
  createdAt: string;

  @ApiProperty()
  updatedAt: string;
}
