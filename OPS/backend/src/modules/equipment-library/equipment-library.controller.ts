import { Controller, Get, Post, Patch, Delete, Body, Param, Query, ParseUUIDPipe, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { EquipmentLibraryService } from './equipment-library.service';
import { CreateEquipmentLibraryDto } from './dto/create-equipment-library.dto';
import { UpdateEquipmentLibraryDto } from './dto/update-equipment-library.dto';
import { EquipmentLibraryResponseDto } from './dto/equipment-library-response.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Equipment Library')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('equipment-library')
export class EquipmentLibraryController {
  constructor(private readonly equipmentLibraryService: EquipmentLibraryService) {}

  @Post()
  @Roles('admin')
  @ApiOperation({ summary: 'Create equipment library entry' })
  @ApiResponse({ status: 201, type: EquipmentLibraryResponseDto })
  async create(@Body() dto: CreateEquipmentLibraryDto): Promise<EquipmentLibraryResponseDto> {
    return this.equipmentLibraryService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all equipment library entries' })
  @ApiQuery({ name: 'category', required: false })
  @ApiQuery({ name: 'isPublic', required: false })
  @ApiResponse({ status: 200, type: [EquipmentLibraryResponseDto] })
  async findAll(
    @Query('category') category?: string,
    @Query('isPublic') isPublic?: string,
  ): Promise<EquipmentLibraryResponseDto[]> {
    return this.equipmentLibraryService.findAll(category, isPublic);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get equipment library entry by ID' })
  @ApiResponse({ status: 200, type: EquipmentLibraryResponseDto })
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<EquipmentLibraryResponseDto> {
    return this.equipmentLibraryService.findOne(id);
  }

  @Patch(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Update equipment library entry' })
  @ApiResponse({ status: 200, type: EquipmentLibraryResponseDto })
  async update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateEquipmentLibraryDto): Promise<EquipmentLibraryResponseDto> {
    return this.equipmentLibraryService.update(id, dto);
  }

  @Delete(':id')
  @Roles('admin')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete equipment library entry' })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.equipmentLibraryService.remove(id);
  }
}
