import { IsString, IsOptional, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateExperienceDto {
  @ApiProperty()
  @IsUUID()
  projectId: string;

  @ApiProperty()
  @IsString()
  name: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  actions?: any;

  @ApiPropertyOptional()
  @IsOptional()
  triggers?: any;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  createdBy?: string;
}
