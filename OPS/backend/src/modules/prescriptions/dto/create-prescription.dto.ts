import { IsString, IsOptional, IsUUID, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { prescription_status, prescription_priority } from '@prisma/client';

export class CreatePrescriptionDto {
  @ApiProperty()
  @IsUUID()
  projectId: string;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  systemId?: string;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  roomId?: string;

  @ApiProperty()
  @IsString()
  title: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ enum: prescription_status })
  @IsEnum(prescription_status)
  @IsOptional()
  status?: prescription_status;

  @ApiPropertyOptional({ enum: prescription_priority })
  @IsEnum(prescription_priority)
  @IsOptional()
  priority?: prescription_priority;

  @ApiPropertyOptional()
  @IsOptional()
  actions?: any;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  createdBy?: string;
}
