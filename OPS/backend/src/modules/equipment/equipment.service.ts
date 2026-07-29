import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';

@Injectable()
export class EquipmentService {
  constructor(private prisma: PrismaService) {}

  async create(data: any) {
    return this.prisma.equipment.create({ data });
  }

  async findAll(roomId?: string, status?: string) {
    const where: any = {};
    if (roomId) where.room_id = roomId;
    if (status) where.status = status;
    return this.prisma.equipment.findMany({ where, orderBy: { created_at: 'desc' } });
  }

  async findOne(id: string) {
    const item = await this.prisma.equipment.findUnique({ where: { id } });
    if (!item) throw new NotFoundException(`Equipment ${id} not found`);
    return item;
  }

  async update(id: string, data: any) {
    await this.findOne(id);
    return this.prisma.equipment.update({ where: { id }, data });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.equipment.delete({ where: { id } });
  }
}
