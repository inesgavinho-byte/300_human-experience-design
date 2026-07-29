import { RuleExecutionContext } from '../types/rule.types';
import { DSLResult } from './javascript-dsl';
export interface JsonLogicDslOptions {
}
/**
 * Execute a JSON Logic rule expression.
 *
 * Supports both pure logic operations and data objects with nested operations.
 * Example:
 *   { "if": [{ ">": [{ "var": "room.area_m2" }, 25] }, { "zones": 1 }, { "zones": 0 }] }
 */
export declare function executeJsonLogic(expression: string | Record<string, any>, context: RuleExecutionContext, _options?: JsonLogicDslOptions): Promise<DSLResult>;
//# sourceMappingURL=json-logic-dsl.d.ts.map