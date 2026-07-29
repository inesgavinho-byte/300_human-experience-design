import { Module } from '@nestjs/common';
import { SystemsController } from './systems.controller';
import { SystemsService } from './systems.service';
import { PrismaService } from '../../shared/prisma/prisma.service';

@Module({
  controllers: [SystemsController],
  providers: [SystemsService, PrismaService],
})
export class SystemsModule {}
