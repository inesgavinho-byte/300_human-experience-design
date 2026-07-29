import { IsString, IsOptional, IsUUID, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { system_category } from '@prisma/client';

export class CreateSystemDto {
  @ApiProperty()
  @IsUUID()
  buildingId: string;

  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty({ enum: system_category })
  @IsEnum(system_category)
  category: system_category;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  status?: string;
}
