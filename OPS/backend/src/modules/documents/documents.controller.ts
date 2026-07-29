import { Controller, Get, Param, ParseUUIDPipe, Res, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { DocumentsService } from './documents.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Response } from 'express';

@ApiTags('Documents')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Get()
  @ApiOperation({ summary: 'Get documents' })
  async findAll() {
    return this.documentsService.findAll();
  }

  @Get('proposal/:proposalId/html')
  @ApiOperation({ summary: 'Generate proposal HTML' })
  async generateProposalHtml(
    @Param('proposalId', ParseUUIDPipe) proposalId: string,
    @Res() res: Response,
  ) {
    const html = await this.documentsService.generateProposalHtml(proposalId);
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  }
}
