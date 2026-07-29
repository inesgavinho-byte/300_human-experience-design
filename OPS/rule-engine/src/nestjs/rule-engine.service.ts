import { Injectable, Inject, Optional } from '@nestjs/common';
import { RuleEngine } from '../engine/rule-engine';
import {
  EngineeringRule,
  RuleExecutionContext,
  RuleExecutionResult,
  EvaluateAllOptions,
  RuleEngineConfig,
  SolutionLevel,
} from '../types/rule.types';

@Injectable()
export class RuleEngineService {
  constructor(
    private readonly ruleEngine: RuleEngine,
    @Optional() @Inject('RULE_ENGINE_CONFIG') private readonly config?: RuleEngineConfig
  ) {}

  /**
   * Load rules into the engine.
   */
  async loadRules(rules?: EngineeringRule[]): Promise<EngineeringRule[]> {
    return this.ruleEngine.loadRules(rules);
  }

  /**
   * Evaluate a single rule.
   */
  async evaluateRule(
    rule: EngineeringRule,
    context: RuleExecutionContext
  ): Promise<RuleExecutionResult> {
    return this.ruleEngine.evaluateRule(rule, context);
  }

  /**
   * Evaluate a built-in rule by code.
   */
  async evaluateBuiltinRule(
    code: string,
    context: RuleExecutionContext
  ): Promise<RuleExecutionResult> {
    return this.ruleEngine.evaluateBuiltinRule(code, context);
  }

  /**
   * Evaluate all applicable rules.
   */
  async evaluateAll(
    context: RuleExecutionContext,
    options?: EvaluateAllOptions
  ): Promise<RuleExecutionResult[]> {
    return this.ruleEngine.evaluateAll(context, options);
  }

  /**
   * Check preconditions for a rule.
   */
  checkPreconditions(rule: EngineeringRule, context: RuleExecutionContext): boolean {
    return this.ruleEngine.checkPreconditions(rule, context);
  }

  /**
   * Check exclusions for a rule.
   */
  checkExclusions(rule: EngineeringRule, context: RuleExecutionContext): boolean {
    return this.ruleEngine.checkExclusions(rule, context);
  }

  /**
   * Calculate confidence score.
   */
  calculateConfidence(rule: EngineeringRule, context: RuleExecutionContext): number {
    return this.ruleEngine.calculateConfidence(rule, context);
  }
}
