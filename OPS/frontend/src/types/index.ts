export type ProjectStatus = 'draft' | 'active' | 'on_hold' | 'completed' | 'archived';
export type BuildingType =
  | 'apartamento'
  | 'penthouse'
  | 'moradia'
  | 'villa_grande'
  | 'edificio_multifamiliar'
  | 'hotel'
  | 'aparthotel'
  | 'resort'
  | 'escritorio'
  | 'retail'
  | 'espaco_saude'
  | 'residencia_senior';
export type SolutionLevel = 'essential' | 'recommended' | 'signature';
export type BudgetFlexibility = 'fixed' | 'flexible_10' | 'flexible_20' | 'open';
export type DetectionState = 'confirmed' | 'detected' | 'inferred' | 'to_confirm' | 'unavailable';
export type RequirementCategory =
  | 'iluminacao'
  | 'cortinas'
  | 'climatizacao'
  | 'piso_radiante'
  | 'vmc'
  | 'piscina'
  | 'spa'
  | 'sauna'
  | 'ice_bath'
  | 'audio'
  | 'video'
  | 'cinema'
  | 'controlo_voz'
  | 'tablets'
  | 'seguranca'
  | 'cctv'
  | 'controlo_acessos'
  | 'carregamento_eletrico'
  | 'fotovoltaico'
  | 'baterias'
  | 'rega'
  | 'agua'
  | 'rede'
  | 'ia_local'
  | 'aprendizagem'
  | 'atuacao_preditiva';
export type RequirementStatus = 'pending' | 'confirmed' | 'rejected' | 'superseded';
export type PrescriptionStatus = 'draft' | 'review' | 'approved' | 'rejected' | 'superseded';
export type BudgetImpactLevel = 'reducer' | 'neutral' | 'increaser' | 'critical';
export type EquipmentCategory =
  | 'iluminacao'
  | 'climatizacao'
  | 'avac'
  | 'domotica'
  | 'seguranca'
  | 'audio'
  | 'video'
  | 'rede'
  | 'energia'
  | 'agua'
  | 'automation'
  | 'outro';
export type RuleCategory =
  | 'dimensionamento'
  | 'compatibilidade'
  | 'performance'
  | 'seguranca'
  | 'regulamentar'
  | 'economia'
  | 'sustentabilidade'
  | 'outro';
export type RuleApprovalStatus = 'draft' | 'review' | 'approved' | 'rejected';
export type PatternType = 'comfort' | 'energy' | 'security' | 'maintenance' | 'usage';
export type PatternStatus = 'suggested' | 'pending' | 'approved' | 'rejected';
export type AiServerStatus = 'active' | 'inactive' | 'maintenance' | 'error';
export type RoomFunction =
  | 'estar'
  | 'jantar'
  | 'quarto'
  | 'suite'
  | 'cozinha'
  | 'wc'
  | 'hall'
  | 'corredor'
  | 'escritorio'
  | 'ginasio'
  | 'cinema'
  | 'spa'
  | 'piscina_interior'
  | 'garagem'
  | 'arrumos'
  | 'terraco'
  | 'outro';
export type RoomOrientation = 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w' | 'nw';

export interface Client {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  created_at: string;
}

export interface Project {
  id: string;
  code: string;
  name: string;
  client_id: string;
  client?: Client;
  status: ProjectStatus;
  building_type: BuildingType;
  total_area_m2: number | null;
  num_floors: number | null;
  num_rooms: number | null;
  budget_total: number | null;
  budget_flexibility: BudgetFlexibility;
  solution_level: SolutionLevel;
  client_profile: Record<string, unknown>;
  created_by: string;
  created_at: string;
  updated_at: string;
  version: number;
  approved_by: string | null;
  approved_at: string | null;
  metadata: Record<string, unknown>;
}

export interface Building {
  id: string;
  project_id: string;
  name: string;
  total_area_m2: number | null;
  num_floors: number | null;
  orientation: number | null;
  address: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  floors?: Floor[];
}

export interface Floor {
  id: string;
  building_id: string;
  floor_number: number;
  name: string | null;
  area_m2: number | null;
  height_m: number | null;
  plan_dwg_url: string | null;
  plan_image_url: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  rooms?: Room[];
}

