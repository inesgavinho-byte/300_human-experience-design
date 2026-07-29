import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class DocumentsService {
  constructor(private prisma: PrismaService) {}

  async generateProposalHtml(proposalId: string): Promise<string> {
    const proposal: any = await this.prisma.proposals.findUnique({
      where: { id: proposalId },
      include: {
        project: {
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
        },
      },
    });

    if (!proposal) {
      throw new NotFoundException(`Proposal with ID ${proposalId} not found`);
    }

    const project = proposal.project;
    
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

    const formatCurrency = (value: number) => {
      return new Intl.NumberFormat('pt-PT', {
        style: 'currency',
        currency: 'EUR',
      }).format(value);
    };

    const templatePath = path.join(__dirname, 'templates', 'proposal-template.html');
    let template = fs.readFileSync(templatePath, 'utf-8');

    const replacements: Record<string, string> = {
      '{{title}}': proposal.title || 'Proposta Técnica',
      '{{clientName}}': project.client?.name || 'Cliente',
      '{{projectLocation}}': project.location ? JSON.stringify(project.location) : 'Lisboa, Portugal',
      '{{proposalCode}}': proposal.id.slice(0, 8).toUpperCase(),
      '{{date}}': new Date().toLocaleDateString('pt-PT', { day: 'numeric', month: 'long', year: 'numeric' }),
      '{{clientDescription}}': project.client?.name ? 
        `O projeto foi desenvolvido para ${project.client.name}, com foco na criação de uma experiência residencial integrada e intuitiva.` : 
        'O projeto foi desenvolvido com foco na criação de uma experiência residencial integrada e intuitiva.',
      '{{buildingDescription}}': `${project.name} — ${project.buildings.length} edifício(s), ${rooms.length} divisões.`,
      '{{buildingType}}': project.buildings[0]?.type || 'Residencial',
      '{{totalArea}}': '0',
      '{{totalFloors}}': String(project.buildings.reduce((sum: number, b: any) => sum + b.floors.length, 0)),
      '{{totalRooms}}': String(rooms.length),
      '{{projectGoals}}': proposal.description || 'Criar uma experiência residencial onde a tecnologia antecipa as necessidades do habitante, eliminando fricção do dia a dia.',
    };

    Object.entries(replacements).forEach(([key, value]) => {
      template = template.replace(new RegExp(key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), value);
    });

    const systemsList = systems.map((s: any) => 
      `<span class="system-tag">${s.name}</span>`
    ).join('\n');
    template = template.replace('{{#each systems}}\n          <span class="system-tag">{{name}}</span>\n          {{/each}}', systemsList || '<span class="system-tag">Domótica</span>');

    const systemsTableRows = systems.map((s: any) => `
          <tr>
            <td class="font-medium">${s.name}</td>
            <td>KNX</td>
            <td>${s.description || 'Sistema de controlo integrado'}</td>
          </tr>`
    ).join('\n');
    template = template.replace(
      /\{\{#each systems\}\}\n          <tr>.*?<\/tr>\n          \{\{\/each\}\}/s,
      systemsTableRows || '<tr><td colspan="3">Nenhum sistema configurado</td></tr>'
    );

    const experiencesBlocks = project.experiences.map((e: any) => `
      <div class="experience-block">
        <h4>${e.name}</h4>
        <p>${e.description || 'Experiência programável para melhorar o conforto diário.'}</p>
      </div>`
    ).join('\n');
    template = template.replace(
      /\{\{#each experiences\}\}\n      <div class="experience-block">.*?<\/div>\n      \{\{\/each\}\}/s,
      experiencesBlocks || '<p>Nenhuma experiência configurada.</p>'
    );

    const equipmentRows = equipment.map((eq: any) => {
      return `
          <tr>
            <td>${eq.room?.name || 'Geral'}</td>
            <td>${eq.subsystem?.system?.name || 'Sistema'}</td>
            <td class="font-medium">${eq.name}</td>
            <td>${eq.library_ref?.model || 'N/A'}</td>
            <td class="text-center">1</td>
            <td class="text-right">${formatCurrency(2500)}</td>
            <td class="text-right">${formatCurrency(2500)}</td>
          </tr>`;
    }).join('\n');
    template = template.replace(
      /\{\{#each equipment\}\}\n          <tr>.*?<\/tr>\n          \{\{\/each\}\}/s,
      equipmentRows || '<tr><td colspan="7">Nenhum equipamento configurado</td></tr>'
    );

    template = template.replace('{{formatCurrency financials.equipmentTotal}}', formatCurrency(totalCost));
    template = template.replace('{{formatCurrency financials.installationCost}}', formatCurrency(installationCost));
    template = template.replace('{{formatCurrency financials.programmingCost}}', formatCurrency(programmingCost));
    template = template.replace('{{formatCurrency financials.commissioningCost}}', formatCurrency(commissioningCost));
    template = template.replace('{{formatCurrency financials.totalInvestment}}', formatCurrency(totalInvestment));
    template = template.replace('{{formatCurrency financials.annualMaintenance}}', formatCurrency(annualMaintenance));

    template = template.replace(/\{\{[#\/]?.*?\}\}/g, '');

    return template;
  }

  async findAll() {
    return { message: 'Documents module - Proposal generation active' };
  }
}
