import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';

@Injectable()
export class TechnicalZonesService {
  constructor(private prisma: PrismaService) {}

  async create(data: any) {
    return this.prisma.technical_zones.create({ data });
  }

  async findAll(buildingId?: string) {
    const where = buildingId ? { building_id: buildingId } : {};
    return this.prisma.technical_zones.findMany({ where, orderBy: { created_at: 'desc' } });
  }

  async findOne(id: string) {
    const item = await this.prisma.technical_zones.findUnique({ where: { id } });
    if (!item) throw new NotFoundException(`Technical zone ${id} not found`);
    return item;
  }

  async update(id: string, data: any) {
    await this.findOne(id);
    return this.prisma.technical_zones.update({ where: { id }, data });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.technical_zones.delete({ where: { id } });
  }
}
