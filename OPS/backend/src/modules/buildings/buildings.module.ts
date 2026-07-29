import { Module } from '@nestjs/common';
import { BuildingsController } from './buildings.controller';
import { BuildingsService } from './buildings.service';
import { PrismaService } from '../../shared/prisma/prisma.service';

@Module({
  controllers: [BuildingsController],
  providers: [BuildingsService, PrismaService],
})
export class BuildingsModule {}
