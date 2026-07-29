import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { CreateProposalDto } from './dto/create-proposal.dto';
import { UpdateProposalDto } from './dto/update-proposal.dto';
import { ProposalResponseDto } from './dto/proposal-response.dto';

@Injectable()
export class ProposalsService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateProposalDto): Promise<ProposalResponseDto> {
    const proposal = await this.prisma.proposals.create({
      data: {
        project_id: data.projectId,
        title: data.title,
        description: data.description,
        status: data.status || 'DRAFT',
        amount: data.amount ? String(data.amount) : undefined,
        currency: data.currency || 'EUR',
        valid_until: data.validUntil,
        content: data.content || {},
      },
      include: {
        project: true,
        author: true,
      },
    });
    return this.mapToResponse(proposal);
  }

  async findAll(params: { skip?: number; take?: number } = {}): Promise<ProposalResponseDto[]> {
    const proposals = await this.prisma.proposals.findMany({
      skip: params.skip,
      take: params.take,
      include: {
        project: true,
        author: true,
      },
      orderBy: { created_at: 'desc' },
    });
    return proposals.map(this.mapToResponse);
  }

  async findOne(id: string): Promise<ProposalResponseDto> {
    const proposal = await this.prisma.proposals.findUnique({
      where: { id },
      include: {
        project: true,
        author: true,
      },
    });

    if (!proposal) {
      throw new NotFoundException(`Proposal with ID ${id} not found`);
    }

    return this.mapToResponse(proposal);
  }

  async update(id: string, data: UpdateProposalDto): Promise<ProposalResponseDto> {
    await this.findOne(id);
    const proposal = await this.prisma.proposals.update({
      where: { id },
      data: {
        title: data.title,
        description: data.description,
        status: data.status,
        amount: data.amount ? String(data.amount) : undefined,
        valid_until: data.validUntil,
        content: data.content,
      },
      include: {
        project: true,
        author: true,
      },
    });
    return this.mapToResponse(proposal);
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.prisma.proposals.delete({ where: { id } });
  }

  async findByProject(projectId: string): Promise<ProposalResponseDto[]> {
    const proposals = await this.prisma.proposals.findMany({
      where: { project_id: projectId },
      include: {
        project: true,
        author: true,
      },
      orderBy: { created_at: 'desc' },
    });
    return proposals.map(this.mapToResponse);
  }

  async buildProposalContent(projectId: string): Promise<any> {
    const project: any = await this.prisma.projects.findUnique({
      where: { id: projectId },
      include: {
        client: true,
        buildings: {
          include: {
            floors: {
              include: {
                rooms: true,
              },
            },
            systems: {
              include: {
                subsystems: true,
              },
            },
          },
        },
        requirements: true,
        experiences: true,
        prescriptions: true,
      },
    });

    if (!project) {
      throw new NotFoundException(`Project with ID ${projectId} not found`);
    }

    // Get equipment through buildings -> systems -> subsystems
    const buildingIds = project.buildings.map((b: any) => b.id);
    
    const equipment: any[] = await this.prisma.equipment.findMany({
      where: {
        subsystem: {
          system: {
            building_id: { in: buildingIds },
          },
        },
      },
      include: {
        library_ref: true,
        room: true,
        subsystem: {
          include: {
            system: true,
          },
        },
      },
    });

    const equipmentCount = equipment.length;
    const totalCost = equipmentCount * 2500;
    const installationCost = totalCost * 0.25;
    const programmingCost = totalCost * 0.15;
    const commissioningCost = totalCost * 0.10;
    const totalInvestment = totalCost + installationCost + programmingCost + commissioningCost;
    const annualMaintenance = totalInvestment * 0.03;

    const rooms = project.buildings.flatMap((b: any) => 
      b.floors.flatMap((f: any) => f.rooms)
    );

    const systems = project.buildings.flatMap((b: any) => b.systems);

    return {
      project: {
        name: project.name,
        description: project.description,
        clientName: project.client?.name,
        clientEmail: project.client?.email,
        location: project.location ? JSON.stringify(project.location) : 'Lisboa, Portugal',
        budget: project.budget ? parseFloat(String(project.budget)) : null,
      },
      buildingSummary: {
        totalBuildings: project.buildings.length,
        totalFloors: project.buildings.reduce((sum: number, b: any) => sum + b.floors.length, 0),
        totalRooms: rooms.length,
      },
      systems: systems.map((s: any) => ({
        name: s.name,
        category: s.category,
        protocol: 'KNX',
        description: s.description,
      })),
      equipment: equipment.map((eq: any) => ({
        name: eq.name,
        description: eq.description,
        brand: eq.library_ref?.manufacturer,
        reference: eq.library_ref?.model,
        category: eq.library_ref?.category,
        unitCost: 2500,
        quantity: 1,
        totalCost: 2500,
        roomName: eq.room?.name,
        systemName: eq.subsystem?.system?.name,
      })),
      experiences: project.experiences.map((e: any) => ({
        name: e.name,
        description: e.description,
        triggerType: e.trigger_type,
      })),
      prescriptions: project.prescriptions.map((p: any) => ({
        code: p.code || 'N/A',
        functionalRequirement: p.functional_requirement || '',
        technicalRequirement: p.technical_requirement || '',
        referenceSolution: p.reference_solution,
        status: p.status,
      })),
      financials: {
        equipmentTotal: totalCost,
        installationCost,
        programmingCost,
        commissioningCost,
        totalInvestment,
        annualMaintenance,
      },
      generatedAt: new Date().toISOString(),
    };
  }

  private mapToResponse(proposal: any): ProposalResponseDto {
    return {
      id: proposal.id,
      projectId: proposal.project_id,
      projectName: proposal.project?.name,
      title: proposal.title,
      description: proposal.description,
      status: proposal.status,
      amount: proposal.amount ? parseFloat(String(proposal.amount)) : null,
      currency: proposal.currency,
      validUntil: proposal.valid_until?.toISOString(),
      content: proposal.content,
      createdBy: proposal.created_by,
      authorName: proposal.author?.full_name,
      createdAt: proposal.created_at.toISOString(),
      updatedAt: proposal.updated_at.toISOString(),
    };
  }
}
