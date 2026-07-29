import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class EngineeringRuleResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiProperty()
  ruleType: string;

  @ApiPropertyOptional()
  condition?: any;

  @ApiPropertyOptional()
  action?: any;

  @ApiProperty()
  priority: number;

  @ApiProperty()
  isActive: boolean;

  @ApiPropertyOptional()
  lastTested?: string;

  @ApiPropertyOptional()
  testResults?: any;

  @ApiProperty()
  createdAt: string;

  @ApiProperty()
  updatedAt: string;
}
