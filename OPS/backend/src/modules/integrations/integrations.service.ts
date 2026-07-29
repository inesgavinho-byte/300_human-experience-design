import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';

@Injectable()
export class IntegrationsService {
  constructor(private prisma: PrismaService) {}

  async create(data: any) {
    return this.prisma.integrations.create({ data });
  }

  async findAll(type?: string, status?: string) {
    const where: any = {};
    if (type) where.type = type;
    if (status) where.status = status;
    return this.prisma.integrations.findMany({ where, orderBy: { created_at: 'desc' } });
  }

  async findOne(id: string) {
    const item = await this.prisma.integrations.findUnique({ where: { id } });
    if (!item) throw new NotFoundException(`Integration ${id} not found`);
    return item;
  }

  async update(id: string, data: any) {
    await this.findOne(id);
    return this.prisma.integrations.update({ where: { id }, data });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.integrations.delete({ where: { id } });
  }
}
