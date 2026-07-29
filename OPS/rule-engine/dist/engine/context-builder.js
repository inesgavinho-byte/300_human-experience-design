"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContextBuilder = void 0;
const logger_1 = require("../utils/logger");
/**
 * Build a RuleExecutionContext from database records.
 *
 * This fetches the relevant project, building, floor, room, requirements,
 * and equipment library items, then computes derived values.
 */
class ContextBuilder {
    config;
    logger = (0, logger_1.getLogger)();
    constructor(config = {}) {
        this.config = config;
    }
    /**
     * Build context from IDs.
     */
    async buildContext(options) {
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
    buildContextFromData(data) {
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
    buildMinimalContext(options) {
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
    computeDerivedValues(data) {
        const requirementsByCategory = {};
        for (const req of data.requirements) {
            if (!requirementsByCategory[req.category]) {
                requirementsByCategory[req.category] = [];
            }
            requirementsByCategory[req.category].push(req);
        }
        const equipmentByCategory = {};
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
exports.ContextBuilder = ContextBuilder;
//# sourceMappingURL=context-builder.js.map