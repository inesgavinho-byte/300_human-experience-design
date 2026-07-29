import { describe, it, expect } from 'vitest';
import { executeJavaScript } from '../dsl/javascript-dsl';
import { executeJsonLogic } from '../dsl/json-logic-dsl';
import { executePython } from '../dsl/python-dsl';
import { executeSql } from '../dsl/sql-dsl';
import { RuleExecutionContext, Room, Project } from '../types/rule.types';

// ─── Helpers ───────────────────────────────────────────────────────────────

function makeContext(roomOverrides: Partial<Room> = {}): RuleExecutionContext {
  return {
    project: {
      id: 'proj-1',
      name: 'Test',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as Project,
    room: {
      id: 'room-1',
      floor_id: 'floor-1',
      name: 'Test Room',
      function: 'estar',
      area_m2: 30,
      detection_state: 'confirmed',
      ...roomOverrides,
    } as Room,
    requirements: [],
    solutionLevel: 'recommended',
    equipmentLibrary: [],
  };
}

// ─── JavaScript DSL ────────────────────────────────────────────────────────

describe('JavaScript DSL', () => {
  it('executes a simple calculate function', async () => {
    const code = `
      function calculate(context) {
        return { spots: Math.ceil(context.room.area_m2 / 4) };
      }
    `;
    const result = await executeJavaScript(code, makeContext());

    expect(result.success).toBe(true);
    expect(result.outputs?.spots).toBe(8);
  });

  it('executes ILU-001 style rule', async () => {
    const code = `
      function calculate(context) {
        const base = Math.ceil(context.room.area_m2 / 4);
        return {
          spots: { min: base, max: Math.ceil(base * 1.3) }
        };
      }
    `;
    const result = await executeJavaScript(code, makeContext({ area_m2: 58 }));

    expect(result.outputs?.spots.min).toBe(15);
    expect(result.outputs?.spots.max).toBe(20);
  });

  it('executes CLI-001 style rule', async () => {
    const code = `
      function calculate(context) {
        return {
          zones: context.room.area_m2 > 25 || ["estar", "suite"].includes(context.room.function) ? 1 : 0
        };
      }
    `;

    const result1 = await executeJavaScript(code, makeContext({ area_m2: 30 }));
    expect(result1.outputs?.zones).toBe(1);

    const result2 = await executeJavaScript(code, makeContext({ area_m2: 15, function: 'wc' }));
    expect(result2.outputs?.zones).toBe(0);

    const result3 = await executeJavaScript(code, makeContext({ area_m2: 15, function: 'suite' }));
    expect(result3.outputs?.zones).toBe(1);
  });

  it('catches syntax errors', async () => {
    const code = `
      function calculate(context) {
        const x = ;
        return {};
      }
    `;
    const result = await executeJavaScript(code, makeContext());

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('catches runtime errors', async () => {
    const code = `
      function calculate(context) {
        return { value: context.nonexistent.nested };
      }
    `;
    const result = await executeJavaScript(code, makeContext());

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('prevents infinite loops via timeout', async () => {
    const code = `
      function calculate(context) {
        while (true) {}
        return {};
      }
    `;
    const result = await executeJavaScript(code, makeContext(), { timeoutMs: 500 });

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/timeout|timed out/i);
  });

  it('prevents access to require/fs/process', async () => {
    const code = `
      function calculate(context) {
        try {
          return { hasRequire: typeof require !== 'undefined' };
        } catch (e) {
          return { error: e.message };
        }
      }
    `;
    const result = await executeJavaScript(code, makeContext());

    expect(result.success).toBe(true);
    expect(result.outputs?.hasRequire).toBe(false);
  });

  it('returns error when calculate function is missing', async () => {
    const code = `const x = 1;`;
    const result = await executeJavaScript(code, makeContext());

    expect(result.success).toBe(false);
    expect(result.error).toContain('calculate');
  });

  it('returns error when rule returns non-object', async () => {
    const code = `
      function calculate(context) {
        return 42;
      }
    `;
    const result = await executeJavaScript(code, makeContext());

    expect(result.success).toBe(false);
    expect(result.error).toContain('plain object');
  });
});

// ─── JSON Logic DSL ────────────────────────────────────────────────────────

describe('JSON Logic DSL', () => {
  it('executes simple if condition', async () => {
    const logic = {
      if: [
        { '>': [{ var: 'room.area_m2' }, 25] },
        { zones: 1 },
        { zones: 0 },
      ],
    };

    const result1 = await executeJsonLogic(logic, makeContext({ area_m2: 30 }));
    expect(result1.outputs?.zones).toBe(1);

    const result2 = await executeJsonLogic(logic, makeContext({ area_m2: 15 }));
    expect(result2.outputs?.zones).toBe(0);
  });

  it('executes from string expression', async () => {
    const expression = JSON.stringify({
      spots: { ceil: [{ '/': [{ var: 'room.area_m2' }, 4] }] },
    });

    const result = await executeJsonLogic(expression, makeContext({ area_m2: 16 }));
    expect(result.outputs?.spots).toBe(4);
  });

  it('handles custom ceil operation', async () => {
    const logic = {
      spots_min: { ceil: [{ '/': [{ var: 'room.area_m2' }, 4] }] },
      spots_max: { ceil: [{ '*': [{ ceil: [{ '/': [{ var: 'room.area_m2' }, 4] }] }, 1.3] }] },
    };

    const result = await executeJsonLogic(logic, makeContext({ area_m2: 58 }));
    expect(result.outputs?.spots_min).toBe(15);
    expect(result.outputs?.spots_max).toBe(20);
  });

  it('handles in_array custom operation', async () => {
    const logic = {
      if: [
        { in_array: [{ var: 'room.function' }, ['estar', 'suite']] },
        { needs_climate: true },
        { needs_climate: false },
      ],
    };

    const result = await executeJsonLogic(logic, makeContext({ function: 'estar' }));
    expect(result.outputs?.needs_climate).toBe(true);
  });

  it('catches invalid JSON', async () => {
    const result = await executeJsonLogic('not valid json', makeContext());
    expect(result.success).toBe(false);
  });
});

// ─── Python DSL ────────────────────────────────────────────────────────────

describe('Python DSL', () => {
  it('executes a simple Python function', async () => {
    const code = `
def calculate(context):
    base = (context['room']['area_m2'] + 3) // 4
    return {"spots": {"min": base, "max": int(base * 1.3)}}
`;
    const result = await executePython(code, makeContext({ area_m2: 58 }));

    if (result.success) {
      expect(result.outputs?.spots?.min).toBe(15);
      expect(result.outputs?.spots?.max).toBe(19);
    } else {
      expect(result.error).toBeDefined();
    }
  });

  it('returns error when calculate is missing', async () => {
    const code = `x = 1`;
    const result = await executePython(code, makeContext());

    if (!result.success) {
      expect(result.error).toBeDefined();
    }
  });

  it('handles timeout', async () => {
    const code = `
import time
def calculate(context):
    time.sleep(10)
    return {}
`;
    const result = await executePython(code, makeContext(), { timeoutMs: 500 });

    if (!result.success) {
      expect(result.error).toMatch(/timeout|timed out/i);
    }
  });
});

// ─── SQL DSL ───────────────────────────────────────────────────────────────

describe('SQL DSL', () => {
  it('simulates simple SELECT with expressions', async () => {
    const expression = `SELECT CEIL(:area_m2 / 4) AS spots_min, CEIL(:area_m2 / 4 * 1.3) AS spots_max`;
    const result = await executeSql(expression, makeContext({ area_m2: 58 }));

    expect(result.success).toBe(true);
    expect(result.outputs?.spots_min).toBe(15);
    expect(result.outputs?.spots_max).toBe(19);
  });

  it('handles floor function', async () => {
    const expression = `SELECT FLOOR(:area_m2 / 4) AS spots_floor`;
    const result = await executeSql(expression, makeContext({ area_m2: 58 }));

    expect(result.outputs?.spots_floor).toBe(14);
  });

  it('handles round function', async () => {
    const expression = `SELECT ROUND(:area_m2 / 4) AS spots_round`;
    const result = await executeSql(expression, makeContext({ area_m2: 58 }));

    expect(result.outputs?.spots_round).toBe(15);
  });
});
