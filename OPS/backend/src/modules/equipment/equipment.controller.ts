import { Controller, Get, Post, Patch, Delete, Body, Param, Query, ParseUUIDPipe, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { EquipmentService } from './equipment.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Equipment')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('equipment')
export class EquipmentController {
  constructor(private readonly equipmentService: EquipmentService) {}

  @Post()
  @Roles('admin', 'engineer')
  @ApiOperation({ summary: 'Create equipment' })
  async create(@Body() data: any) {
    return this.equipmentService.create(data);
  }

  @Get()
  @ApiOperation({ summary: 'Get all equipment' })
  @ApiQuery({ name: 'roomId', required: false })
  @ApiQuery({ name: 'status', required: false })
  async findAll(
    @Query('roomId') roomId?: string,
    @Query('status') status?: string,
  ) {
    return this.equipmentService.findAll(roomId, status);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get equipment by ID' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.equipmentService.findOne(id);
  }

  @Patch(':id')
  @Roles('admin', 'engineer')
  @ApiOperation({ summary: 'Update equipment' })
  async update(@Param('id', ParseUUIDPipe) id: string, @Body() data: any) {
    return this.equipmentService.update(id, data);
  }

  @Delete(':id')
  @Roles('admin')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete equipment' })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.equipmentService.remove(id);
  }
}
