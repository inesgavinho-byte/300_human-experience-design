import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { CreateRequirementDto } from './dto/create-requirement.dto';
import { UpdateRequirementDto } from './dto/update-requirement.dto';
import { RequirementResponseDto } from './dto/requirement-response.dto';

@Injectable()
export class RequirementsService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateRequirementDto): Promise<RequirementResponseDto> {
    const req = await this.prisma.requirements.create({
      data: {
        project_id: data.projectId,
        room_id: data.roomId,
        category: data.category,
        title: data.title,
        description: data.description,
        priority: data.priority,
        actions: data.actions,
        source: data.source,
        created_by: data.createdBy,
      },
      include: { project: true, room: true, author: true },
    });
    return this.mapToResponse(req);
  }

  async findAll(projectId?: string, category?: string): Promise<RequirementResponseDto[]> {
    const where: any = {};
    if (projectId) where.project_id = projectId;
    if (category) where.category = category;
    
    const reqs = await this.prisma.requirements.findMany({
      where,
      include: { project: true, room: true, author: true },
      orderBy: { created_at: 'desc' },
    });
    return reqs.map(this.mapToResponse);
  }

  async findOne(id: string): Promise<RequirementResponseDto> {
    const req = await this.prisma.requirements.findUnique({
      where: { id },
      include: { project: true, room: true, author: true },
    });
    if (!req) throw new NotFoundException(`Requirement ${id} not found`);
    return this.mapToResponse(req);
  }

  async update(id: string, data: UpdateRequirementDto): Promise<RequirementResponseDto> {
    await this.findOne(id);
    const req = await this.prisma.requirements.update({
      where: { id },
      data: {
        category: data.category,
        title: data.title,
        description: data.description,
        priority: data.priority,
        actions: data.actions,
        source: data.source,
      },
      include: { project: true, room: true, author: true },
    });
    return this.mapToResponse(req);
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.prisma.requirements.delete({ where: { id } });
  }

  private mapToResponse(req: any): RequirementResponseDto {
    return {
      id: req.id,
      projectId: req.project_id,
      projectName: req.project?.name,
      roomId: req.room_id,
      roomName: req.room?.name,
      category: req.category,
      title: req.title,
      description: req.description,
      priority: req.priority,
      actions: req.actions,
      source: req.source,
      createdBy: req.created_by,
      authorName: req.author?.full_name,
      createdAt: req.created_at.toISOString(),
      updatedAt: req.updated_at.toISOString(),
    };
  }
}
