import { Controller, Get, Post, Patch, Delete, Body, Param, Query, ParseUUIDPipe, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { SubsystemsService } from './subsystems.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Subsystems')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('subsystems')
export class SubsystemsController {
  constructor(private readonly subsystemsService: SubsystemsService) {}

  @Post()
  @Roles('admin', 'engineer')
  @ApiOperation({ summary: 'Create subsystem' })
  async create(@Body() data: any) {
    return this.subsystemsService.create(data);
  }

  @Get()
  @ApiOperation({ summary: 'Get all subsystems' })
  @ApiQuery({ name: 'systemId', required: false })
  async findAll(@Query('systemId') systemId?: string) {
    return this.subsystemsService.findAll(systemId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get subsystem by ID' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.subsystemsService.findOne(id);
  }

  @Patch(':id')
  @Roles('admin', 'engineer')
  @ApiOperation({ summary: 'Update subsystem' })
  async update(@Param('id', ParseUUIDPipe) id: string, @Body() data: any) {
    return this.subsystemsService.update(id, data);
  }

  @Delete(':id')
  @Roles('admin')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete subsystem' })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.subsystemsService.remove(id);
  }
}
