import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { ProjectResponseDto } from './dto/project-response.dto';

@Injectable()
export class ProjectsService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateProjectDto): Promise<ProjectResponseDto> {
    const project = await this.prisma.projects.create({
      data: {
        ...data,
        budget: data.budget ? String(data.budget) : undefined,
      },
      include: {
        client: true,
        responsible: true,
      },
    });
    return this.mapToResponse(project);
  }

  async findAll(params: { skip?: number; take?: number } = {}): Promise<ProjectResponseDto[]> {
    const projects = await this.prisma.projects.findMany({
      skip: params.skip,
      take: params.take,
      include: {
        client: true,
        responsible: true,
        _count: {
          select: {
            buildings: true,
            requirements: true,
          },
        },
      },
      orderBy: { created_at: 'desc' },
    });
    return projects.map(this.mapToResponse);
  }

  async findOne(id: string): Promise<ProjectResponseDto> {
    const project = await this.prisma.projects.findUnique({
      where: { id },
      include: {
        client: true,
        responsible: true,
        _count: {
          select: {
            buildings: true,
            requirements: true,
            experiences: true,
            prescriptions: true,
          },
        },
      },
    });

    if (!project) {
      throw new NotFoundException(`Project with ID ${id} not found`);
    }

    return this.mapToResponse(project);
  }

  async update(id: string, data: UpdateProjectDto): Promise<ProjectResponseDto> {
    await this.findOne(id);
    const project = await this.prisma.projects.update({
      where: { id },
      data: {
        ...data,
        budget: data.budget ? String(data.budget) : undefined,
      },
      include: {
        client: true,
        responsible: true,
      },
    });
    return this.mapToResponse(project);
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.prisma.projects.delete({ where: { id } });
  }

  async getBuildings(id: string) {
    await this.findOne(id);
    return this.prisma.buildings.findMany({
      where: { project_id: id },
      orderBy: { created_at: 'desc' },
    });
  }

  async getRequirements(id: string) {
    await this.findOne(id);
    return this.prisma.requirements.findMany({
      where: { project_id: id },
      orderBy: { created_at: 'desc' },
    });
  }

  async getExperiences(id: string) {
    await this.findOne(id);
    return this.prisma.experiences.findMany({
      where: { project_id: id },
      orderBy: { created_at: 'desc' },
    });
  }

  async getPrescriptions(id: string) {
    await this.findOne(id);
    return this.prisma.prescriptions.findMany({
      where: { project_id: id },
      orderBy: { created_at: 'desc' },
    });
  }

  private mapToResponse(project: any): ProjectResponseDto {
    return {
      id: project.id,
      name: project.name,
      description: project.description,
      clientId: project.client_id,
      clientName: project.client?.name,
      responsibleId: project.responsible_id,
      responsibleName: project.responsible?.full_name,
      startDate: project.start_date?.toISOString(),
      endDate: project.end_date?.toISOString(),
      status: project.status,
      budget: project.budget ? parseFloat(project.budget) : null,
      location: project.location,
      createdAt: project.created_at.toISOString(),
      updatedAt: project.updated_at.toISOString(),
      counts: project._count,
    };
  }
}
