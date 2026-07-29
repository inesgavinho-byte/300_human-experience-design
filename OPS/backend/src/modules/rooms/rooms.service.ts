import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { RoomResponseDto } from './dto/room-response.dto';

@Injectable()
export class RoomsService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateRoomDto): Promise<RoomResponseDto> {
    const room = await this.prisma.rooms.create({
      data: {
        floor_id: data.floorId,
        name: data.name,
        number: data.number,
        description: data.description,
        area: data.area ? String(data.area) : undefined,
        capacity: data.capacity,
        purpose: data.purpose,
        detection_state: data.detectionState,
        layout: data.layout,
      },
      include: { floor: { include: { building: true } } },
    });
    return this.mapToResponse(room);
  }

  async findAll(floorId?: string, detectionState?: string): Promise<RoomResponseDto[]> {
    const where: any = {};
    if (floorId) where.floor_id = floorId;
    if (detectionState) where.detection_state = detectionState;
    
    const rooms = await this.prisma.rooms.findMany({
      where,
      include: { floor: { include: { building: true } }, _count: { select: { equipment: true } } },
      orderBy: { created_at: 'desc' },
    });
    return rooms.map(this.mapToResponse);
  }

  async findOne(id: string): Promise<RoomResponseDto> {
    const room = await this.prisma.rooms.findUnique({
      where: { id },
      include: { floor: { include: { building: true } }, _count: { select: { equipment: true, requirements: true } } },
    });
    if (!room) throw new NotFoundException(`Room ${id} not found`);
    return this.mapToResponse(room);
  }

  async update(id: string, data: UpdateRoomDto): Promise<RoomResponseDto> {
    await this.findOne(id);
    const room = await this.prisma.rooms.update({
      where: { id },
      data: {
        name: data.name,
        number: data.number,
        description: data.description,
        area: data.area ? String(data.area) : undefined,
        capacity: data.capacity,
        purpose: data.purpose,
        detection_state: data.detectionState,
        layout: data.layout,
      },
      include: { floor: { include: { building: true } } },
    });
    return this.mapToResponse(room);
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.prisma.rooms.delete({ where: { id } });
  }

  async getEquipment(id: string) {
    await this.findOne(id);
    return this.prisma.equipment.findMany({ where: { room_id: id }, orderBy: { created_at: 'desc' } });
  }

  async getRequirements(id: string) {
    await this.findOne(id);
    return this.prisma.requirements.findMany({ where: { room_id: id }, orderBy: { created_at: 'desc' } });
  }

  private mapToResponse(room: any): RoomResponseDto {
    return {
      id: room.id,
      floorId: room.floor_id,
      floorName: room.floor?.name,
      buildingName: room.floor?.building?.name,
      name: room.name,
      number: room.number,
      description: room.description,
      area: room.area ? parseFloat(room.area) : null,
      capacity: room.capacity,
      purpose: room.purpose,
      detectionState: room.detection_state,
      layout: room.layout,
      createdAt: room.created_at.toISOString(),
      updatedAt: room.updated_at.toISOString(),
      counts: room._count,
    };
  }
}
