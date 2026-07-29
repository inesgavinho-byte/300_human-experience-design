import { Controller, Get, Post, Patch, Delete, Body, Param, Query, ParseUUIDPipe, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AiService } from './ai.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('AI')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('servers')
  @Roles('admin', 'engineer')
  @ApiOperation({ summary: 'Create AI server' })
  async createServer(@Body() data: any) {
    return this.aiService.createServer(data);
  }

  @Get('servers')
  @ApiOperation({ summary: 'Get all AI servers' })
  async findAllServers() {
    return this.aiService.findAllServers();
  }

  @Get('servers/:id')
  @ApiOperation({ summary: 'Get AI server by ID' })
  async findOneServer(@Param('id', ParseUUIDPipe) id: string) {
    return this.aiService.findOneServer(id);
  }

  @Post('patterns')
  @Roles('admin', 'engineer')
  @ApiOperation({ summary: 'Create AI pattern' })
  async createPattern(@Body() data: any) {
    return this.aiService.createPattern(data);
  }

  @Get('patterns')
  @ApiOperation({ summary: 'Get all AI patterns' })
  @ApiQuery({ name: 'serverId', required: false })
  async findAllPatterns(@Query('serverId') serverId?: string) {
    return this.aiService.findAllPatterns(serverId);
  }

  @Get('patterns/:id')
  @ApiOperation({ summary: 'Get AI pattern by ID' })
  async findOnePattern(@Param('id', ParseUUIDPipe) id: string) {
    return this.aiService.findOnePattern(id);
  }
}
