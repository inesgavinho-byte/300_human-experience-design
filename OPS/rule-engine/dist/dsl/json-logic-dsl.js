"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.executeJsonLogic = executeJsonLogic;
const json_logic_js_1 = __importDefault(require("json-logic-js"));
const logger_1 = require("../utils/logger");
/**
 * Flatten a nested context object into dot-notation keys for JSON Logic.
 * E.g. { room: { area_m2: 58 } } becomes { "room.area_m2": 58 }
 */
function flattenContext(obj, prefix = '', result = {}) {
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
        }
        else {
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
function isOperationObject(value) {
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
function evaluateValue(value, data) {
    if (isOperationObject(value)) {
        return json_logic_js_1.default.apply(value, data);
    }
    if (Array.isArray(value)) {
        return value.map(v => evaluateValue(v, data));
    }
    if (value !== null && typeof value === 'object') {
        const result = {};
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
async function executeJsonLogic(expression, context, _options = {}) {
    const logger = (0, logger_1.getLogger)();
    const startTime = Date.now();
    logger.debug('Executing JSON Logic DSL');
    try {
        let logic;
        if (typeof expression === 'string') {
            logic = JSON.parse(expression);
        }
        else {
            logic = expression;
        }
        const flatData = flattenContext(context);
        // Add custom operations
        json_logic_js_1.default.add_operation('in_array', (needle, haystack) => {
            return Array.isArray(haystack) && haystack.includes(needle);
        });
        json_logic_js_1.default.add_operation('ceil', (n) => Math.ceil(n));
        json_logic_js_1.default.add_operation('floor', (n) => Math.floor(n));
        json_logic_js_1.default.add_operation('round', (n) => Math.round(n));
        // Register custom operations for isOperationObject detection
        JSON_LOGIC_OPERATIONS.add('in_array');
        JSON_LOGIC_OPERATIONS.add('ceil');
        JSON_LOGIC_OPERATIONS.add('floor');
        JSON_LOGIC_OPERATIONS.add('round');
        const result = evaluateValue(logic, flatData);
        json_logic_js_1.default.add_operation('in_array', (needle, haystack) => {
            return Array.isArray(haystack) && haystack.includes(needle);
        });
        json_logic_js_1.default.add_operation('ceil', (n) => Math.ceil(n));
        json_logic_js_1.default.add_operation('floor', (n) => Math.floor(n));
        json_logic_js_1.default.add_operation('round', (n) => Math.round(n));
        const result = evaluateValue(logic, flatData);
        let outputs;
        if (result !== null && typeof result === 'object' && !Array.isArray(result)) {
            outputs = result;
        }
        else {
            outputs = { result };
        }
        return {
            success: true,
            outputs,
            logs: [],
            executionTimeMs: Date.now() - startTime,
        };
    }
    catch (err) {
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
//# sourceMappingURL=json-logic-dsl.js.map