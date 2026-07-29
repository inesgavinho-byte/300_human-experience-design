import { Controller, Get, Post, Patch, Delete, Body, Param, Query, ParseUUIDPipe, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { RequirementsService } from './requirements.service';
import { CreateRequirementDto } from './dto/create-requirement.dto';
import { UpdateRequirementDto } from './dto/update-requirement.dto';
import { RequirementResponseDto } from './dto/requirement-response.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Requirements')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('requirements')
export class RequirementsController {
  constructor(private readonly requirementsService: RequirementsService) {}

  @Post()
  @Roles('admin', 'engineer')
  @ApiOperation({ summary: 'Create requirement' })
  @ApiResponse({ status: 201, type: RequirementResponseDto })
  async create(@Body() dto: CreateRequirementDto): Promise<RequirementResponseDto> {
    return this.requirementsService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all requirements' })
  @ApiQuery({ name: 'projectId', required: false })
  @ApiQuery({ name: 'category', required: false })
  @ApiResponse({ status: 200, type: [RequirementResponseDto] })
  async findAll(
    @Query('projectId') projectId?: string,
    @Query('category') category?: string,
  ): Promise<RequirementResponseDto[]> {
    return this.requirementsService.findAll(projectId, category);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get requirement by ID' })
  @ApiResponse({ status: 200, type: RequirementResponseDto })
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<RequirementResponseDto> {
    return this.requirementsService.findOne(id);
  }

  @Patch(':id')
  @Roles('admin', 'engineer')
  @ApiOperation({ summary: 'Update requirement' })
  @ApiResponse({ status: 200, type: RequirementResponseDto })
  async update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateRequirementDto): Promise<RequirementResponseDto> {
    return this.requirementsService.update(id, dto);
  }

  @Delete(':id')
  @Roles('admin')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete requirement' })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.requirementsService.remove(id);
  }
}
