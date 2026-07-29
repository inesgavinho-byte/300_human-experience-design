import { RuleExecutionContext } from '../types/rule.types';
import { DSLResult } from './javascript-dsl';
export interface PythonDslOptions {
    timeoutMs?: number;
    pythonPath?: string;
}
/**
 * Execute a Python rule expression via a child process.
 *
 * The Python code must define a function named `calculate` that accepts
 * a context dict and returns a dict with outputs.
 *
 * Example:
 *   def calculate(context):
 *       base = (context['room']['area_m2'] + 3) // 4
 *       return {"spots": {"min": base, "max": int(base * 1.3)}}
 */
export declare function executePython(expression: string, context: RuleExecutionContext, options?: PythonDslOptions): Promise<DSLResult>;
//# sourceMappingURL=python-dsl.d.ts.map