import { Controller, Get, Post, Patch, Delete, Body, Param, Query, ParseUUIDPipe, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { PrescriptionsService } from './prescriptions.service';
import { CreatePrescriptionDto } from './dto/create-prescription.dto';
import { UpdatePrescriptionDto } from './dto/update-prescription.dto';
import { PrescriptionResponseDto } from './dto/prescription-response.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Prescriptions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('prescriptions')
export class PrescriptionsController {
  constructor(private readonly prescriptionsService: PrescriptionsService) {}

  @Post()
  @Roles('admin', 'engineer')
  @ApiOperation({ summary: 'Create prescription' })
  @ApiResponse({ status: 201, type: PrescriptionResponseDto })
  async create(@Body() dto: CreatePrescriptionDto): Promise<PrescriptionResponseDto> {
    return this.prescriptionsService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all prescriptions' })
  @ApiQuery({ name: 'projectId', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiResponse({ status: 200, type: [PrescriptionResponseDto] })
  async findAll(
    @Query('projectId') projectId?: string,
    @Query('status') status?: string,
  ): Promise<PrescriptionResponseDto[]> {
    return this.prescriptionsService.findAll(projectId, status);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get prescription by ID' })
  @ApiResponse({ status: 200, type: PrescriptionResponseDto })
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<PrescriptionResponseDto> {
    return this.prescriptionsService.findOne(id);
  }

  @Patch(':id')
  @Roles('admin', 'engineer')
  @ApiOperation({ summary: 'Update prescription' })
  @ApiResponse({ status: 200, type: PrescriptionResponseDto })
  async update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdatePrescriptionDto): Promise<PrescriptionResponseDto> {
    return this.prescriptionsService.update(id, dto);
  }

  @Delete(':id')
  @Roles('admin')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete prescription' })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.prescriptionsService.remove(id);
  }

  @Post(':id/approve')
  @Roles('admin', 'engineer')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Approve prescription' })
  @ApiResponse({ status: 200, type: PrescriptionResponseDto })
  async approve(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('sub') userId: string,
  ): Promise<PrescriptionResponseDto> {
    return this.prescriptionsService.approve(id, userId);
  }

  @Post(':id/reject')
  @Roles('admin', 'engineer')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reject prescription' })
  @ApiResponse({ status: 200, type: PrescriptionResponseDto })
  async reject(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('sub') userId: string,
  ): Promise<PrescriptionResponseDto> {
    return this.prescriptionsService.reject(id, userId);
  }
}
