import jsonLogic from 'json-logic-js';
import { RuleExecutionContext, EngineeringRule, RuleExecutionResult } from './types.js';
import { builtInRules } from './rules/built-in.js';

export class RuleEngine {
  evaluateRule(rule: EngineeringRule, context: RuleExecutionContext): RuleExecutionResult {
    const startTime = Date.now();
    const inputs = { ...context };

    let outputs: Record<string, any>;
    try {
      if (rule.ruleLanguage === 'javascript') {
        outputs = this.evaluateJavaScriptRule(rule, context);
      } else if (rule.ruleLanguage === 'json_logic') {
        outputs = this.evaluateJsonLogicRule(rule, context);
      } else {
        throw new Error(`Unsupported rule language: ${rule.ruleLanguage}`);
      }
    } catch (error: any) {
      throw new Error(`Rule ${rule.code} failed: ${error.message}`);
    }

    const executionTimeMs = Date.now() - startTime;
    const confidence = this.calculateConfidence(context);

    return {
      ruleCode: rule.code,
      inputs,
      outputs,
      confidence,
      executionTimeMs,
    };
  }

  evaluateAll(rules: EngineeringRule[], context: RuleExecutionContext): RuleExecutionResult[] {
    return rules.map((rule) => this.evaluateRule(rule, context));
  }

  calculateConfidence(context: RuleExecutionContext): number {
    let score = 0.5;
    const { room, level, buildingType } = context;

    if (room?.area_m2 && room.area_m2 > 0) score += 0.15;
    if (room?.function && room.function.trim().length > 0) score += 0.15;
    if (room?.orientation && room.orientation.trim().length > 0) score += 0.1;
    if (level && ['essential', 'recommended', 'signature'].includes(level)) score += 0.05;
    if (buildingType && buildingType.trim().length > 0) score += 0.05;

    return Math.min(1.0, Math.max(0.5, score));
  }

  private evaluateJavaScriptRule(rule: EngineeringRule, context: RuleExecutionContext): Record<string, any> {
    const code = rule.ruleExpression;

    if (!code.includes('function')) {
      throw new Error('Invalid JavaScript rule: missing function declaration');
    }

    const wrappedCode = `
      return (${code})(room, level, buildingType);
    `;

    const fn = new Function('room', 'level', 'buildingType', wrappedCode);
    const result = fn(context.room, context.level, context.buildingType);

    if (typeof result !== 'object' || result === null) {
      throw new Error('Rule did not return an object');
    }

    return result;
  }

  private evaluateJsonLogicRule(rule: EngineeringRule, context: RuleExecutionContext): Record<string, any> {
    try {
      const logic = JSON.parse(rule.ruleExpression);
      const result = jsonLogic.apply(logic, context);
      return typeof result === 'object' && result !== null ? result : { value: result };
    } catch (error: any) {
      throw new Error(`JSON Logic evaluation failed: ${error.message}`);
    }
  }

  getBuiltInRules(): EngineeringRule[] {
    return [...builtInRules];
  }
}

export const ruleEngine = new RuleEngine();
