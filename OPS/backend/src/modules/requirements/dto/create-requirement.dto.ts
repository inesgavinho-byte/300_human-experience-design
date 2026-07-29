import { IsString, IsOptional, IsUUID, IsInt, IsEnum, IsJSON } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { requirement_category } from '@prisma/client';

export class CreateRequirementDto {
  @ApiProperty()
  @IsUUID()
  projectId: string;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  roomId?: string;

  @ApiProperty({ enum: requirement_category })
  @IsEnum(requirement_category)
  category: requirement_category;

  @ApiProperty()
  @IsString()
  title: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional()
  @IsInt()
  @IsOptional()
  priority?: number;

  @ApiPropertyOptional()
  @IsOptional()
  actions?: any;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  source?: string;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  createdBy?: string;
}
