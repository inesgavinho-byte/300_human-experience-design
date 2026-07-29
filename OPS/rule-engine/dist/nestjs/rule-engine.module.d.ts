import { DynamicModule } from '@nestjs/common';
import { RuleEngineConfig } from '../types/rule.types';
export interface RuleEngineModuleOptions {
    config?: RuleEngineConfig;
    global?: boolean;
}
export declare class RuleEngineModule {
    static register(options?: RuleEngineModuleOptions): DynamicModule;
    static forRoot(options?: RuleEngineModuleOptions): DynamicModule;
}
//# sourceMappingURL=rule-engine.module.d.ts.map