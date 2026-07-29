import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { CreateSystemDto } from './dto/create-system.dto';
import { UpdateSystemDto } from './dto/update-system.dto';
import { SystemResponseDto } from './dto/system-response.dto';

@Injectable()
export class SystemsService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateSystemDto): Promise<SystemResponseDto> {
    const sys = await this.prisma.systems.create({
      data: {
        building_id: data.buildingId,
        name: data.name,
        category: data.category,
        description: data.description,
        status: data.status,
      },
      include: { building: { include: { project: true } } },
    });
    return this.mapToResponse(sys);
  }

  async findAll(buildingId?: string, category?: string): Promise<SystemResponseDto[]> {
    const where: any = {};
    if (buildingId) where.building_id = buildingId;
    if (category) where.category = category;
    
    const systems = await this.prisma.systems.findMany({
      where,
      include: { building: true, _count: { select: { subsystems: true } } },
      orderBy: { created_at: 'desc' },
    });
    return systems.map(this.mapToResponse);
  }

  async findOne(id: string): Promise<SystemResponseDto> {
    const sys = await this.prisma.systems.findUnique({
      where: { id },
      include: { building: true, _count: { select: { subsystems: true } } },
    });
    if (!sys) throw new NotFoundException(`System ${id} not found`);
    return this.mapToResponse(sys);
  }

  async update(id: string, data: UpdateSystemDto): Promise<SystemResponseDto> {
    await this.findOne(id);
    const sys = await this.prisma.systems.update({
      where: { id },
      data: {
        name: data.name,
        category: data.category,
        description: data.description,
        status: data.status,
      },
      include: { building: true },
    });
    return this.mapToResponse(sys);
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.prisma.systems.delete({ where: { id } });
  }

  async getSubsystems(id: string) {
    await this.findOne(id);
    return this.prisma.subsystems.findMany({ where: { system_id: id }, orderBy: { created_at: 'desc' } });
  }

  private mapToResponse(sys: any): SystemResponseDto {
    return {
      id: sys.id,
      buildingId: sys.building_id,
      buildingName: sys.building?.name,
      name: sys.name,
      category: sys.category,
      description: sys.description,
      status: sys.status,
      createdAt: sys.created_at.toISOString(),
      updatedAt: sys.updated_at.toISOString(),
      counts: sys._count,
    };
  }
}
