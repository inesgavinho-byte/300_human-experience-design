import { Controller, Get, Post, Patch, Delete, Body, Param, Query, ParseUUIDPipe, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { IntegrationsService } from './integrations.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Integrations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('integrations')
export class IntegrationsController {
  constructor(private readonly integrationsService: IntegrationsService) {}

  @Post()
  @Roles('admin', 'engineer')
  @ApiOperation({ summary: 'Create integration' })
  async create(@Body() data: any) {
    return this.integrationsService.create(data);
  }

  @Get()
  @ApiOperation({ summary: 'Get all integrations' })
  @ApiQuery({ name: 'type', required: false })
  @ApiQuery({ name: 'status', required: false })
  async findAll(
    @Query('type') type?: string,
    @Query('status') status?: string,
  ) {
    return this.integrationsService.findAll(type, status);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get integration by ID' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.integrationsService.findOne(id);
  }

  @Patch(':id')
  @Roles('admin', 'engineer')
  @ApiOperation({ summary: 'Update integration' })
  async update(@Param('id', ParseUUIDPipe) id: string, @Body() data: any) {
    return this.integrationsService.update(id, data);
  }

  @Delete(':id')
  @Roles('admin')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete integration' })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.integrationsService.remove(id);
  }
}
