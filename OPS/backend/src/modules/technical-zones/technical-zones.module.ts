import { Module } from '@nestjs/common';
import { TechnicalZonesController } from './technical-zones.controller';
import { TechnicalZonesService } from './technical-zones.service';
import { PrismaService } from '../../shared/prisma/prisma.service';

@Module({
  controllers: [TechnicalZonesController],
  providers: [TechnicalZonesService, PrismaService],
})
export class TechnicalZonesModule {}
