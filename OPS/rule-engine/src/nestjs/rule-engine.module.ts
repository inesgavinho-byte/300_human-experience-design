import { Module, Global, DynamicModule } from '@nestjs/common';
import { RuleEngineService } from './rule-engine.service';
import { RuleEngine } from '../engine/rule-engine';
import { RuleEngineConfig } from '../types/rule.types';

export interface RuleEngineModuleOptions {
  config?: RuleEngineConfig;
  global?: boolean;
}

@Module({})
export class RuleEngineModule {
  static register(options: RuleEngineModuleOptions = {}): DynamicModule {
    const providers = [
      {
        provide: 'RULE_ENGINE_CONFIG',
        useValue: options.config ?? {},
      },
      {
        provide: RuleEngine,
        useFactory: (config: RuleEngineConfig) => {
          const engine = new RuleEngine(config);
          return engine;
        },
        inject: ['RULE_ENGINE_CONFIG'],
      },
      RuleEngineService,
    ];

    return {
      module: RuleEngineModule,
      global: options.global ?? false,
      providers,
      exports: [RuleEngine, RuleEngineService],
    };
  }

  static forRoot(options: RuleEngineModuleOptions = {}): DynamicModule {
    return this.register({ ...options, global: true });
  }
}
