export type RuleCategory = 'iluminacao' | 'climatizacao' | 'audio' | 'cortinas' | 'rede' | 'seguranca' | 'automation' | 'energia';
export type RuleLanguage = 'javascript' | 'python' | 'sql' | 'json_logic';
export type SolutionLevel = 'essential' | 'recommended' | 'signature';
export type DetectionState = 'confirmed' | 'detected' | 'inferred' | 'to_confirm';
export interface Project {
    id: string;
    name: string;
    building_type?: string;
    budget?: number;
    currency?: string;
    total_area_m2?: number;
    room_count?: number;
    created_at: string;
    updated_at: string;
}
export interface Building {
    id: string;
    project_id: string;
    name: string;
    floors_count: number;
    total_area_m2: number;
}
export interface Floor {
    id: string;
    building_id: string;
    name: string;
    level: number;
    area_m2: number;
}
export interface Room {
    id: string;
    floor_id: string;
    name: string;
    function: string;
    area_m2: number;
    detection_state: DetectionState;
    perimeter_m?: number;
    height_m?: number;
    windows_count?: number;
    orientation?: string;
    metadata?: Record<string, any>;
}
export interface Requirement {
    id: string;
    project_id: string;
    category: RuleCategory;
    key: string;
    value: any;
    source: 'explicit' | 'inferred' | 'default';
    priority: number;
}
export interface EquipmentLibraryItem {
    id: string;
    category: RuleCategory;
    sku: string;
    name: string;
    specifications: Record<string, any>;
    unit_cost?: number;
    currency?: string;
    compatibility: string[];
}
export interface EngineeringRule {
    id: string;
    code: string;
    name: string;
    description?: string;
    category: RuleCategory;
    rule_expression: string;
    rule_language: RuleLanguage;
    parameters: Record<string, any>;
    preconditions?: Record<string, any>;
    exclusions?: Record<string, any>;
    output_schema?: Record<string, any>;
    version: number;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}
export interface BuiltInRule {
    code: string;
    name: string;
    category: RuleCategory;
    description?: string;
    parameters: Record<string, any>;
    preconditions?: Record<string, any>;
    exclusions?: Record<string, any>;
    execute: (context: RuleExecutionContext) => Record<string, any> | Promise<Record<string, any>>;
}
export interface RuleExecutionContext {
    project: Project;
    building?: Building;
    floor?: Floor;
    room?: Room;
    requirements: Requirement[];
    solutionLevel: SolutionLevel;
    equipmentLibrary: EquipmentLibraryItem[];
}
export interface RuleExecutionResult {
    ruleId: string;
    ruleCode: string;
    inputs: Record<string, any>;
    outputs: Record<string, any>;
    confidence: number;
    executionTimeMs: number;
    logs: string[];
    errors: string[];
}
export interface EvaluateAllOptions {
    category?: RuleCategory;
    solutionLevel?: SolutionLevel;
    ruleCodes?: string[];
    skipInactive?: boolean;
}
export interface RuleEngineConfig {
    dbConnectionString?: string;
    maxExecutionTimeMs?: number;
    defaultConfidenceBase?: number;
    enableLogging?: boolean;
    builtinRulesDirectory?: string;
}
//# sourceMappingURL=rule.types.d.ts.map