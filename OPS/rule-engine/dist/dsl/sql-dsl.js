"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.executeSql = executeSql;
const logger_1 = require("../utils/logger");
async function executeSql(expression, context, options = {}) {
    const logger = (0, logger_1.getLogger)();
    const startTime = Date.now();
    logger.debug('Executing SQL DSL');
    try {
        const paramRegex = /:([a-zA-Z_][a-zA-Z0-9_]*)/g;
        const matches = [...expression.matchAll(paramRegex)];
        const params = new Set(matches.map(m => m[1]));
        const flatContext = {
            'project_id': context.project.id,
            'project_name': context.project.name,
            'building_type': context.project.building_type,
            'budget': context.project.budget,
            'total_area_m2': context.project.total_area_m2,
            'room_count': context.project.room_count,
            'solution_level': context.solutionLevel,
        };
        if (context.building) {
            flatContext['building_id'] = context.building.id;
            flatContext['building_name'] = context.building.name;
            flatContext['floors_count'] = context.building.floors_count;
        }
        if (context.floor) {
            flatContext['floor_id'] = context.floor.id;
            flatContext['floor_name'] = context.floor.name;
            flatContext['floor_level'] = context.floor.level;
        }
        if (context.room) {
            flatContext['room_id'] = context.room.id;
            flatContext['room_name'] = context.room.name;
            flatContext['room_function'] = context.room.function;
            flatContext['area_m2'] = context.room.area_m2;
            flatContext['perimeter_m'] = context.room.perimeter_m;
            flatContext['height_m'] = context.room.height_m;
            flatContext['windows_count'] = context.room.windows_count;
            flatContext['orientation'] = context.room.orientation;
        }
        if (options.dbAdapter) {
            const result = await options.dbAdapter.query(expression, flatContext);
            if (result && result.length > 0) {
                return {
                    success: true,
                    outputs: result[0],
                    logs: [`Executed SQL with ${params.size} parameters`],
                    executionTimeMs: Date.now() - startTime,
                };
            }
            return {
                success: false,
                error: 'SQL query returned no results',
                logs: [],
                executionTimeMs: Date.now() - startTime,
            };
        }
        const outputs = {};
        const columnRegex = /SELECT\s+(.+?)(?:\s+FROM|$)/i;
        const columnMatch = expression.match(columnRegex);
        if (columnMatch) {
            const columnsPart = columnMatch[1];
            const columnDefs = columnsPart.split(',').map(s => s.trim());
            for (const colDef of columnDefs) {
                const aliasMatch = colDef.match(/(?:.+?)\s+AS\s+([a-zA-Z_][a-zA-Z0-9_]*)/i);
                if (aliasMatch) {
                    const alias = aliasMatch[1];
                    const exprPart = colDef.replace(/\s+AS\s+.+$/i, '').trim();
                    try {
                        const value = evaluateSqlExpression(exprPart, flatContext);
                        if (value !== undefined) {
                            outputs[alias] = value;
                        }
                    }
                    catch {
                        outputs[alias] = null;
                    }
                }
            }
        }
        return {
            success: true,
            outputs,
            logs: [`SQL simulation mode: resolved ${Object.keys(outputs).length} columns`],
            executionTimeMs: Date.now() - startTime,
        };
    }
    catch (err) {
        const error = err?.message ?? String(err);
        logger.error('SQL execution failed', { error });
        return {
            success: false,
            error,
            logs: [],
            executionTimeMs: Date.now() - startTime,
        };
    }
}
function evaluateSqlExpression(expr, context) {
    let jsExpr = expr.replace(/:([a-zA-Z_][a-zA-Z0-9_]*)/g, (match, paramName) => {
        const value = context[paramName];
        if (value === undefined) {
            throw new Error(`Unknown parameter: ${paramName}`);
        }
        return typeof value === 'string' ? `"${value}"` : String(value);
    });
    jsExpr = jsExpr
        .replace(/\bCEIL\b/gi, 'Math.ceil')
        .replace(/\bFLOOR\b/gi, 'Math.floor')
        .replace(/\bROUND\b/gi, 'Math.round')
        .replace(/\bABS\b/gi, 'Math.abs')
        .replace(/\bPOWER\b/gi, 'Math.pow')
        .replace(/\bSQRT\b/gi, 'Math.sqrt');
    const func = new Function(`return (${jsExpr});`);
    return func();
}
//# sourceMappingURL=sql-dsl.js.map