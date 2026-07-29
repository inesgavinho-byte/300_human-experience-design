import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { CreateBuildingDto } from './dto/create-building.dto';
import { UpdateBuildingDto } from './dto/update-building.dto';
import { BuildingResponseDto } from './dto/building-response.dto';

@Injectable()
export class BuildingsService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateBuildingDto): Promise<BuildingResponseDto> {
    const building = await this.prisma.buildings.create({
      data: {
        project_id: data.projectId,
        name: data.name,
        description: data.description,
        type: data.type,
        address: data.address,
        floors_count: data.floorsCount,
        total_area: data.totalArea ? String(data.totalArea) : undefined,
        location: data.location,
        solution_level: data.solutionLevel,
        detection_state: data.detectionState,
      },
      include: { project: true },
    });
    return this.mapToResponse(building);
  }

  async findAll(projectId?: string): Promise<BuildingResponseDto[]> {
    const where = projectId ? { project_id: projectId } : {};
    const buildings = await this.prisma.buildings.findMany({
      where,
      include: { project: true, _count: { select: { floors: true, systems: true } } },
      orderBy: { created_at: 'desc' },
    });
    return buildings.map(this.mapToResponse);
  }

  async findOne(id: string): Promise<BuildingResponseDto> {
    const building = await this.prisma.buildings.findUnique({
      where: { id },
      include: { project: true, _count: { select: { floors: true, systems: true } } },
    });
    if (!building) throw new NotFoundException(`Building ${id} not found`);
    return this.mapToResponse(building);
  }

  async update(id: string, data: UpdateBuildingDto): Promise<BuildingResponseDto> {
    await this.findOne(id);
    const building = await this.prisma.buildings.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        type: data.type,
        address: data.address,
        floors_count: data.floorsCount,
        total_area: data.totalArea ? String(data.totalArea) : undefined,
        location: data.location,
        solution_level: data.solutionLevel,
        detection_state: data.detectionState,
      },
      include: { project: true },
    });
    return this.mapToResponse(building);
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.prisma.buildings.delete({ where: { id } });
  }

  async getFloors(id: string) {
    await this.findOne(id);
    return this.prisma.floors.findMany({ where: { building_id: id }, orderBy: { number: 'asc' } });
  }

  async getSystems(id: string) {
    await this.findOne(id);
    return this.prisma.systems.findMany({ where: { building_id: id }, orderBy: { created_at: 'desc' } });
  }

  private mapToResponse(building: any): BuildingResponseDto {
    return {
      id: building.id,
      projectId: building.project_id,
      projectName: building.project?.name,
      name: building.name,
      description: building.description,
      type: building.type,
      address: building.address,
      floorsCount: building.floors_count,
      totalArea: building.total_area ? parseFloat(building.total_area) : null,
      location: building.location,
      solutionLevel: building.solution_level,
      detectionState: building.detection_state,
      createdAt: building.created_at.toISOString(),
      updatedAt: building.updated_at.toISOString(),
      counts: building._count,
    };
  }
}
