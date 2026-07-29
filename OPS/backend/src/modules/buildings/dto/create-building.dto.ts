import { IsString, IsOptional, IsUUID, IsInt, IsNumber, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { building_type, solution_level, detection_state } from '@prisma/client';

export class CreateBuildingDto {
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

  @ApiPropertyOptional({ enum: building_type })
  @IsEnum(building_type)
  @IsOptional()
  type?: building_type;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  address?: string;

  @ApiPropertyOptional()
  @IsInt()
  @IsOptional()
  floorsCount?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  totalArea?: number;

  @ApiPropertyOptional()
  @IsOptional()
  location?: any;

  @ApiPropertyOptional({ enum: solution_level })
  @IsEnum(solution_level)
  @IsOptional()
  solutionLevel?: solution_level;

  @ApiPropertyOptional({ enum: detection_state })
  @IsEnum(detection_state)
  @IsOptional()
  detectionState?: detection_state;
}
