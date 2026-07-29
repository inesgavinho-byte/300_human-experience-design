import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { CreateEquipmentLibraryDto } from './dto/create-equipment-library.dto';
import { UpdateEquipmentLibraryDto } from './dto/update-equipment-library.dto';
import { EquipmentLibraryResponseDto } from './dto/equipment-library-response.dto';

@Injectable()
export class EquipmentLibraryService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateEquipmentLibraryDto): Promise<EquipmentLibraryResponseDto> {
    const entry = await this.prisma.equipment_library.create({
      data: {
        name: data.name,
        category: data.category,
        manufacturer: data.manufacturer,
        model: data.model,
        description: data.description,
        specifications: data.specifications,
        datasheet_url: data.datasheetUrl,
        image_url: data.imageUrl,
        is_public: data.isPublic,
      },
    });
    return this.mapToResponse(entry);
  }

  async findAll(category?: string, isPublic?: string): Promise<EquipmentLibraryResponseDto[]> {
    const where: any = {};
    if (category) where.category = category;
    if (isPublic !== undefined) where.is_public = isPublic === 'true';
    
    const entries = await this.prisma.equipment_library.findMany({
      where,
      orderBy: { created_at: 'desc' },
    });
    return entries.map(this.mapToResponse);
  }

  async findOne(id: string): Promise<EquipmentLibraryResponseDto> {
    const entry = await this.prisma.equipment_library.findUnique({
      where: { id },
    });
    if (!entry) throw new NotFoundException(`Equipment library entry ${id} not found`);
    return this.mapToResponse(entry);
  }

  async update(id: string, data: UpdateEquipmentLibraryDto): Promise<EquipmentLibraryResponseDto> {
    await this.findOne(id);
    const entry = await this.prisma.equipment_library.update({
      where: { id },
      data: {
        name: data.name,
        category: data.category,
        manufacturer: data.manufacturer,
        model: data.model,
        description: data.description,
        specifications: data.specifications,
        datasheet_url: data.datasheetUrl,
        image_url: data.imageUrl,
        is_public: data.isPublic,
      },
    });
    return this.mapToResponse(entry);
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.prisma.equipment_library.delete({ where: { id } });
  }

  private mapToResponse(entry: any): EquipmentLibraryResponseDto {
    return {
      id: entry.id,
      name: entry.name,
      category: entry.category,
      manufacturer: entry.manufacturer,
      model: entry.model,
      description: entry.description,
      specifications: entry.specifications,
      datasheetUrl: entry.datasheet_url,
      imageUrl: entry.image_url,
      isPublic: entry.is_public,
      createdAt: entry.created_at.toISOString(),
      updatedAt: entry.updated_at.toISOString(),
    };
  }
}
