import { RuleExecutionContext } from '../types/rule.types';
import { DSLResult } from './javascript-dsl';
export interface SqlDslOptions {
    dbAdapter?: any;
}
export declare function executeSql(expression: string, context: RuleExecutionContext, options?: SqlDslOptions): Promise<DSLResult>;
//# sourceMappingURL=sql-dsl.d.ts.map