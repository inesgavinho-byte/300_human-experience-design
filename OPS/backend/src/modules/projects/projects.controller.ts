import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { ProjectResponseDto } from './dto/project-response.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Projects')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  @Roles('admin', 'engineer')
  @ApiOperation({ summary: 'Create a new project' })
  @ApiResponse({ status: 201, description: 'Project created', type: ProjectResponseDto })
  async create(@Body() createProjectDto: CreateProjectDto): Promise<ProjectResponseDto> {
    return this.projectsService.create(createProjectDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all projects' })
  @ApiQuery({ name: 'skip', required: false, type: Number })
  @ApiQuery({ name: 'take', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'List of projects', type: [ProjectResponseDto] })
  async findAll(
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ): Promise<ProjectResponseDto[]> {
    return this.projectsService.findAll({
      skip: skip ? parseInt(skip, 10) : undefined,
      take: take ? parseInt(take, 10) : undefined,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get project by ID' })
  @ApiResponse({ status: 200, description: 'Project found', type: ProjectResponseDto })
  @ApiResponse({ status: 404, description: 'Project not found' })
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<ProjectResponseDto> {
    return this.projectsService.findOne(id);
  }

  @Patch(':id')
  @Roles('admin', 'engineer')
  @ApiOperation({ summary: 'Update project' })
  @ApiResponse({ status: 200, description: 'Project updated', type: ProjectResponseDto })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateProjectDto: UpdateProjectDto,
  ): Promise<ProjectResponseDto> {
    return this.projectsService.update(id, updateProjectDto);
  }

  @Delete(':id')
  @Roles('admin')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete project' })
  @ApiResponse({ status: 204, description: 'Project deleted' })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.projectsService.remove(id);
  }

  // Nested routes
  @Get(':id/buildings')
  @ApiOperation({ summary: 'Get project buildings' })
  @ApiResponse({ status: 200, description: 'List of buildings' })
  async getBuildings(@Param('id', ParseUUIDPipe) id: string) {
    return this.projectsService.getBuildings(id);
  }

  @Get(':id/requirements')
  @ApiOperation({ summary: 'Get project requirements' })
  @ApiResponse({ status: 200, description: 'List of requirements' })
  async getRequirements(@Param('id', ParseUUIDPipe) id: string) {
    return this.projectsService.getRequirements(id);
  }

  @Get(':id/experiences')
  @ApiOperation({ summary: 'Get project experiences' })
  @ApiResponse({ status: 200, description: 'List of experiences' })
  async getExperiences(@Param('id', ParseUUIDPipe) id: string) {
    return this.projectsService.getExperiences(id);
  }

  @Get(':id/prescriptions')
  @ApiOperation({ summary: 'Get project prescriptions' })
  @ApiResponse({ status: 200, description: 'List of prescriptions' })
  async getPrescriptions(@Param('id', ParseUUIDPipe) id: string) {
    return this.projectsService.getPrescriptions(id);
  }
}
