import { IsString, IsOptional, IsInt, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { requirement_category } from '@prisma/client';

export class UpdateRequirementDto {
  @ApiPropertyOptional({ enum: requirement_category })
  @IsEnum(requirement_category)
  @IsOptional()
  category?: requirement_category;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  title?: string;

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
}
