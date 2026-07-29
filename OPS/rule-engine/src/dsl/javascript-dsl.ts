import { safeFunctionCall } from '../utils/safe-eval';
import { RuleExecutionContext } from '../types/rule.types';
import { getLogger } from '../utils/logger';

// ============================================================================
// JavaScript DSL Executor
// ============================================================================

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
export async function executeJavaScript(
  expression: string,
  context: RuleExecutionContext,
  options: JavaScriptDslOptions = {}
): Promise<DSLResult> {
  const logger = getLogger();
  const startTime = Date.now();

  logger.debug('Executing JavaScript DSL', { expressionLength: expression.length });

  try {
    const result = await safeFunctionCall(
      expression,
      'calculate',
      { context },
      {
        timeoutMs: options.timeoutMs ?? 5000,
      }
    );

    if (!result.success) {
      logger.warn('JavaScript DSL execution failed', { error: result.error });
      return {
        success: false,
        error: result.error ?? 'Unknown error during JavaScript execution',
        logs: result.logs,
        executionTimeMs: Date.now() - startTime,
      };
    }

    // Validate that result is a plain object
    if (result.result === null || typeof result.result !== 'object' || Array.isArray(result.result)) {
      const error = 'Rule must return a plain object with output keys';
      logger.warn(error, { result: result.result });
      return {
        success: false,
        error,
        logs: result.logs,
        executionTimeMs: Date.now() - startTime,
      };
    }

    return {
      success: true,
      outputs: result.result as Record<string, any>,
      logs: result.logs,
      executionTimeMs: Date.now() - startTime,
    };
  } catch (err: any) {
    const error = err?.message ?? String(err);
    logger.error('Unexpected error in JavaScript DSL executor', { error });
    return {
      success: false,
      error,
      logs: [],
      executionTimeMs: Date.now() - startTime,
    };
  }
}
