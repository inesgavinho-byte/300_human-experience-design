import { Module } from '@nestjs/common';
import { EngineeringEngineController } from './engineering-engine.controller';
import { EngineeringEngineService } from './engineering-engine.service';
import { PrismaService } from '../../shared/prisma/prisma.service';

@Module({
  controllers: [EngineeringEngineController],
  providers: [EngineeringEngineService, PrismaService],
})
export class EngineeringEngineModule {}
