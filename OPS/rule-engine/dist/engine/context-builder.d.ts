import { RuleExecutionContext, Project, Building, Floor, Room, Requirement, EquipmentLibraryItem, SolutionLevel } from '../types/rule.types';
import { DatabaseAdapter } from '../types/context.types';
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
export declare class ContextBuilder {
    private config;
    private logger;
    constructor(config?: ContextBuilderConfig);
    /**
     * Build context from IDs.
     */
    buildContext(options: {
        projectId: string;
        buildingId?: string;
        floorId?: string;
        roomId?: string;
        solutionLevel?: SolutionLevel;
    }): Promise<RuleExecutionContext>;
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
    }): RuleExecutionContext;
    private buildMinimalContext;
    private computeDerivedValues;
}
//# sourceMappingURL=context-builder.d.ts.map