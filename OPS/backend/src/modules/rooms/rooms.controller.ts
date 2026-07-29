import { Controller, Get, Post, Patch, Delete, Body, Param, Query, ParseUUIDPipe, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { RoomsService } from './rooms.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { RoomResponseDto } from './dto/room-response.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Rooms')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('rooms')
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) {}

  @Post()
  @Roles('admin', 'engineer')
  @ApiOperation({ summary: 'Create room' })
  @ApiResponse({ status: 201, type: RoomResponseDto })
  async create(@Body() dto: CreateRoomDto): Promise<RoomResponseDto> {
    return this.roomsService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all rooms' })
  @ApiQuery({ name: 'floorId', required: false })
  @ApiQuery({ name: 'detectionState', required: false })
  @ApiResponse({ status: 200, type: [RoomResponseDto] })
  async findAll(
    @Query('floorId') floorId?: string,
    @Query('detectionState') detectionState?: string,
  ): Promise<RoomResponseDto[]> {
    return this.roomsService.findAll(floorId, detectionState);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get room by ID' })
  @ApiResponse({ status: 200, type: RoomResponseDto })
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<RoomResponseDto> {
    return this.roomsService.findOne(id);
  }

  @Patch(':id')
  @Roles('admin', 'engineer')
  @ApiOperation({ summary: 'Update room' })
  @ApiResponse({ status: 200, type: RoomResponseDto })
  async update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateRoomDto): Promise<RoomResponseDto> {
    return this.roomsService.update(id, dto);
  }

  @Delete(':id')
  @Roles('admin')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete room' })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.roomsService.remove(id);
  }

  @Get(':id/equipment')
  @ApiOperation({ summary: 'Get room equipment' })
  async getEquipment(@Param('id', ParseUUIDPipe) id: string) {
    return this.roomsService.getEquipment(id);
  }

  @Get(':id/requirements')
  @ApiOperation({ summary: 'Get room requirements' })
  async getRequirements(@Param('id', ParseUUIDPipe) id: string) {
    return this.roomsService.getRequirements(id);
  }
}
