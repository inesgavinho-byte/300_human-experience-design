import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { CreateExperienceDto } from './dto/create-experience.dto';
import { UpdateExperienceDto } from './dto/update-experience.dto';
import { ExperienceResponseDto } from './dto/experience-response.dto';

@Injectable()
export class ExperiencesService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateExperienceDto): Promise<ExperienceResponseDto> {
    const exp = await this.prisma.experiences.create({
      data: {
        project_id: data.projectId,
        name: data.name,
        description: data.description,
        actions: data.actions,
        triggers: data.triggers,
        created_by: data.createdBy,
      },
      include: { project: true, author: true },
    });
    return this.mapToResponse(exp);
  }

  async findAll(projectId?: string): Promise<ExperienceResponseDto[]> {
    const where = projectId ? { project_id: projectId } : {};
    const exps = await this.prisma.experiences.findMany({
      where,
      include: { project: true, author: true },
      orderBy: { created_at: 'desc' },
    });
    return exps.map(this.mapToResponse);
  }

  async findOne(id: string): Promise<ExperienceResponseDto> {
    const exp = await this.prisma.experiences.findUnique({
      where: { id },
      include: { project: true, author: true },
    });
    if (!exp) throw new NotFoundException(`Experience ${id} not found`);
    return this.mapToResponse(exp);
  }

  async update(id: string, data: UpdateExperienceDto): Promise<ExperienceResponseDto> {
    await this.findOne(id);
    const exp = await this.prisma.experiences.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        actions: data.actions,
        triggers: data.triggers,
      },
      include: { project: true, author: true },
    });
    return this.mapToResponse(exp);
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.prisma.experiences.delete({ where: { id } });
  }

  private mapToResponse(exp: any): ExperienceResponseDto {
    return {
      id: exp.id,
      projectId: exp.project_id,
      projectName: exp.project?.name,
      name: exp.name,
      description: exp.description,
      actions: exp.actions,
      triggers: exp.triggers,
      createdBy: exp.created_by,
      authorName: exp.author?.full_name,
      createdAt: exp.created_at.toISOString(),
      updatedAt: exp.updated_at.toISOString(),
    };
  }
}
