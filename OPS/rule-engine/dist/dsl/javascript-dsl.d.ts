import { RuleExecutionContext } from '../types/rule.types';
export interface DSLResult {
    success: boolean;
    outputs?: Record<string, any>;
    error?: string;
    logs: string[];
    executionTimeMs: number;
}
export interface JavaScriptDslOptions {
    timeoutMs?: number;
}
/**
 * Execute a JavaScript rule expression in a sandboxed environment.
 *
 * The rule expression must define a function named `calculate` that accepts
 * a single context object and returns a plain object with outputs.
 *
 * Example:
 *   function calculate(context) {
 *     const base = Math.ceil(context.room.area_m2 / 4);
 *     return { spots: { min: base, max: Math.ceil(base * 1.3) } };
 *   }
 */
export declare function executeJavaScript(expression: string, context: RuleExecutionContext, options?: JavaScriptDslOptions): Promise<DSLResult>;
//# sourceMappingURL=javascript-dsl.d.ts.map