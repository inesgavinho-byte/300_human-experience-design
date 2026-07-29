import { Controller, Get, Post, Patch, Delete, Body, Param, Query, ParseUUIDPipe, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { SystemsService } from './systems.service';
import { CreateSystemDto } from './dto/create-system.dto';
import { UpdateSystemDto } from './dto/update-system.dto';
import { SystemResponseDto } from './dto/system-response.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Systems')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('systems')
export class SystemsController {
  constructor(private readonly systemsService: SystemsService) {}

  @Post()
  @Roles('admin', 'engineer')
  @ApiOperation({ summary: 'Create system' })
  @ApiResponse({ status: 201, type: SystemResponseDto })
  async create(@Body() dto: CreateSystemDto): Promise<SystemResponseDto> {
    return this.systemsService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all systems' })
  @ApiQuery({ name: 'buildingId', required: false })
  @ApiQuery({ name: 'category', required: false })
  @ApiResponse({ status: 200, type: [SystemResponseDto] })
  async findAll(
    @Query('buildingId') buildingId?: string,
    @Query('category') category?: string,
  ): Promise<SystemResponseDto[]> {
    return this.systemsService.findAll(buildingId, category);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get system by ID' })
  @ApiResponse({ status: 200, type: SystemResponseDto })
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<SystemResponseDto> {
    return this.systemsService.findOne(id);
  }

  @Patch(':id')
  @Roles('admin', 'engineer')
  @ApiOperation({ summary: 'Update system' })
  @ApiResponse({ status: 200, type: SystemResponseDto })
  async update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateSystemDto): Promise<SystemResponseDto> {
    return this.systemsService.update(id, dto);
  }

  @Delete(':id')
  @Roles('admin')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete system' })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.systemsService.remove(id);
  }

  @Get(':id/subsystems')
  @ApiOperation({ summary: 'Get system subsystems' })
  async getSubsystems(@Param('id', ParseUUIDPipe) id: string) {
    return this.systemsService.getSubsystems(id);
  }
}
