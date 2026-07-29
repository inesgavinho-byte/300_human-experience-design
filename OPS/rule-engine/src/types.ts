export interface RuleExecutionResult {
  ruleCode: string;
  inputs: Record<string, any>;
  outputs: Record<string, any>;
  confidence: number;
  executionTimeMs: number;
}

export interface EngineeringRule {
  code: string;
  name: string;
  category: string;
  ruleExpression: string;
  ruleLanguage: 'javascript' | 'json_logic';
  parameters: Record<string, any>;
}

export interface RuleExecutionContext {
  room: { area_m2: number; function: string; orientation?: string };
  level: 'essential' | 'recommended' | 'signature';
  buildingType?: string;
}
