"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RuleEngineService = void 0;
const common_1 = require("@nestjs/common");
const rule_engine_1 = require("../engine/rule-engine");
let RuleEngineService = class RuleEngineService {
    ruleEngine;
    config;
    constructor(ruleEngine, config) {
        this.ruleEngine = ruleEngine;
        this.config = config;
    }
    /**
     * Load rules into the engine.
     */
    async loadRules(rules) {
        return this.ruleEngine.loadRules(rules);
    }
    /**
     * Evaluate a single rule.
     */
    async evaluateRule(rule, context) {
        return this.ruleEngine.evaluateRule(rule, context);
    }
    /**
     * Evaluate a built-in rule by code.
     */
    async evaluateBuiltinRule(code, context) {
        return this.ruleEngine.evaluateBuiltinRule(code, context);
    }
    /**
     * Evaluate all applicable rules.
     */
    async evaluateAll(context, options) {
        return this.ruleEngine.evaluateAll(context, options);
    }
    /**
     * Check preconditions for a rule.
     */
    checkPreconditions(rule, context) {
        return this.ruleEngine.checkPreconditions(rule, context);
    }
    /**
     * Check exclusions for a rule.
     */
    checkExclusions(rule, context) {
        return this.ruleEngine.checkExclusions(rule, context);
    }
    /**
     * Calculate confidence score.
     */
    calculateConfidence(rule, context) {
        return this.ruleEngine.calculateConfidence(rule, context);
    }
};
exports.RuleEngineService = RuleEngineService;
exports.RuleEngineService = RuleEngineService = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, common_1.Optional)()),
    __param(1, (0, common_1.Inject)('RULE_ENGINE_CONFIG')),
    __metadata("design:paramtypes", [rule_engine_1.RuleEngine, Object])
], RuleEngineService);
//# sourceMappingURL=rule-engine.service.js.map