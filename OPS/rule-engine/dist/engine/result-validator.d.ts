import { RuleExecutionResult } from '../types/rule.types';
export interface ValidationResult {
    valid: boolean;
    errors: string[];
    warnings: string[];
}
export interface OutputSchema {
    type: 'object' | 'array' | 'string' | 'number' | 'integer' | 'boolean';
    required?: string[];
    properties?: Record<string, OutputSchema>;
    minimum?: number;
    maximum?: number;
    pattern?: string;
    items?: OutputSchema;
}
/**
 * Validate rule outputs against an expected schema.
 */
export declare function validateOutputs(result: RuleExecutionResult, schema?: OutputSchema | Record<string, any>): ValidationResult;
//# sourceMappingURL=result-validator.d.ts.map