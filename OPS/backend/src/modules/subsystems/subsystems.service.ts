import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';

@Injectable()
export class SubsystemsService {
  constructor(private prisma: PrismaService) {}

  async create(data: any) {
    return this.prisma.subsystems.create({ data });
  }

  async findAll(systemId?: string) {
    const where = systemId ? { system_id: systemId } : {};
    return this.prisma.subsystems.findMany({ where, orderBy: { created_at: 'desc' } });
  }

  async findOne(id: string) {
    const item = await this.prisma.subsystems.findUnique({ where: { id } });
    if (!item) throw new NotFoundException(`Subsystem ${id} not found`);
    return item;
  }

  async update(id: string, data: any) {
    await this.findOne(id);
    return this.prisma.subsystems.update({ where: { id }, data });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.subsystems.delete({ where: { id } });
  }
}
