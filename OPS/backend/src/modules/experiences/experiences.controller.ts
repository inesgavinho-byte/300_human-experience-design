import { Controller, Get, Post, Patch, Delete, Body, Param, Query, ParseUUIDPipe, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ExperiencesService } from './experiences.service';
import { CreateExperienceDto } from './dto/create-experience.dto';
import { UpdateExperienceDto } from './dto/update-experience.dto';
import { ExperienceResponseDto } from './dto/experience-response.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Experiences')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('experiences')
export class ExperiencesController {
  constructor(private readonly experiencesService: ExperiencesService) {}

  @Post()
  @Roles('admin', 'engineer')
  @ApiOperation({ summary: 'Create experience' })
  @ApiResponse({ status: 201, type: ExperienceResponseDto })
  async create(@Body() dto: CreateExperienceDto): Promise<ExperienceResponseDto> {
    return this.experiencesService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all experiences' })
  @ApiQuery({ name: 'projectId', required: false })
  @ApiResponse({ status: 200, type: [ExperienceResponseDto] })
  async findAll(@Query('projectId') projectId?: string): Promise<ExperienceResponseDto[]> {
    return this.experiencesService.findAll(projectId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get experience by ID' })
  @ApiResponse({ status: 200, type: ExperienceResponseDto })
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<ExperienceResponseDto> {
    return this.experiencesService.findOne(id);
  }

  @Patch(':id')
  @Roles('admin', 'engineer')
  @ApiOperation({ summary: 'Update experience' })
  @ApiResponse({ status: 200, type: ExperienceResponseDto })
  async update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateExperienceDto): Promise<ExperienceResponseDto> {
    return this.experiencesService.update(id, dto);
  }

  @Delete(':id')
  @Roles('admin')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete experience' })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.experiencesService.remove(id);
  }
}
