import {
  Controller, Get, Post, Patch, Delete, Body, Param, Query,
  ParseUUIDPipe, HttpCode, HttpStatus, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { BuildingsService } from './buildings.service';
import { CreateBuildingDto } from './dto/create-building.dto';
import { UpdateBuildingDto } from './dto/update-building.dto';
import { BuildingResponseDto } from './dto/building-response.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Buildings')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('buildings')
export class BuildingsController {
  constructor(private readonly buildingsService: BuildingsService) {}

  @Post()
  @Roles('admin', 'engineer')
  @ApiOperation({ summary: 'Create building' })
  @ApiResponse({ status: 201, type: BuildingResponseDto })
  async create(@Body() dto: CreateBuildingDto): Promise<BuildingResponseDto> {
    return this.buildingsService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all buildings' })
  @ApiQuery({ name: 'projectId', required: false })
  @ApiResponse({ status: 200, type: [BuildingResponseDto] })
  async findAll(@Query('projectId') projectId?: string): Promise<BuildingResponseDto[]> {
    return this.buildingsService.findAll(projectId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get building by ID' })
  @ApiResponse({ status: 200, type: BuildingResponseDto })
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<BuildingResponseDto> {
    return this.buildingsService.findOne(id);
  }

  @Patch(':id')
  @Roles('admin', 'engineer')
  @ApiOperation({ summary: 'Update building' })
  @ApiResponse({ status: 200, type: BuildingResponseDto })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateBuildingDto,
  ): Promise<BuildingResponseDto> {
    return this.buildingsService.update(id, dto);
  }

  @Delete(':id')
  @Roles('admin')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete building' })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.buildingsService.remove(id);
  }

  @Get(':id/floors')
  @ApiOperation({ summary: 'Get building floors' })
  async getFloors(@Param('id', ParseUUIDPipe) id: string) {
    return this.buildingsService.getFloors(id);
  }

  @Get(':id/systems')
  @ApiOperation({ summary: 'Get building systems' })
  async getSystems(@Param('id', ParseUUIDPipe) id: string) {
    return this.buildingsService.getSystems(id);
  }
}
