import { IsString, IsOptional, IsUUID, IsInt, IsNumber, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { detection_state } from '@prisma/client';

export class CreateRoomDto {
  @ApiProperty()
  @IsUUID()
  floorId: string;

  @ApiProperty()
  @IsString()
  name: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  number?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  area?: number;

  @ApiPropertyOptional()
  @IsInt()
  @IsOptional()
  capacity?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  purpose?: string;

  @ApiPropertyOptional({ enum: detection_state })
  @IsEnum(detection_state)
  @IsOptional()
  detectionState?: detection_state;

  @ApiPropertyOptional()
  @IsOptional()
  layout?: any;
}
