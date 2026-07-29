import { Module } from '@nestjs/common';
import { RequirementsController } from './requirements.controller';
import { RequirementsService } from './requirements.service';
import { PrismaService } from '../../shared/prisma/prisma.service';

@Module({
  controllers: [RequirementsController],
  providers: [RequirementsService, PrismaService],
})
export class RequirementsModule {}
