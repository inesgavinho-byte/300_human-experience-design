import jsonLogic from 'json-logic-js';
import { RuleExecutionContext } from '../types/rule.types';
import { getLogger } from '../utils/logger';
import { DSLResult } from './javascript-dsl';

// ============================================================================
// JSON Logic DSL Executor
// ============================================================================

export interface JsonLogicDslOptions {
  // Future options for JSON Logic execution
}

/**
 * Flatten a nested context object into dot-notation keys for JSON Logic.
 * E.g. { room: { area_m2: 58 } } becomes { "room.area_m2": 58 }
 */
function flattenContext(obj: any, prefix = '', result: Record<string, any> = {}): Record<string, any> {
  if (obj === null || obj === undefined) {
    return result;
  }

  if (typeof obj !== 'object' || Array.isArray(obj)) {
    result[prefix] = obj;
    return result;
  }

  for (const key of Object.keys(obj)) {
    const newKey = prefix ? `${prefix}.${key}` : key;
    const value = obj[key];

    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      flattenContext(value, newKey, result);
    } else {
      result[newKey] = value;
    }
  }

  return result;
}

// Known json-logic operations
const JSON_LOGIC_OPERATIONS = new Set([
  '==', '===', '!=', '!==', '>', '>=', '<', '<=',
  '!!', '!', 'and', 'or', 'if',
  'var', 'missing', 'missing_some',
  '+', '-', '*', '/', '%', 'min', 'max', 'sum',
  'merge', 'in', 'cat', 'substr',
  'map', 'filter', 'reduce', 'all', 'none', 'some',
  'log',
]);

/**
 * Check if a value is a JSON Logic operation object.
 * An operation object has exactly one key that is a known operation.
 */
function isOperationObject(value: any): boolean {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    return false;
  }
  const keys = Object.keys(value);
  if (keys.length !== 1) {
    return false;
  }
  return JSON_LOGIC_OPERATIONS.has(keys[0]);
}

/**
 * Recursively evaluate a JSON Logic value.
 * - If it's an operation object, apply the operation via jsonLogic.
 * - If it's a plain object (not an operation), recursively evaluate each value.
 * - If it's an array, recursively evaluate each element.
 * - Otherwise return as-is.
 */
function evaluateValue(value: any, data: Record<string, any>): any {
  if (isOperationObject(value)) {
    return jsonLogic.apply(value, data);
  }

  if (Array.isArray(value)) {
    return value.map(v => evaluateValue(v, data));
  }

  if (value !== null && typeof value === 'object') {
    const result: Record<string, any> = {};
    for (const [k, v] of Object.entries(value)) {
      result[k] = evaluateValue(v, data);
    }
    return result;
  }

  return value;
}

/**
 * Execute a JSON Logic rule expression.
 *
 * Supports both pure logic operations and data objects with nested operations.
 * Example:
 *   { "if": [{ ">": [{ "var": "room.area_m2" }, 25] }, { "zones": 1 }, { "zones": 0 }] }
 */
export async function executeJsonLogic(
  expression: string | Record<string, any>,
  context: RuleExecutionContext,
  _options: JsonLogicDslOptions = {}
): Promise<DSLResult> {
  const logger = getLogger();
  const startTime = Date.now();

  logger.debug('Executing JSON Logic DSL');

  try {
    let logic: Record<string, any>;

    if (typeof expression === 'string') {
      logic = JSON.parse(expression);
    } else {
      logic = expression;
    }

    const flatData = flattenContext(context);

    // Add custom operations
    jsonLogic.add_operation('in_array', (needle: any, haystack: any[]) => {
      return Array.isArray(haystack) && haystack.includes(needle);
    });

    jsonLogic.add_operation('ceil', (n: number) => Math.ceil(n));
    jsonLogic.add_operation('floor', (n: number) => Math.floor(n));
    jsonLogic.add_operation('round', (n: number) => Math.round(n));

    // Register custom operations for isOperationObject detection
    JSON_LOGIC_OPERATIONS.add('in_array');
    JSON_LOGIC_OPERATIONS.add('ceil');
    JSON_LOGIC_OPERATIONS.add('floor');
    JSON_LOGIC_OPERATIONS.add('round');

    const result = evaluateValue(logic, flatData);
    jsonLogic.add_operation('in_array', (needle: any, haystack: any[]) => {
      return Array.isArray(haystack) && haystack.includes(needle);
    });

    jsonLogic.add_operation('ceil', (n: number) => Math.ceil(n));
    jsonLogic.add_operation('floor', (n: number) => Math.floor(n));
    jsonLogic.add_operation('round', (n: number) => Math.round(n));

    const result = evaluateValue(logic, flatData);

    let outputs: Record<string, any>;

    if (result !== null && typeof result === 'object' && !Array.isArray(result)) {
      outputs = result as Record<string, any>;
    } else {
      outputs = { result };
    }

    return {
      success: true,
      outputs,
      logs: [],
      executionTimeMs: Date.now() - startTime,
    };
  } catch (err: any) {
    const error = err?.message ?? String(err);
    logger.error('JSON Logic execution failed', { error });
    return {
      success: false,
      error,
      logs: [],
      executionTimeMs: Date.now() - startTime,
    };
  }
}
