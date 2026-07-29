import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';

@Injectable()
export class AiService {
  constructor(private prisma: PrismaService) {}

  // AI Servers
  async createServer(data: any) {
    return this.prisma.ai_local_servers.create({ data });
  }

  async findAllServers() {
    return this.prisma.ai_local_servers.findMany({ orderBy: { created_at: 'desc' } });
  }

  async findOneServer(id: string) {
    const item = await this.prisma.ai_local_servers.findUnique({ where: { id } });
    if (!item) throw new NotFoundException(`AI server ${id} not found`);
    return item;
  }

  // AI Patterns
  async createPattern(data: any) {
    return this.prisma.ai_learned_patterns.create({ data });
  }

  async findAllPatterns(serverId?: string) {
    const where = serverId ? { server_id: serverId } : {};
    return this.prisma.ai_learned_patterns.findMany({ where, orderBy: { created_at: 'desc' } });
  }

  async findOnePattern(id: string) {
    const item = await this.prisma.ai_learned_patterns.findUnique({ where: { id } });
    if (!item) throw new NotFoundException(`AI pattern ${id} not found`);
    return item;
  }
}
