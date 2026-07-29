import { RuleEngine } from '../engine/rule-engine';
import { EngineeringRule, RuleExecutionContext, RuleExecutionResult, EvaluateAllOptions, RuleEngineConfig } from '../types/rule.types';
export declare class RuleEngineService {
    private readonly ruleEngine;
    private readonly config?;
    constructor(ruleEngine: RuleEngine, config?: RuleEngineConfig | undefined);
    /**
     * Load rules into the engine.
     */
    loadRules(rules?: EngineeringRule[]): Promise<EngineeringRule[]>;
    /**
     * Evaluate a single rule.
     */
    evaluateRule(rule: EngineeringRule, context: RuleExecutionContext): Promise<RuleExecutionResult>;
    /**
     * Evaluate a built-in rule by code.
     */
    evaluateBuiltinRule(code: string, context: RuleExecutionContext): Promise<RuleExecutionResult>;
    /**
     * Evaluate all applicable rules.
     */
    evaluateAll(context: RuleExecutionContext, options?: EvaluateAllOptions): Promise<RuleExecutionResult[]>;
    /**
     * Check preconditions for a rule.
     */
    checkPreconditions(rule: EngineeringRule, context: RuleExecutionContext): boolean;
    /**
     * Check exclusions for a rule.
     */
    checkExclusions(rule: EngineeringRule, context: RuleExecutionContext): boolean;
    /**
     * Calculate confidence score.
     */
    calculateConfidence(rule: EngineeringRule, context: RuleExecutionContext): number;
}
//# sourceMappingURL=rule-engine.service.d.ts.map