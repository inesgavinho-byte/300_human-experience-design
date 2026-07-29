import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { CreateEngineeringRuleDto } from './dto/create-engineering-rule.dto';
import { UpdateEngineeringRuleDto } from './dto/update-engineering-rule.dto';
import { EngineeringRuleResponseDto } from './dto/engineering-rule-response.dto';

@Injectable()
export class EngineeringEngineService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateEngineeringRuleDto): Promise<EngineeringRuleResponseDto> {
    const rule = await this.prisma.engineering_rules.create({
      data: {
        name: data.name,
        description: data.description,
        rule_type: data.ruleType,
        condition: data.condition,
        action: data.action,
        priority: data.priority,
        is_active: data.isActive,
      },
    });
    return this.mapToResponse(rule);
  }

  async findAll(ruleType?: string, isActive?: string): Promise<EngineeringRuleResponseDto[]> {
    const where: any = {};
    if (ruleType) where.rule_type = ruleType;
    if (isActive !== undefined) where.is_active = isActive === 'true';
    
    const rules = await this.prisma.engineering_rules.findMany({
      where,
      orderBy: { priority: 'desc' },
    });
    return rules.map(this.mapToResponse);
  }

  async findOne(id: string): Promise<EngineeringRuleResponseDto> {
    const rule = await this.prisma.engineering_rules.findUnique({ where: { id } });
    if (!rule) throw new NotFoundException(`Engineering rule ${id} not found`);
    return this.mapToResponse(rule);
  }

  async update(id: string, data: UpdateEngineeringRuleDto): Promise<EngineeringRuleResponseDto> {
    await this.findOne(id);
    const rule = await this.prisma.engineering_rules.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        rule_type: data.ruleType,
        condition: data.condition,
        action: data.action,
        priority: data.priority,
        is_active: data.isActive,
      },
    });
    return this.mapToResponse(rule);
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.prisma.engineering_rules.delete({ where: { id } });
  }

  async test(id: string): Promise<EngineeringRuleResponseDto> {
    const rule = await this.findOne(id);
    
    // Simulate rule test
    const testResult = {
      tested: true,
      passed: true,
      timestamp: new Date().toISOString(),
      conditionEvaluated: rule.condition,
      actionEvaluated: rule.action,
    };

    const updated = await this.prisma.engineering_rules.update({
      where: { id },
      data: {
        last_tested: new Date(),
        test_results: testResult,
      },
    });

    return this.mapToResponse(updated);
  }

  private mapToResponse(rule: any): EngineeringRuleResponseDto {
    return {
      id: rule.id,
      name: rule.name,
      description: rule.description,
      ruleType: rule.rule_type,
      condition: rule.condition,
      action: rule.action,
      priority: rule.priority,
      isActive: rule.is_active,
      lastTested: rule.last_tested?.toISOString(),
      testResults: rule.test_results,
      createdAt: rule.created_at.toISOString(),
      updatedAt: rule.updated_at.toISOString(),
    };
  }
}
