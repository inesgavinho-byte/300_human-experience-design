import {
  RuleExecutionContext,
  Project,
  Building,
  Floor,
  Room,
  Requirement,
  EquipmentLibraryItem,
  SolutionLevel,
} from '../types/rule.types';
import { DerivedValues, DatabaseAdapter } from '../types/context.types';
import { getLogger } from '../utils/logger';

// ============================================================================
// Context Builder
// ============================================================================

export interface ContextBuilderConfig {
  dbAdapter?: DatabaseAdapter;
  mockData?: boolean;
}

/**
 * Build a RuleExecutionContext from database records.
 *
 * This fetches the relevant project, building, floor, room, requirements,
 * and equipment library items, then computes derived values.
 */
export class ContextBuilder {
  private logger = getLogger();

  constructor(private config: ContextBuilderConfig = {}) {}

  /**
   * Build context from IDs.
   */
  async buildContext(options: {
    projectId: string;
    buildingId?: string;
    floorId?: string;
    roomId?: string;
    solutionLevel?: SolutionLevel;
  }): Promise<RuleExecutionContext> {
    this.logger.info('Building execution context', { ...options });

    const { dbAdapter } = this.config;

    if (!dbAdapter) {
      // Return a minimal context for testing
      return this.buildMinimalContext(options);
    }

    const [project, building, floor, room, requirements, equipmentLibrary] = await Promise.all([
      dbAdapter.getProject(options.projectId),
      options.buildingId ? dbAdapter.getBuilding(options.buildingId) : Promise.resolve(undefined),
      options.floorId ? dbAdapter.getFloor(options.floorId) : Promise.resolve(undefined),
      options.roomId ? dbAdapter.getRoom(options.roomId) : Promise.resolve(undefined),
      dbAdapter.getRequirements(options.projectId),
      dbAdapter.getEquipmentLibrary(),
    ]);

    const derived = this.computeDerivedValues({
      project,
      building,
      floor,
      room,
      requirements,
      equipmentLibrary,
    });

    return {
      project,
      building,
      floor,
      room,
      requirements,
      solutionLevel: options.solutionLevel ?? 'recommended',
      equipmentLibrary,
    };
  }

  /**
   * Build a context from already-fetched data objects.
   */
  buildContextFromData(data: {
    project: Project;
    building?: Building;
    floor?: Floor;
    room?: Room;
    requirements?: Requirement[];
    solutionLevel?: SolutionLevel;
    equipmentLibrary?: EquipmentLibraryItem[];
  }): RuleExecutionContext {
    return {
      project: data.project,
      building: data.building,
      floor: data.floor,
      room: data.room,
      requirements: data.requirements ?? [],
      solutionLevel: data.solutionLevel ?? 'recommended',
      equipmentLibrary: data.equipmentLibrary ?? [],
    };
  }

  private buildMinimalContext(options: {
    projectId: string;
    solutionLevel?: SolutionLevel;
  }): RuleExecutionContext {
    return {
      project: {
        id: options.projectId,
        name: 'Test Project',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      requirements: [],
      solutionLevel: options.solutionLevel ?? 'recommended',
      equipmentLibrary: [],
    };
  }

  private computeDerivedValues(data: {
    project: Project;
    building?: Building;
    floor?: Floor;
    room?: Room;
    requirements: Requirement[];
    equipmentLibrary: EquipmentLibraryItem[];
  }): DerivedValues {
    const requirementsByCategory: Record<string, Requirement[]> = {};
    for (const req of data.requirements) {
      if (!requirementsByCategory[req.category]) {
        requirementsByCategory[req.category] = [];
      }
      requirementsByCategory[req.category].push(req);
    }

    const equipmentByCategory: Record<string, EquipmentLibraryItem[]> = {};
    for (const item of data.equipmentLibrary) {
      if (!equipmentByCategory[item.category]) {
        equipmentByCategory[item.category] = [];
      }
      equipmentByCategory[item.category].push(item);
    }

    return {
      totalBuildingArea: data.building?.total_area_m2 ?? data.project.total_area_m2,
      totalFloorArea: data.floor?.area_m2,
      roomCount: data.project.room_count,
      floorCount: data.building?.floors_count,
      avgRoomArea: data.project.total_area_m2 && data.project.room_count
        ? data.project.total_area_m2 / data.project.room_count
        : undefined,
      requirementsByCategory,
      equipmentByCategory,
    };
  }
}
