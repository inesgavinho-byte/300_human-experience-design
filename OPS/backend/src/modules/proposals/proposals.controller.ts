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
import { ProposalsService } from './proposals.service';
import { CreateProposalDto } from './dto/create-proposal.dto';
import { UpdateProposalDto } from './dto/update-proposal.dto';
import { ProposalResponseDto } from './dto/proposal-response.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Proposals')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('proposals')
export class ProposalsController {
  constructor(private readonly proposalsService: ProposalsService) {}

  @Post()
  @Roles('admin', 'engineer')
  @ApiOperation({ summary: 'Create a new proposal' })
  @ApiResponse({ status: 201, description: 'Proposal created', type: ProposalResponseDto })
  async create(@Body() createProposalDto: CreateProposalDto): Promise<ProposalResponseDto> {
    return this.proposalsService.create(createProposalDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all proposals' })
  @ApiQuery({ name: 'skip', required: false, type: Number })
  @ApiQuery({ name: 'take', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'List of proposals', type: [ProposalResponseDto] })
  async findAll(
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ): Promise<ProposalResponseDto[]> {
    return this.proposalsService.findAll({
      skip: skip ? parseInt(skip, 10) : undefined,
      take: take ? parseInt(take, 10) : undefined,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get proposal by ID' })
  @ApiResponse({ status: 200, description: 'Proposal found', type: ProposalResponseDto })
  @ApiResponse({ status: 404, description: 'Proposal not found' })
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<ProposalResponseDto> {
    return this.proposalsService.findOne(id);
  }

  @Patch(':id')
  @Roles('admin', 'engineer')
  @ApiOperation({ summary: 'Update proposal' })
  @ApiResponse({ status: 200, description: 'Proposal updated', type: ProposalResponseDto })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateProposalDto: UpdateProposalDto,
  ): Promise<ProposalResponseDto> {
    return this.proposalsService.update(id, updateProposalDto);
  }

  @Delete(':id')
  @Roles('admin')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete proposal' })
  @ApiResponse({ status: 204, description: 'Proposal deleted' })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.proposalsService.remove(id);
  }

  @Get('project/:projectId')
  @ApiOperation({ summary: 'Get proposals by project ID' })
  @ApiResponse({ status: 200, description: 'List of proposals', type: [ProposalResponseDto] })
  async findByProject(@Param('projectId', ParseUUIDPipe) projectId: string): Promise<ProposalResponseDto[]> {
    return this.proposalsService.findByProject(projectId);
  }

  @Post('project/:projectId/build')
  @Roles('admin', 'engineer')
  @ApiOperation({ summary: 'Build proposal content from project data' })
  @ApiResponse({ status: 200, description: 'Proposal content built' })
  async buildProposalContent(@Param('projectId', ParseUUIDPipe) projectId: string) {
    return this.proposalsService.buildProposalContent(projectId);
  }
}
