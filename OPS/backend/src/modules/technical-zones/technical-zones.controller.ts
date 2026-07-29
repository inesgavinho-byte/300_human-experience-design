import { Controller, Get, Post, Patch, Delete, Body, Param, Query, ParseUUIDPipe, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { TechnicalZonesService } from './technical-zones.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Technical Zones')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('technical-zones')
export class TechnicalZonesController {
  constructor(private readonly technicalZonesService: TechnicalZonesService) {}

  @Post()
  @Roles('admin', 'engineer')
  @ApiOperation({ summary: 'Create technical zone' })
  async create(@Body() data: any) {
    return this.technicalZonesService.create(data);
  }

  @Get()
  @ApiOperation({ summary: 'Get all technical zones' })
  @ApiQuery({ name: 'buildingId', required: false })
  async findAll(@Query('buildingId') buildingId?: string) {
    return this.technicalZonesService.findAll(buildingId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get technical zone by ID' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.technicalZonesService.findOne(id);
  }

  @Patch(':id')
  @Roles('admin', 'engineer')
  @ApiOperation({ summary: 'Update technical zone' })
  async update(@Param('id', ParseUUIDPipe) id: string, @Body() data: any) {
    return this.technicalZonesService.update(id, data);
  }

  @Delete(':id')
  @Roles('admin')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete technical zone' })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.technicalZonesService.remove(id);
  }
}
