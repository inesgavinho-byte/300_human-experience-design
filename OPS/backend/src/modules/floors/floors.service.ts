import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { CreateFloorDto } from './dto/create-floor.dto';
import { UpdateFloorDto } from './dto/update-floor.dto';
import { FloorResponseDto } from './dto/floor-response.dto';

@Injectable()
export class FloorsService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateFloorDto): Promise<FloorResponseDto> {
    const floor = await this.prisma.floors.create({
      data: {
        building_id: data.buildingId,
        name: data.name,
        number: data.number,
        description: data.description,
        total_area: data.totalArea ? String(data.totalArea) : undefined,
        floor_plan: data.floorPlan,
      },
      include: { building: { include: { project: true } } },
    });
    return this.mapToResponse(floor);
  }

  async findAll(buildingId?: string): Promise<FloorResponseDto[]> {
    const where = buildingId ? { building_id: buildingId } : {};
    const floors = await this.prisma.floors.findMany({
      where,
      include: { building: true, _count: { select: { rooms: true } } },
      orderBy: { number: 'asc' },
    });
    return floors.map(this.mapToResponse);
  }

  async findOne(id: string): Promise<FloorResponseDto> {
    const floor = await this.prisma.floors.findUnique({
      where: { id },
      include: { building: true, _count: { select: { rooms: true } } },
    });
    if (!floor) throw new NotFoundException(`Floor ${id} not found`);
    return this.mapToResponse(floor);
  }

  async update(id: string, data: UpdateFloorDto): Promise<FloorResponseDto> {
    await this.findOne(id);
    const floor = await this.prisma.floors.update({
      where: { id },
      data: {
        name: data.name,
        number: data.number,
        description: data.description,
        total_area: data.totalArea ? String(data.totalArea) : undefined,
        floor_plan: data.floorPlan,
      },
      include: { building: true },
    });
    return this.mapToResponse(floor);
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.prisma.floors.delete({ where: { id } });
  }

  async getRooms(id: string) {
    await this.findOne(id);
    return this.prisma.rooms.findMany({ where: { floor_id: id }, orderBy: { created_at: 'desc' } });
  }

  private mapToResponse(floor: any): FloorResponseDto {
    return {
      id: floor.id,
      buildingId: floor.building_id,
      buildingName: floor.building?.name,
      name: floor.name,
      number: floor.number,
      description: floor.description,
      totalArea: floor.total_area ? parseFloat(floor.total_area) : null,
      floorPlan: floor.floor_plan,
      createdAt: floor.created_at.toISOString(),
      updatedAt: floor.updated_at.toISOString(),
      counts: floor._count,
    };
  }
}
