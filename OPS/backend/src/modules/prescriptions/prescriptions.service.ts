import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { CreatePrescriptionDto } from './dto/create-prescription.dto';
import { UpdatePrescriptionDto } from './dto/update-prescription.dto';
import { PrescriptionResponseDto } from './dto/prescription-response.dto';
import { prescription_status } from '@prisma/client';

@Injectable()
export class PrescriptionsService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreatePrescriptionDto): Promise<PrescriptionResponseDto> {
    const prescription = await this.prisma.prescriptions.create({
      data: {
        project_id: data.projectId,
        system_id: data.systemId,
        room_id: data.roomId,
        title: data.title,
        description: data.description,
        status: data.status || prescription_status.DRAFT,
        priority: data.priority,
        actions: data.actions,
        created_by: data.createdBy,
      },
      include: { project: true, system: true, room: true, author: true },
    });
    return this.mapToResponse(prescription);
  }

  async findAll(projectId?: string, status?: string): Promise<PrescriptionResponseDto[]> {
    const where: any = {};
    if (projectId) where.project_id = projectId;
    if (status) where.status = status;
    
    const prescriptions = await this.prisma.prescriptions.findMany({
      where,
      include: { project: true, system: true, room: true, author: true },
      orderBy: { created_at: 'desc' },
    });
    return prescriptions.map(this.mapToResponse);
  }

  async findOne(id: string): Promise<PrescriptionResponseDto> {
    const prescription = await this.prisma.prescriptions.findUnique({
      where: { id },
      include: { project: true, system: true, room: true, author: true },
    });
    if (!prescription) throw new NotFoundException(`Prescription ${id} not found`);
    return this.mapToResponse(prescription);
  }

  async update(id: string, data: UpdatePrescriptionDto): Promise<PrescriptionResponseDto> {
    await this.findOne(id);
    const prescription = await this.prisma.prescriptions.update({
      where: { id },
      data: {
        title: data.title,
        description: data.description,
        status: data.status,
        priority: data.priority,
        actions: data.actions,
      },
      include: { project: true, system: true, room: true, author: true },
    });
    return this.mapToResponse(prescription);
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.prisma.prescriptions.delete({ where: { id } });
  }

  async approve(id: string, userId: string): Promise<PrescriptionResponseDto> {
    const prescription = await this.findOne(id);
    if (prescription.status === prescription_status.APPROVED) {
      throw new BadRequestException('Prescription already approved');
    }
    const updated = await this.prisma.prescriptions.update({
      where: { id },
      data: {
        status: prescription_status.APPROVED,
        approved_by: userId,
        approved_at: new Date(),
      },
      include: { project: true, system: true, room: true, author: true },
    });
    return this.mapToResponse(updated);
  }

  async reject(id: string, userId: string): Promise<PrescriptionResponseDto> {
    const prescription = await this.findOne(id);
    if (prescription.status === prescription_status.REJECTED) {
      throw new BadRequestException('Prescription already rejected');
    }
    const updated = await this.prisma.prescriptions.update({
      where: { id },
      data: {
        status: prescription_status.REJECTED,
        approved_by: userId,
        approved_at: new Date(),
      },
      include: { project: true, system: true, room: true, author: true },
    });
    return this.mapToResponse(updated);
  }

  private mapToResponse(prescription: any): PrescriptionResponseDto {
    return {
      id: prescription.id,
      projectId: prescription.project_id,
      projectName: prescription.project?.name,
      systemId: prescription.system_id,
      systemName: prescription.system?.name,
      roomId: prescription.room_id,
      roomName: prescription.room?.name,
      title: prescription.title,
      description: prescription.description,
      status: prescription.status,
      priority: prescription.priority,
      actions: prescription.actions,
      approvedBy: prescription.approved_by,
      approvedAt: prescription.approved_at?.toISOString(),
      createdBy: prescription.created_by,
      authorName: prescription.author?.full_name,
      createdAt: prescription.created_at.toISOString(),
      updatedAt: prescription.updated_at.toISOString(),
    };
  }
}
