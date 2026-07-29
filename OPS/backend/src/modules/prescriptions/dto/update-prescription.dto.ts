import { IsString, IsOptional, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { prescription_status, prescription_priority } from '@prisma/client';

export class UpdatePrescriptionDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  title?: string;

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
}
