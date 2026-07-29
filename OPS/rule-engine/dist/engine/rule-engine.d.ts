import { EngineeringRule, RuleExecutionContext, RuleExecutionResult, EvaluateAllOptions, RuleEngineConfig } from '../types/rule.types';
import { BuiltInRule } from '../types/rule.types';
export declare class RuleEngine {
    private config;
    private rules;
    private builtinRules;
    private logger;
    constructor(config?: RuleEngineConfig);
    loadRules(rules?: EngineeringRule[]): Promise<EngineeringRule[]>;
    registerBuiltinRule(builtInRule: BuiltInRule): void;
    registerBuiltinRules(builtInRules: BuiltInRule[]): void;
    evaluateRule(rule: EngineeringRule, context: RuleExecutionContext): Promise<RuleExecutionResult>;
    evaluateBuiltinRule(code: string, context: RuleExecutionContext): Promise<RuleExecutionResult>;
    evaluateAll(context: RuleExecutionContext, options?: EvaluateAllOptions): Promise<RuleExecutionResult[]>;
    checkPreconditions(rule: EngineeringRule, context: RuleExecutionContext): boolean;
    checkExclusions(rule: EngineeringRule, context: RuleExecutionContext): boolean;
    private checkConditions;
    private resolveContextPath;
    calculateConfidence(rule: EngineeringRule, context: RuleExecutionContext): number;
    private calculateBuiltinConfidence;
    private enrichContextWithParameters;
    private buildInputs;
}
//# sourceMappingURL=rule-engine.d.ts.map