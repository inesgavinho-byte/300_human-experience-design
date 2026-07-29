"use strict";
// ============================================================================
// Result Validator
// ============================================================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateOutputs = validateOutputs;
const logger_1 = require("../utils/logger");
/**
 * Validate rule outputs against an expected schema.
 */
function validateOutputs(result, schema) {
    const logger = (0, logger_1.getLogger)();
    const errors = [];
    const warnings = [];
    logger.debug('Validating rule outputs', { ruleCode: result.ruleCode });
    // Check for empty outputs
    if (!result.outputs || Object.keys(result.outputs).length === 0) {
        warnings.push('Rule produced empty outputs');
    }
    // Check for execution errors
    if (result.errors.length > 0) {
        errors.push(...result.errors.map(e => `Execution error: ${e}`));
    }
    // Schema validation
    if (schema) {
        const schemaErrors = validateAgainstSchema(result.outputs, schema, '');
        errors.push(...schemaErrors);
    }
    // Generic validations
    if (result.outputs) {
        for (const [key, value] of Object.entries(result.outputs)) {
            // Equipment counts must be positive integers
            if (key.endsWith('_count') || key.endsWith('_min') || key.endsWith('_max')) {
                if (typeof value === 'number' && value < 0) {
                    errors.push(`Output "${key}" must be a non-negative number, got ${value}`);
                }
                if (typeof value === 'number' && !Number.isInteger(value)) {
                    warnings.push(`Output "${key}" should be an integer, got ${value}`);
                }
            }
            // Cost validations
            if (key.includes('cost') || key.includes('price') || key.includes('budget')) {
                if (typeof value === 'number' && value < 0) {
                    errors.push(`Cost output "${key}" must be non-negative, got ${value}`);
                }
            }
            // Array length validations
            if (Array.isArray(value) && value.length === 0) {
                warnings.push(`Output "${key}" is an empty array`);
            }
        }
    }
    return {
        valid: errors.length === 0,
        errors,
        warnings,
    };
}
function validateAgainstSchema(value, schema, path) {
    const errors = [];
    const currentPath = path || 'root';
    // Type checking
    if (schema.type) {
        const typeError = checkType(value, schema.type, currentPath);
        if (typeError) {
            errors.push(typeError);
            // Don't recurse into wrong-typed values
            return errors;
        }
    }
    // Object validations
    if (schema.type === 'object' && value && typeof value === 'object') {
        // Required fields
        if (schema.required) {
            for (const requiredKey of schema.required) {
                if (!(requiredKey in value)) {
                    errors.push(`Missing required field "${requiredKey}" at ${currentPath}`);
                }
            }
        }
        // Property schemas
        if (schema.properties) {
            for (const [propKey, propSchema] of Object.entries(schema.properties)) {
                if (propKey in value) {
                    errors.push(...validateAgainstSchema(value[propKey], propSchema, `${currentPath}.${propKey}`));
                }
            }
        }
    }
    // Number validations
    if (schema.type === 'number' || schema.type === 'integer') {
        if (typeof value === 'number') {
            if (schema.minimum !== undefined && value < schema.minimum) {
                errors.push(`Value at ${currentPath} (${value}) is below minimum (${schema.minimum})`);
            }
            if (schema.maximum !== undefined && value > schema.maximum) {
                errors.push(`Value at ${currentPath} (${value}) is above maximum (${schema.maximum})`);
            }
            if (schema.type === 'integer' && !Number.isInteger(value)) {
                errors.push(`Value at ${currentPath} (${value}) is not an integer`);
            }
        }
    }
    // String validations
    if (schema.type === 'string' && typeof value === 'string') {
        if (schema.pattern && !new RegExp(schema.pattern).test(value)) {
            errors.push(`Value at ${currentPath} does not match pattern ${schema.pattern}`);
        }
    }
    // Array validations
    if (schema.type === 'array' && Array.isArray(value)) {
        if (schema.items) {
            for (let i = 0; i < value.length; i++) {
                errors.push(...validateAgainstSchema(value[i], schema.items, `${currentPath}[${i}]`));
            }
        }
    }
    return errors;
}
function checkType(value, expectedType, path) {
    if (value === null || value === undefined) {
        return null; // Allow null/undefined unless required
    }
    switch (expectedType) {
        case 'object':
            if (typeof value !== 'object' || Array.isArray(value)) {
                return `Expected object at ${path}, got ${typeof value}`;
            }
            break;
        case 'array':
            if (!Array.isArray(value)) {
                return `Expected array at ${path}, got ${typeof value}`;
            }
            break;
        case 'string':
            if (typeof value !== 'string') {
                return `Expected string at ${path}, got ${typeof value}`;
            }
            break;
        case 'number':
            if (typeof value !== 'number' || Number.isNaN(value)) {
                return `Expected number at ${path}, got ${typeof value}`;
            }
            break;
        case 'integer':
            if (typeof value !== 'number' || Number.isNaN(value) || !Number.isInteger(value)) {
                return `Expected integer at ${path}, got ${typeof value === 'number' ? value : typeof value}`;
            }
            break;
        case 'boolean':
            if (typeof value !== 'boolean') {
                return `Expected boolean at ${path}, got ${typeof value}`;
            }
            break;
    }
    return null;
}
//# sourceMappingURL=result-validator.js.map