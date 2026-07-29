import { Controller, Get, Post, Patch, Delete, Body, Param, Query, ParseUUIDPipe, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { EngineeringEngineService } from './engineering-engine.service';
import { CreateEngineeringRuleDto } from './dto/create-engineering-rule.dto';
import { UpdateEngineeringRuleDto } from './dto/update-engineering-rule.dto';
import { EngineeringRuleResponseDto } from './dto/engineering-rule-response.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Engineering Rules')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('engineering-rules')
export class EngineeringEngineController {
  constructor(private readonly engineeringEngineService: EngineeringEngineService) {}

  @Post()
  @Roles('admin', 'engineer')
  @ApiOperation({ summary: 'Create engineering rule' })
  @ApiResponse({ status: 201, type: EngineeringRuleResponseDto })
  async create(@Body() dto: CreateEngineeringRuleDto): Promise<EngineeringRuleResponseDto> {
    return this.engineeringEngineService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all engineering rules' })
  @ApiQuery({ name: 'ruleType', required: false })
  @ApiQuery({ name: 'isActive', required: false })
  @ApiResponse({ status: 200, type: [EngineeringRuleResponseDto] })
  async findAll(
    @Query('ruleType') ruleType?: string,
    @Query('isActive') isActive?: string,
  ): Promise<EngineeringRuleResponseDto[]> {
    return this.engineeringEngineService.findAll(ruleType, isActive);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get engineering rule by ID' })
  @ApiResponse({ status: 200, type: EngineeringRuleResponseDto })
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<EngineeringRuleResponseDto> {
    return this.engineeringEngineService.findOne(id);
  }

  @Patch(':id')
  @Roles('admin', 'engineer')
  @ApiOperation({ summary: 'Update engineering rule' })
  @ApiResponse({ status: 200, type: EngineeringRuleResponseDto })
  async update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateEngineeringRuleDto): Promise<EngineeringRuleResponseDto> {
    return this.engineeringEngineService.update(id, dto);
  }

  @Delete(':id')
  @Roles('admin')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete engineering rule' })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.engineeringEngineService.remove(id);
  }

  @Post(':id/test')
  @Roles('admin', 'engineer')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Test engineering rule' })
  @ApiResponse({ status: 200, type: EngineeringRuleResponseDto })
  async test(@Param('id', ParseUUIDPipe) id: string): Promise<EngineeringRuleResponseDto> {
    return this.engineeringEngineService.test(id);
  }
}
