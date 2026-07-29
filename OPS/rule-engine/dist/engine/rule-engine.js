"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RuleEngine = void 0;
const javascript_dsl_1 = require("../dsl/javascript-dsl");
const json_logic_dsl_1 = require("../dsl/json-logic-dsl");
const python_dsl_1 = require("../dsl/python-dsl");
const sql_dsl_1 = require("../dsl/sql-dsl");
const result_validator_1 = require("./result-validator");
const logger_1 = require("../utils/logger");
// ============================================================================
// Core Rule Engine
// ============================================================================
class RuleEngine {
    config;
    rules = [];
    builtinRules = new Map();
    logger;
    constructor(config = {}) {
        this.config = config;
        this.logger = config.enableLogging !== false ? new logger_1.ConsoleLogger('[RuleEngine]') : new logger_1.NoopLogger();
        if (config.enableLogging !== false) {
            (0, logger_1.setGlobalLogger)(this.logger);
        }
    }
    // -------------------------------------------------------------------------
    // Rule Loading
    // -------------------------------------------------------------------------
    async loadRules(rules) {
        if (rules) {
            this.rules = rules.filter(r => r.is_active);
            this.logger.info(`Loaded ${this.rules.length} rules from array`);
            return this.rules;
        }
        this.logger.warn('No rules provided; loading from database not yet implemented');
        return [];
    }
    registerBuiltinRule(builtInRule) {
        this.builtinRules.set(builtInRule.code, builtInRule);
        this.logger.info(`Registered built-in rule: ${builtInRule.code}`);
    }
    registerBuiltinRules(builtInRules) {
        for (const rule of builtInRules) {
            this.registerBuiltinRule(rule);
        }
    }
    // -------------------------------------------------------------------------
    // Core Evaluation
    // -------------------------------------------------------------------------
    async evaluateRule(rule, context) {
        const startTime = Date.now();
        const logs = [];
        const errors = [];
        this.logger.info(`Evaluating rule ${rule.code}: ${rule.name}`);
        logs.push(`Starting evaluation of rule ${rule.code}`);
        try {
            if (!this.checkPreconditions(rule, context)) {
                const msg = `Rule ${rule.code} preconditions not met`;
                this.logger.info(msg);
                logs.push(msg);
                return {
                    ruleId: rule.id,
                    ruleCode: rule.code,
                    inputs: this.buildInputs(context),
                    outputs: {},
                    confidence: 0,
                    executionTimeMs: Date.now() - startTime,
                    logs,
                    errors: [`Preconditions not met`],
                };
            }
            if (this.checkExclusions(rule, context)) {
                const msg = `Rule ${rule.code} excluded by context`;
                this.logger.info(msg);
                logs.push(msg);
                return {
                    ruleId: rule.id,
                    ruleCode: rule.code,
                    inputs: this.buildInputs(context),
                    outputs: {},
                    confidence: 0,
                    executionTimeMs: Date.now() - startTime,
                    logs,
                    errors: [`Excluded by context`],
                };
            }
            const enrichedContext = this.enrichContextWithParameters(context, rule.parameters);
            let dslResult;
            switch (rule.rule_language) {
                case 'javascript':
                    dslResult = await (0, javascript_dsl_1.executeJavaScript)(rule.rule_expression, enrichedContext, {
                        timeoutMs: this.config.maxExecutionTimeMs,
                    });
                    break;
                case 'json_logic':
                    dslResult = await (0, json_logic_dsl_1.executeJsonLogic)(rule.rule_expression, enrichedContext);
                    break;
                case 'python':
                    dslResult = await (0, python_dsl_1.executePython)(rule.rule_expression, enrichedContext, {
                        timeoutMs: this.config.maxExecutionTimeMs,
                    });
                    break;
                case 'sql':
                    dslResult = await (0, sql_dsl_1.executeSql)(rule.rule_expression, enrichedContext);
                    break;
                default:
                    throw new Error(`Unsupported rule language: ${rule.rule_language}`);
            }
            logs.push(...dslResult.logs);
            if (!dslResult.success) {
                errors.push(dslResult.error ?? 'Unknown execution error');
                return {
                    ruleId: rule.id,
                    ruleCode: rule.code,
                    inputs: this.buildInputs(context),
                    outputs: {},
                    confidence: 0,
                    executionTimeMs: Date.now() - startTime,
                    logs,
                    errors,
                };
            }
            if (rule.output_schema) {
                const validation = (0, result_validator_1.validateOutputs)({
                    ruleId: rule.id,
                    ruleCode: rule.code,
                    inputs: {},
                    outputs: dslResult.outputs ?? {},
                    confidence: 0,
                    executionTimeMs: 0,
                    logs: [],
                    errors: [],
                }, rule.output_schema);
                if (!validation.valid) {
                    errors.push(...validation.errors);
                }
                logs.push(...validation.warnings.map(w => `[WARN] ${w}`));
            }
            const confidence = this.calculateConfidence(rule, context);
            const result = {
                ruleId: rule.id,
                ruleCode: rule.code,
                inputs: this.buildInputs(context),
                outputs: dslResult.outputs ?? {},
                confidence,
                executionTimeMs: Date.now() - startTime,
                logs,
                errors,
            };
            this.logger.info(`Rule ${rule.code} evaluated successfully`, {
                confidence,
                executionTimeMs: result.executionTimeMs,
            });
            return result;
        }
        catch (err) {
            const error = err?.message ?? String(err);
            this.logger.error(`Rule ${rule.code} evaluation failed`, { error });
            errors.push(error);
            return {
                ruleId: rule.id,
                ruleCode: rule.code,
                inputs: this.buildInputs(context),
                outputs: {},
                confidence: 0,
                executionTimeMs: Date.now() - startTime,
                logs,
                errors,
            };
        }
    }
    async evaluateBuiltinRule(code, context) {
        const startTime = Date.now();
        const rule = this.builtinRules.get(code);
        if (!rule) {
            throw new Error(`Built-in rule not found: ${code}`);
        }
        this.logger.info(`Evaluating built-in rule ${code}`);
        try {
            const outputs = await rule.execute(context);
            return {
                ruleId: `builtin-${code}`,
                ruleCode: code,
                inputs: this.buildInputs(context),
                outputs,
                confidence: this.calculateBuiltinConfidence(rule, context),
                executionTimeMs: Date.now() - startTime,
                logs: [`Built-in rule ${code} executed successfully`],
                errors: [],
            };
        }
        catch (err) {
            return {
                ruleId: `builtin-${code}`,
                ruleCode: code,
                inputs: this.buildInputs(context),
                outputs: {},
                confidence: 0,
                executionTimeMs: Date.now() - startTime,
                logs: [],
                errors: [err?.message ?? String(err)],
            };
        }
    }
    async evaluateAll(context, options = {}) {
        this.logger.info('Evaluating all applicable rules', { options });
        let applicableRules = this.rules;
        if (options.category) {
            applicableRules = applicableRules.filter(r => r.category === options.category);
        }
        if (options.ruleCodes) {
            const codes = new Set(options.ruleCodes);
            applicableRules = applicableRules.filter(r => codes.has(r.code));
        }
        if (options.skipInactive !== false) {
            applicableRules = applicableRules.filter(r => r.is_active);
        }
        const results = [];
        for (const rule of applicableRules) {
            const result = await this.evaluateRule(rule, context);
            results.push(result);
        }
        if (options.ruleCodes) {
            for (const code of options.ruleCodes) {
                if (this.builtinRules.has(code) && !results.some(r => r.ruleCode === code)) {
                    const result = await this.evaluateBuiltinRule(code, context);
                    results.push(result);
                }
            }
        }
        this.logger.info(`Evaluated ${results.length} rules`);
        return results;
    }
    // -------------------------------------------------------------------------
    // Preconditions & Exclusions
    // -------------------------------------------------------------------------
    checkPreconditions(rule, context) {
        if (!rule.preconditions || Object.keys(rule.preconditions).length === 0) {
            return true;
        }
        return this.checkConditions(rule.preconditions, context);
    }
    checkExclusions(rule, context) {
        if (!rule.exclusions || Object.keys(rule.exclusions).length === 0) {
            return false;
        }
        return this.checkConditions(rule.exclusions, context);
    }
    checkConditions(conditions, context) {
        for (const [key, expectedValue] of Object.entries(conditions)) {
            const actualValue = this.resolveContextPath(key, context);
            if (expectedValue && typeof expectedValue === 'object') {
                for (const [op, operand] of Object.entries(expectedValue)) {
                    switch (op) {
                        case '$eq':
                            if (actualValue !== operand)
                                return false;
                            break;
                        case '$ne':
                            if (actualValue === operand)
                                return false;
                            break;
                        case '$gt':
                            if (!(actualValue > operand))
                                return false;
                            break;
                        case '$gte':
                            if (!(actualValue >= operand))
                                return false;
                            break;
                        case '$lt':
                            if (!(actualValue < operand))
                                return false;
                            break;
                        case '$lte':
                            if (!(actualValue <= operand))
                                return false;
                            break;
                        case '$in':
                            if (!Array.isArray(operand) || !operand.includes(actualValue))
                                return false;
                            break;
                        case '$nin':
                            if (!Array.isArray(operand) || operand.includes(actualValue))
                                return false;
                            break;
                        case '$exists':
                            if (operand && actualValue === undefined)
                                return false;
                            if (!operand && actualValue !== undefined)
                                return false;
                            break;
                        default:
                            this.logger.warn(`Unknown condition operator: ${op}`);
                    }
                }
            }
            else {
                if (actualValue !== expectedValue) {
                    return false;
                }
            }
        }
        return true;
    }
    resolveContextPath(path, context) {
        const parts = path.split('.');
        let value = context;
        for (const part of parts) {
            if (value === null || value === undefined) {
                return undefined;
            }
            value = value[part];
        }
        return value;
    }
    // -------------------------------------------------------------------------
    // Confidence Scoring
    // -------------------------------------------------------------------------
    calculateConfidence(rule, context) {
        const base = this.config.defaultConfidenceBase ?? 0.8;
        const detectionStateFactors = {
            confirmed: 1.0,
            detected: 0.9,
            inferred: 0.7,
            to_confirm: 0.5,
        };
        const detectionState = context.room?.detection_state ?? 'inferred';
        const detectionFactor = detectionStateFactors[detectionState] ?? 0.5;
        const totalRequirements = context.requirements.length;
        const explicitRequirements = context.requirements.filter(r => r.source === 'explicit').length;
        const requirementsFactor = totalRequirements > 0
            ? explicitRequirements / totalRequirements
            : 0;
        const budgetDefined = context.project.budget !== undefined && context.project.budget !== null;
        const buildingTypeDefined = !!context.project.building_type;
        const confidence = base
            + (detectionFactor * 0.1)
            + (requirementsFactor * 0.05)
            + (budgetDefined ? 0.03 : 0)
            + (buildingTypeDefined ? 0.02 : 0);
        return Math.min(1.0, Math.round(confidence * 100) / 100);
    }
    calculateBuiltinConfidence(_rule, context) {
        return this.calculateConfidence({
            id: '',
            code: '',
            name: '',
            category: 'iluminacao',
            rule_expression: '',
            rule_language: 'javascript',
            parameters: {},
            version: 1,
            is_active: true,
            created_at: '',
            updated_at: '',
        }, context);
    }
    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------
    enrichContextWithParameters(context, parameters) {
        return {
            ...context,
            ...parameters,
        };
    }
    buildInputs(context) {
        return {
            projectId: context.project.id,
            buildingId: context.building?.id,
            floorId: context.floor?.id,
            roomId: context.room?.id,
            solutionLevel: context.solutionLevel,
            roomArea: context.room?.area_m2,
            roomFunction: context.room?.function,
            buildingType: context.project.building_type,
            budget: context.project.budget,
        };
    }
}
exports.RuleEngine = RuleEngine;
//# sourceMappingURL=rule-engine.js.map