export interface Room {
  id: string;
  floor_id: string;
  name: string;
  function: RoomFunction;
  area_m2: number | null;
  orientation: RoomOrientation | null;
  detection_state: DetectionState;
  has_windows: boolean;
  num_windows: number;
  has_balcony: boolean;
  is_wet_zone: boolean;
  is_circulation: boolean;
  is_technical: boolean;
  is_staff_area: boolean;
  functional_requirements: Record<string, unknown>;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface Requirement {
  id: string;
  project_id: string;
  room_id: string | null;
  category: RequirementCategory;
  subcategory: string | null;
  description: string;
  level_essential: boolean;
  level_recommended: boolean;
  level_signature: boolean;
  status: RequirementStatus;
  priority: number;
  source: string;
  source_reference: string | null;
  validated_by: string | null;
  validated_at: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface Prescription {
  id: string;
  project_id: string;
  system_id: string | null;
  subsystem_id: string | null;
  room_id: string | null;
  equipment_id: string | null;
  code: string;
  version: number;
  functional_requirement: string;
  technical_requirement: string;
  min_performance: string | null;
  sizing_criterion: string | null;
  reference_solution: string | null;
  acceptable_alternatives: unknown[];
  selected_equipment_brand: string | null;
  selected_equipment_ref: string | null;
  required_infrastructure: string | null;
  integrations: unknown[];
  protocols: unknown[];
  acceptance_criterion: string | null;
  test_method: string | null;
  applicable_standard: string | null;
  responsible_validation: string | null;
  origin: string | null;
  status: PrescriptionStatus;
  priority: number;
  estimated_cost: number | null;
  budget_impact: BudgetImpactLevel;
  dependencies: unknown[];
  risks: unknown[];
  exceptions: unknown[];
  pending_items: unknown[];
  created_by: string;
  created_at: string;
  approved_by: string | null;
  approved_at: string | null;
  superseded_by: string | null;
}

export interface EquipmentLibraryItem {
  id: string;
  brand: string;
  reference: string;
  category: EquipmentCategory;
  description: string | null;
  dimensions_mm: Record<string, unknown> | null;
  weight_kg: number | null;
  mount_type: string | null;
  din_units: number | null;
  power_w: number | null;
  dissipation_w: number | null;
  voltage_v: number | null;
  protocols: unknown[];
  inputs: unknown[];
  outputs: unknown[];
  ip_rating: string | null;
  ik_rating: string | null;
  noise_db: number | null;
  compatibilities: unknown[];
  list_price: number | null;
  discount_pct: number;
  net_price: number | null;
  currency: string;
  price_valid_until: string | null;
  lead_time_days: number | null;
  supplier_id: string | null;
  warranty_months: number | null;
  maintenance_schedule: string | null;
  documentation_url: string | null;
  is_active: boolean;
  last_updated: string;
  updated_by: string | null;
}

export interface Supplier {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  country: string | null;
  website: string | null;
  created_at: string;
}

export interface EngineeringRule {
  id: string;
  code: string;
  name: string;
  description: string | null;
  category: RuleCategory;
  applies_to_type: BuildingType[];
  rule_expression: string;
  rule_language: 'javascript' | 'python' | 'sql' | 'json_logic';
  parameters: Record<string, unknown>;
  preconditions: unknown[];
  exclusions: unknown[];
  incompatibilities: unknown[];
  source: string | null;
  version: number;
  author: string | null;
  approval_status: RuleApprovalStatus;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AiLocalServer {
  id: string;
  project_id: string;
  model: string;
  serial_number: string | null;
  ip_address: string | null;
  mac_address: string | null;
  cpu_cores: number | null;
  ram_gb: number | null;
  storage_gb: number | null;
  gpu_model: string | null;
  gpu_vram_gb: number | null;
  status: AiServerStatus;
  last_heartbeat: string | null;
  uptime_seconds: number | null;
  installed_models: unknown[];
  config: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface AiLearnedPattern {
  id: string;
  server_id: string;
  project_id: string;
  pattern_name: string;
  pattern_type: PatternType;
  description: string | null;
  trigger_conditions: Record<string, unknown>;
  proposed_actions: Record<string, unknown>;
  confidence_score: number | null;
  occurrence_count: number;
  first_seen_at: string | null;
  last_seen_at: string | null;
  status: PatternStatus;
  approved_by: string | null;
  approved_at: string | null;
  rejected_by: string | null;
  rejected_at: string | null;
  rejection_reason: string | null;
  rule_scope: string | null;
  affected_users: unknown[];
  max_executions: number | null;
  execution_count: number;
  execution_history: unknown[];
  can_auto_revert: boolean;
  revert_after_minutes: number | null;
  created_at: string;
  updated_at: string;
}

export type ProposalStatus = 'draft' | 'review' | 'approved' | 'rejected';

export interface Proposal {
  id: string;
  project_id: string;
  level: SolutionLevel;
  title: string;
  description: string;
  total_cost: number;
  equipment_cost: number;
  installation_cost: number;
  programming_cost: number;
  maintenance_cost_annual: number;
  estimated_duration_weeks: number;
  included_systems: string[];
  excluded_systems: string[];
  status: ProposalStatus;
  created_at: string;
}
