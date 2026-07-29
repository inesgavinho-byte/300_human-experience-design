"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var RuleEngineModule_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RuleEngineModule = void 0;
const common_1 = require("@nestjs/common");
const rule_engine_service_1 = require("./rule-engine.service");
const rule_engine_1 = require("../engine/rule-engine");
let RuleEngineModule = RuleEngineModule_1 = class RuleEngineModule {
    static register(options = {}) {
        const providers = [
            {
                provide: 'RULE_ENGINE_CONFIG',
                useValue: options.config ?? {},
            },
            {
                provide: rule_engine_1.RuleEngine,
                useFactory: (config) => {
                    const engine = new rule_engine_1.RuleEngine(config);
                    return engine;
                },
                inject: ['RULE_ENGINE_CONFIG'],
            },
            rule_engine_service_1.RuleEngineService,
        ];
        return {
            module: RuleEngineModule_1,
            global: options.global ?? false,
            providers,
            exports: [rule_engine_1.RuleEngine, rule_engine_service_1.RuleEngineService],
        };
    }
    static forRoot(options = {}) {
        return this.register({ ...options, global: true });
    }
};
exports.RuleEngineModule = RuleEngineModule;
exports.RuleEngineModule = RuleEngineModule = RuleEngineModule_1 = __decorate([
    (0, common_1.Module)({})
], RuleEngineModule);
//# sourceMappingURL=rule-engine.module.js.map