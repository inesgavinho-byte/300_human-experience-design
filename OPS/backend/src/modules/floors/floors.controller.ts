import { Controller, Get, Post, Patch, Delete, Body, Param, Query, ParseUUIDPipe, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { FloorsService } from './floors.service';
import { CreateFloorDto } from './dto/create-floor.dto';
import { UpdateFloorDto } from './dto/update-floor.dto';
import { FloorResponseDto } from './dto/floor-response.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Floors')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('floors')
export class FloorsController {
  constructor(private readonly floorsService: FloorsService) {}

  @Post()
  @Roles('admin', 'engineer')
  @ApiOperation({ summary: 'Create floor' })
  @ApiResponse({ status: 201, type: FloorResponseDto })
  async create(@Body() dto: CreateFloorDto): Promise<FloorResponseDto> {
    return this.floorsService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all floors' })
  @ApiQuery({ name: 'buildingId', required: false })
  @ApiResponse({ status: 200, type: [FloorResponseDto] })
  async findAll(@Query('buildingId') buildingId?: string): Promise<FloorResponseDto[]> {
    return this.floorsService.findAll(buildingId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get floor by ID' })
  @ApiResponse({ status: 200, type: FloorResponseDto })
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<FloorResponseDto> {
    return this.floorsService.findOne(id);
  }

  @Patch(':id')
  @Roles('admin', 'engineer')
  @ApiOperation({ summary: 'Update floor' })
  @ApiResponse({ status: 200, type: FloorResponseDto })
  async update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateFloorDto): Promise<FloorResponseDto> {
    return this.floorsService.update(id, dto);
  }

  @Delete(':id')
  @Roles('admin')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete floor' })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.floorsService.remove(id);
  }

  @Get(':id/rooms')
  @ApiOperation({ summary: 'Get floor rooms' })
  async getRooms(@Param('id', ParseUUIDPipe) id: string) {
    return this.floorsService.getRooms(id);
  }
}
