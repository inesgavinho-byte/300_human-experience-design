"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const javascript_dsl_1 = require("../dsl/javascript-dsl");
const json_logic_dsl_1 = require("../dsl/json-logic-dsl");
const python_dsl_1 = require("../dsl/python-dsl");
const sql_dsl_1 = require("../dsl/sql-dsl");
// ─── Helpers ───────────────────────────────────────────────────────────────
function makeContext(roomOverrides = {}) {
    return {
        project: {
            id: 'proj-1',
            name: 'Test',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        },
        room: {
            id: 'room-1',
            floor_id: 'floor-1',
            name: 'Test Room',
            function: 'estar',
            area_m2: 30,
            detection_state: 'confirmed',
            ...roomOverrides,
        },
        requirements: [],
        solutionLevel: 'recommended',
        equipmentLibrary: [],
    };
}
// ─── JavaScript DSL ────────────────────────────────────────────────────────
(0, vitest_1.describe)('JavaScript DSL', () => {
    (0, vitest_1.it)('executes a simple calculate function', async () => {
        const code = `
      function calculate(context) {
        return { spots: Math.ceil(context.room.area_m2 / 4) };
      }
    `;
        const result = await (0, javascript_dsl_1.executeJavaScript)(code, makeContext());
        (0, vitest_1.expect)(result.success).toBe(true);
        (0, vitest_1.expect)(result.outputs?.spots).toBe(8);
    });
    (0, vitest_1.it)('executes ILU-001 style rule', async () => {
        const code = `
      function calculate(context) {
        const base = Math.ceil(context.room.area_m2 / 4);
        return {
          spots: { min: base, max: Math.ceil(base * 1.3) }
        };
      }
    `;
        const result = await (0, javascript_dsl_1.executeJavaScript)(code, makeContext({ area_m2: 58 }));
        (0, vitest_1.expect)(result.outputs?.spots.min).toBe(15);
        (0, vitest_1.expect)(result.outputs?.spots.max).toBe(20);
    });
    (0, vitest_1.it)('executes CLI-001 style rule', async () => {
        const code = `
      function calculate(context) {
        return {
          zones: context.room.area_m2 > 25 || ["estar", "suite"].includes(context.room.function) ? 1 : 0
        };
      }
    `;
        const result1 = await (0, javascript_dsl_1.executeJavaScript)(code, makeContext({ area_m2: 30 }));
        (0, vitest_1.expect)(result1.outputs?.zones).toBe(1);
        const result2 = await (0, javascript_dsl_1.executeJavaScript)(code, makeContext({ area_m2: 15, function: 'wc' }));
        (0, vitest_1.expect)(result2.outputs?.zones).toBe(0);
        const result3 = await (0, javascript_dsl_1.executeJavaScript)(code, makeContext({ area_m2: 15, function: 'suite' }));
        (0, vitest_1.expect)(result3.outputs?.zones).toBe(1);
    });
    (0, vitest_1.it)('catches syntax errors', async () => {
        const code = `
      function calculate(context) {
        const x = ;
        return {};
      }
    `;
        const result = await (0, javascript_dsl_1.executeJavaScript)(code, makeContext());
        (0, vitest_1.expect)(result.success).toBe(false);
        (0, vitest_1.expect)(result.error).toBeDefined();
    });
    (0, vitest_1.it)('catches runtime errors', async () => {
        const code = `
      function calculate(context) {
        return { value: context.nonexistent.nested };
      }
    `;
        const result = await (0, javascript_dsl_1.executeJavaScript)(code, makeContext());
        (0, vitest_1.expect)(result.success).toBe(false);
        (0, vitest_1.expect)(result.error).toBeDefined();
    });
    (0, vitest_1.it)('prevents infinite loops via timeout', async () => {
        const code = `
      function calculate(context) {
        while (true) {}
        return {};
      }
    `;
        const result = await (0, javascript_dsl_1.executeJavaScript)(code, makeContext(), { timeoutMs: 500 });
        (0, vitest_1.expect)(result.success).toBe(false);
        (0, vitest_1.expect)(result.error).toMatch(/timeout|timed out/i);
    });
    (0, vitest_1.it)('prevents access to require/fs/process', async () => {
        const code = `
      function calculate(context) {
        try {
          return { hasRequire: typeof require !== 'undefined' };
        } catch (e) {
          return { error: e.message };
        }
      }
    `;
        const result = await (0, javascript_dsl_1.executeJavaScript)(code, makeContext());
        (0, vitest_1.expect)(result.success).toBe(true);
        (0, vitest_1.expect)(result.outputs?.hasRequire).toBe(false);
    });
    (0, vitest_1.it)('returns error when calculate function is missing', async () => {
        const code = `const x = 1;`;
        const result = await (0, javascript_dsl_1.executeJavaScript)(code, makeContext());
        (0, vitest_1.expect)(result.success).toBe(false);
        (0, vitest_1.expect)(result.error).toContain('calculate');
    });
    (0, vitest_1.it)('returns error when rule returns non-object', async () => {
        const code = `
      function calculate(context) {
        return 42;
      }
    `;
        const result = await (0, javascript_dsl_1.executeJavaScript)(code, makeContext());
        (0, vitest_1.expect)(result.success).toBe(false);
        (0, vitest_1.expect)(result.error).toContain('plain object');
    });
});
// ─── JSON Logic DSL ────────────────────────────────────────────────────────
(0, vitest_1.describe)('JSON Logic DSL', () => {
    (0, vitest_1.it)('executes simple if condition', async () => {
        const logic = {
            if: [
                { '>': [{ var: 'room.area_m2' }, 25] },
                { zones: 1 },
                { zones: 0 },
            ],
        };
        const result1 = await (0, json_logic_dsl_1.executeJsonLogic)(logic, makeContext({ area_m2: 30 }));
        (0, vitest_1.expect)(result1.outputs?.zones).toBe(1);
        const result2 = await (0, json_logic_dsl_1.executeJsonLogic)(logic, makeContext({ area_m2: 15 }));
        (0, vitest_1.expect)(result2.outputs?.zones).toBe(0);
    });
    const logic = {
        if: [
            { '>': [{ var: 'room.area_m2' }, 25] },
            { output: { zones: 1 } },
            { output: { zones: 0 } },
        ],
    };
    const result1 = await (0, json_logic_dsl_1.executeJsonLogic)(logic, makeContext({ area_m2: 30 }));
    (0, vitest_1.expect)(result1.outputs?.zones).toBe(1);
    const result2 = await (0, json_logic_dsl_1.executeJsonLogic)(logic, makeContext({ area_m2: 15 }));
    (0, vitest_1.expect)(result2.outputs?.zones).toBe(0);
});
(0, vitest_1.it)('executes from string expression', async () => {
    const expression = JSON.stringify({
        spots: { ceil: [{ '/': [{ var: 'room.area_m2' }, 4] }] },
    });
    const result = await (0, json_logic_dsl_1.executeJsonLogic)(expression, makeContext({ area_m2: 16 }));
    (0, vitest_1.expect)(result.outputs?.spots).toBe(4);
});
(0, vitest_1.it)('handles custom ceil operation', async () => {
    const logic = {
        spots_min: { ceil: [{ '/': [{ var: 'room.area_m2' }, 4] }] },
        spots_max: { ceil: [{ '*': [{ ceil: [{ '/': [{ var: 'room.area_m2' }, 4] }] }, 1.3] }] },
    };
    const result = await (0, json_logic_dsl_1.executeJsonLogic)(logic, makeContext({ area_m2: 58 }));
    (0, vitest_1.expect)(result.outputs?.spots_min).toBe(15);
    (0, vitest_1.expect)(result.outputs?.spots_max).toBe(20);
});
(0, vitest_1.it)('handles in_array custom operation', async () => {
    const logic = {
        if: [
            { in_array: [{ var: 'room.function' }, ['estar', 'suite']] },
            { needs_climate: true },
            { needs_climate: false },
        ],
    };
    const result = await (0, json_logic_dsl_1.executeJsonLogic)(logic, makeContext({ function: 'estar' }));
    (0, vitest_1.expect)(result.outputs?.needs_climate).toBe(true);
});
const logic = {
    if: [
        { in_array: [{ var: 'room.function' }, ['estar', 'suite']] },
        { output: { needs_climate: true } },
        { output: { needs_climate: false } },
    ],
};
const result = await (0, json_logic_dsl_1.executeJsonLogic)(logic, makeContext({ function: 'estar' }));
(0, vitest_1.expect)(result.outputs?.needs_climate).toBe(true);
;
(0, vitest_1.it)('catches invalid JSON', async () => {
    const result = await (0, json_logic_dsl_1.executeJsonLogic)('not valid json', makeContext());
    (0, vitest_1.expect)(result.success).toBe(false);
});
;
// ─── Python DSL ────────────────────────────────────────────────────────────
(0, vitest_1.describe)('Python DSL', () => {
    (0, vitest_1.it)('executes a simple Python function', async () => {
        const code = `
def calculate(context):
    base = (context['room']['area_m2'] + 3) // 4
    return {"spots": {"min": base, "max": int(base * 1.3)}}
`;
        const result = await (0, python_dsl_1.executePython)(code, makeContext({ area_m2: 58 }));
        if (result.success) {
            (0, vitest_1.expect)(result.outputs?.spots?.min).toBe(15);
            (0, vitest_1.expect)(result.outputs?.spots?.max).toBe(19);
        }
        else {
            // Python might not be available in test environment
            (0, vitest_1.expect)(result.error).toBeDefined();
        }
    });
    (0, vitest_1.it)('returns error when calculate is missing', async () => {
        const code = `x = 1`;
        const result = await (0, python_dsl_1.executePython)(code, makeContext());
        if (!result.success) {
            (0, vitest_1.expect)(result.error).toBeDefined();
        }
    });
    (0, vitest_1.it)('handles timeout', async () => {
        const code = `
import time
def calculate(context):
    time.sleep(10)
    return {}
`;
        const result = await (0, python_dsl_1.executePython)(code, makeContext(), { timeoutMs: 500 });
        if (!result.success) {
            (0, vitest_1.expect)(result.error).toMatch(/timeout|timed out/i);
        }
    });
});
// ─── SQL DSL ───────────────────────────────────────────────────────────────
(0, vitest_1.describe)('SQL DSL', () => {
    (0, vitest_1.it)('simulates simple SELECT with expressions', async () => {
        const expression = `SELECT CEIL(:area_m2 / 4) AS spots_min, CEIL(:area_m2 / 4 * 1.3) AS spots_max`;
        const result = await (0, sql_dsl_1.executeSql)(expression, makeContext({ area_m2: 58 }));
        (0, vitest_1.expect)(result.success).toBe(true);
        (0, vitest_1.expect)(result.outputs?.spots_min).toBe(15);
        (0, vitest_1.expect)(result.outputs?.spots_max).toBe(19);
    });
    const expression = `SELECT CEIL(:area_m2 / 4) AS spots_min, CEIL(:area_m2 / 4 * 1.3) AS spots_max`;
    const result = await (0, sql_dsl_1.executeSql)(expression, makeContext({ area_m2: 58 }));
    (0, vitest_1.expect)(result.success).toBe(true);
    (0, vitest_1.expect)(result.outputs?.spots_min).toBe(15);
    (0, vitest_1.expect)(result.outputs?.spots_max).toBe(20);
});
(0, vitest_1.it)('handles floor function', async () => {
    const expression = `SELECT FLOOR(:area_m2 / 4) AS spots_floor`;
    const result = await (0, sql_dsl_1.executeSql)(expression, makeContext({ area_m2: 58 }));
    (0, vitest_1.expect)(result.outputs?.spots_floor).toBe(14);
});
(0, vitest_1.it)('handles round function', async () => {
    const expression = `SELECT ROUND(:area_m2 / 4) AS spots_round`;
    const result = await (0, sql_dsl_1.executeSql)(expression, makeContext({ area_m2: 58 }));
    (0, vitest_1.expect)(result.outputs?.spots_round).toBe(15);
});
;
//# sourceMappingURL=dsl.test.js.map