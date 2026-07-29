import { Module } from '@nestjs/common';
import { EquipmentLibraryController } from './equipment-library.controller';
import { EquipmentLibraryService } from './equipment-library.service';
import { PrismaService } from '../../shared/prisma/prisma.service';

@Module({
  controllers: [EquipmentLibraryController],
  providers: [EquipmentLibraryService, PrismaService],
})
export class EquipmentLibraryModule {}
