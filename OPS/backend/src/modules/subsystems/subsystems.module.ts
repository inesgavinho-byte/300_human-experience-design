import { Module } from '@nestjs/common';
import { SubsystemsController } from './subsystems.controller';
import { SubsystemsService } from './subsystems.service';
import { PrismaService } from '../../shared/prisma/prisma.service';

@Module({
  controllers: [SubsystemsController],
  providers: [SubsystemsService, PrismaService],
})
export class SubsystemsModule {}
