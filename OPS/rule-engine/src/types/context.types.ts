import { RuleExecutionContext } from './rule.types';

// ============================================================================
// Context Builder Types
// ============================================================================

export interface ContextBuilderOptions {
  projectId: string;
  buildingId?: string;
  floorId?: string;
  roomId?: string;
  solutionLevel?: 'essential' | 'recommended' | 'signature';
}

export interface FetchedData {
  project: any;
  building?: any;
  floor?: any;
  room?: any;
  requirements: any[];
  equipmentLibrary: any[];
}

// Placeholder for database adapter interface
export interface DatabaseAdapter {
  query(sql: string, params?: any[]): Promise<any[]>;
  getProject(id: string): Promise<any>;
  getBuilding(id: string): Promise<any>;
  getFloor(id: string): Promise<any>;
  getRoom(id: string): Promise<any>;
  getRequirements(projectId: string, category?: string): Promise<any[]>;
  getEquipmentLibrary(category?: string): Promise<any[]>;
  getRules(category?: string): Promise<any[]>;
}

// Derived values computed by the context builder
export interface DerivedValues {
  totalBuildingArea?: number;
  totalFloorArea?: number;
  roomCount?: number;
  floorCount?: number;
  avgRoomArea?: number;
  requirementsByCategory: Record<string, any[]>;
  equipmentByCategory: Record<string, any[]>;
}

// Extended context with derived values
export interface ExtendedRuleExecutionContext extends RuleExecutionContext {
  derived: DerivedValues;
}
