import { describe, it, expect, beforeEach } from 'vitest';
import { RuleEngine } from '../engine/rule-engine';
import {
  EngineeringRule,
  RuleExecutionContext,
  Room,
  Project,
  Requirement,
  SolutionLevel,
} from '../types/rule.types';
import {
  ILU001,
  ILU002,
  ILU003,
  CLI001,
  AUD001,
  CUR001,
  NET001,
  SEC001,
} from '../rules/built-in';

// ─── Helpers ───────────────────────────────────────────────────────────────

function makeProject(overrides: Partial<Project> = {}): Project {
  return {
    id: 'proj-1',
    name: 'Test Project',
    building_type: 'apartment',
    budget: 500000,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

function makeRoom(overrides: Partial<Room> = {}): Room {
  return {
    id: 'room-1',
    floor_id: 'floor-1',
    name: 'Test Room',
    function: 'estar',
    area_m2: 30,
    detection_state: 'confirmed',
    windows_count: 2,
    ...overrides,
  };
}

function makeContext(options: {
  room?: Room;
  level?: SolutionLevel;
  requirements?: Requirement[];
  project?: Project;
} = {}): RuleExecutionContext {
  return {
    project: options.project ?? makeProject(),
    room: 'room' in options ? options.room : makeRoom(),
    requirements: options.requirements ?? [],
    solutionLevel: options.level ?? 'recommended',
    equipmentLibrary: [],
  };
}

// ─── Built-in Rule Tests ───────────────────────────────────────────────────

describe('Built-in Rules', () => {
  let engine: RuleEngine;

  beforeEach(() => {
    engine = new RuleEngine();
    engine.registerBuiltinRules([ILU001, ILU002, ILU003, CLI001, AUD001, CUR001, NET001, SEC001]);
  });

  describe('ILU-001: Cálculo de spots', () => {
    it('calculates spots for a 16m² room', async () => {
      const ctx = makeContext({ room: makeRoom({ area_m2: 16 }) });
      const result = await engine.evaluateBuiltinRule('ILU-001', ctx);

      expect(result.errors).toHaveLength(0);
      expect(result.outputs.spots.min).toBe(4);
      expect(result.outputs.spots.max).toBe(6);
    });

    it('calculates spots for a 58m² room', async () => {
      const ctx = makeContext({ room: makeRoom({ area_m2: 58 }) });
      const result = await engine.evaluateBuiltinRule('ILU-001', ctx);

      expect(result.outputs.spots.min).toBe(15);
      expect(result.outputs.spots.max).toBe(20);
    });

    it('throws when room is missing', async () => {
      const ctx = makeContext({ room: undefined });
      const result = await engine.evaluateBuiltinRule('ILU-001', ctx);

      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('Room is required');
    });
  });

  describe('ILU-002: Circuitos de iluminação', () => {
    it('returns 2 circuits for essential level', async () => {
      const ctx = makeContext({ room: makeRoom({ area_m2: 20 }), level: 'essential' });
      const result = await engine.evaluateBuiltinRule('ILU-002', ctx);

      expect(result.outputs.circuits_iluminacao).toBe(2);
      expect(result.outputs.dimmable).toBe(false);
    });

    it('returns 3 circuits for recommended level', async () => {
      const ctx = makeContext({ room: makeRoom({ area_m2: 20 }), level: 'recommended' });
      const result = await engine.evaluateBuiltinRule('ILU-002', ctx);

      expect(result.outputs.circuits_iluminacao).toBe(3);
      expect(result.outputs.dimmable).toBe(true);
    });

    it('adds extra circuit for large rooms (>50m²)', async () => {
      const ctx = makeContext({ room: makeRoom({ area_m2: 58 }), level: 'signature' });
      const result = await engine.evaluateBuiltinRule('ILU-002', ctx);

      expect(result.outputs.circuits_iluminacao).toBe(5);
    });
  });

  describe('ILU-003: Sala 58m² Mandato', () => {
    it('applies to 58m² estar room', async () => {
      const ctx = makeContext({ room: makeRoom({ area_m2: 58, function: 'estar' }) });
      const result = await engine.evaluateBuiltinRule('ILU-003', ctx);

      expect(result.outputs.applicable).toBe(true);
      expect(result.outputs.spots.min).toBe(14);
      expect(result.outputs.spots.max).toBe(18);
      expect(result.outputs.circuits_iluminacao).toBe(3);
      expect(result.outputs.dimmable).toBe(true);
    });

    it('does not apply to small rooms', async () => {
      const ctx = makeContext({ room: makeRoom({ area_m2: 20, function: 'estar' }) });
      const result = await engine.evaluateBuiltinRule('ILU-003', ctx);

      expect(result.outputs.applicable).toBe(false);
    });
  });

  describe('CLI-001: Zonas de climatização', () => {
    it('returns zone=0 for small wc', async () => {
      const ctx = makeContext({ room: makeRoom({ area_m2: 5, function: 'wc' }) });
      const result = await engine.evaluateBuiltinRule('CLI-001', ctx);

      expect(result.outputs.zones).toBe(0);
      expect(result.outputs.requires_independent_zone).toBe(false);
    });

    it('returns zone=1 for large room', async () => {
      const ctx = makeContext({ room: makeRoom({ area_m2: 30, function: 'estar' }) });
      const result = await engine.evaluateBuiltinRule('CLI-001', ctx);

      expect(result.outputs.zones).toBe(1);
      expect(result.outputs.requires_independent_zone).toBe(true);
    });

    it('returns zone=1 for suite regardless of size', async () => {
      const ctx = makeContext({ room: makeRoom({ area_m2: 15, function: 'suite' }) });
      const result = await engine.evaluateBuiltinRule('CLI-001', ctx);

      expect(result.outputs.zones).toBe(1);
    });
  });

  describe('AUD-001: Zonas de áudio', () => {
    it('returns no audio for wc', async () => {
      const ctx = makeContext({ room: makeRoom({ area_m2: 5, function: 'wc' }) });
      const result = await engine.evaluateBuiltinRule('AUD-001', ctx);

      expect(result.outputs.zones).toBe(0);
      expect(result.outputs.speakers).toBe(0);
    });

    it('returns 2 speakers for estar essential', async () => {
      const ctx = makeContext({ room: makeRoom({ area_m2: 30, function: 'estar' }), level: 'essential' });
      const result = await engine.evaluateBuiltinRule('AUD-001', ctx);

      expect(result.outputs.speakers).toBe(2);
      expect(result.outputs.subwoofer).toBe(false);
    });

    it('returns 5 speakers + subwoofer for estar signature', async () => {
      const ctx = makeContext({ room: makeRoom({ area_m2: 30, function: 'estar' }), level: 'signature' });
      const result = await engine.evaluateBuiltinRule('AUD-001', ctx);

      expect(result.outputs.speakers).toBe(5);
      expect(result.outputs.subwoofer).toBe(true);
    });
  });

  describe('CUR-001: Cortinas', () => {
    it('returns no curtains for wc', async () => {
      const ctx = makeContext({ room: makeRoom({ area_m2: 5, function: 'wc', windows_count: 1 }) });
      const result = await engine.evaluateBuiltinRule('CUR-001', ctx);

      expect(result.outputs.applicable).toBe(false);
    });

    it('returns motorized curtains for estar', async () => {
      const ctx = makeContext({ room: makeRoom({ area_m2: 30, function: 'estar', windows_count: 3 }), level: 'recommended' });
      const result = await engine.evaluateBuiltinRule('CUR-001', ctx);

      expect(result.outputs.applicable).toBe(true);
      expect(result.outputs.motorized_curtains).toBe(3);
      expect(result.outputs.automation).toBe(true);
    });
  });

  describe('NET-001: Pontos de rede', () => {
    it('returns 2 points for essential cozinha', async () => {
      const ctx = makeContext({ room: makeRoom({ area_m2: 12, function: 'cozinha' }), level: 'essential' });
      const result = await engine.evaluateBuiltinRule('NET-001', ctx);

      expect(result.outputs.ethernet_points).toBe(2);
    });

    it('returns more points for escritorio', async () => {
      const ctx = makeContext({ room: makeRoom({ area_m2: 30, function: 'escritorio' }) });
      const result = await engine.evaluateBuiltinRule('NET-001', ctx);

      expect(result.outputs.ethernet_points).toBe(4);
    });
  });

  describe('SEC-001: Segurança', () => {
    it('returns sensors for estar', async () => {
      const ctx = makeContext({ room: makeRoom({ area_m2: 58, function: 'estar', windows_count: 2 }) });
      const result = await engine.evaluateBuiltinRule('SEC-001', ctx);

      expect(result.outputs.motion_sensors).toBeGreaterThanOrEqual(1);
      expect(result.outputs.total_devices).toBeGreaterThanOrEqual(1);
    });

    it('returns door sensor for suite', async () => {
      const ctx = makeContext({ room: makeRoom({ area_m2: 20, function: 'suite' }) });
      const result = await engine.evaluateBuiltinRule('SEC-001', ctx);

      expect(result.outputs.door_sensors).toBe(1);
    });
  });
});

// ─── Preconditions & Exclusions ────────────────────────────────────────────

describe('Preconditions and Exclusions', () => {
  let engine: RuleEngine;

  beforeEach(() => {
    engine = new RuleEngine();
  });

  it('passes when no preconditions are set', () => {
    const rule: EngineeringRule = {
      id: '1',
      code: 'TEST-001',
      name: 'Test',
      category: 'iluminacao',
      rule_expression: 'function calculate() { return {}; }',
      rule_language: 'javascript',
      parameters: {},
      version: 1,
      is_active: true,
      created_at: '',
      updated_at: '',
    };

    const ctx = makeContext();
    expect(engine.checkPreconditions(rule, ctx)).toBe(true);
    expect(engine.checkExclusions(rule, ctx)).toBe(false);
  });

  it('checks exact match preconditions', () => {
    const rule: EngineeringRule = {
      id: '1',
      code: 'TEST-001',
      name: 'Test',
      category: 'iluminacao',
      rule_expression: '',
      rule_language: 'javascript',
      parameters: {},
      preconditions: { 'room.function': 'estar' },
      version: 1,
      is_active: true,
      created_at: '',
      updated_at: '',
    };

    expect(engine.checkPreconditions(rule, makeContext({ room: makeRoom({ function: 'estar' }) }))).toBe(true);
    expect(engine.checkPreconditions(rule, makeContext({ room: makeRoom({ function: 'wc' }) }))).toBe(false);
  });

  it('checks operator preconditions ($gt, $in)', () => {
    const rule: EngineeringRule = {
      id: '1',
      code: 'TEST-001',
      name: 'Test',
      category: 'iluminacao',
      rule_expression: '',
      rule_language: 'javascript',
      parameters: {},
      preconditions: {
        'room.area_m2': { $gt: 25 },
        'room.function': { $in: ['estar', 'suite'] },
      },
      version: 1,
      is_active: true,
      created_at: '',
      updated_at: '',
    };

    expect(engine.checkPreconditions(rule, makeContext({ room: makeRoom({ area_m2: 30, function: 'estar' }) }))).toBe(true);
    expect(engine.checkPreconditions(rule, makeContext({ room: makeRoom({ area_m2: 20, function: 'estar' }) }))).toBe(false);
    expect(engine.checkPreconditions(rule, makeContext({ room: makeRoom({ area_m2: 30, function: 'wc' }) }))).toBe(false);
  });
});

// ─── Confidence Scoring ────────────────────────────────────────────────────

describe('Confidence Scoring', () => {
  let engine: RuleEngine;

  beforeEach(() => {
    engine = new RuleEngine();
  });

  function makeRule(): EngineeringRule {
    return {
      id: '1',
      code: 'TEST-001',
      name: 'Test',
      category: 'iluminacao',
      rule_expression: '',
      rule_language: 'javascript',
      parameters: {},
      version: 1,
      is_active: true,
      created_at: '',
      updated_at: '',
    };
  }

  it('calculates base confidence', () => {
    const ctx = makeContext();
    const confidence = engine.calculateConfidence(makeRule(), ctx);
    expect(confidence).toBeGreaterThanOrEqual(0.8);
    expect(confidence).toBeLessThanOrEqual(1.0);
  });

  it('reduces confidence for inferred detection state', () => {
    const confirmedCtx = makeContext({ room: makeRoom({ detection_state: 'confirmed' }) });
    const inferredCtx = makeContext({ room: makeRoom({ detection_state: 'inferred' }) });

    const confirmedConfidence = engine.calculateConfidence(makeRule(), confirmedCtx);
    const inferredConfidence = engine.calculateConfidence(makeRule(), inferredCtx);

    expect(confirmedConfidence).toBeGreaterThan(inferredConfidence);
  });

  it('increases confidence with explicit requirements', () => {
    const noReqsCtx = makeContext({ requirements: [] });
    const explicitReqsCtx = makeContext({
      requirements: [
        { id: '1', project_id: 'proj-1', category: 'iluminacao', key: 'spots', value: 10, source: 'explicit', priority: 1 },
      ],
    });

    const noReqsConf = engine.calculateConfidence(makeRule(), noReqsCtx);
    const explicitConf = engine.calculateConfidence(makeRule(), explicitReqsCtx);

    expect(explicitConf).toBeGreaterThan(noReqsConf);
  });

  it('increases confidence with budget and building type defined', () => {
    const minimalCtx = makeContext({
      project: makeProject({ budget: undefined, building_type: undefined }),
    });
    const fullCtx = makeContext({
      project: makeProject({ budget: 500000, building_type: 'apartment' }),
    });

    const minimalConf = engine.calculateConfidence(makeRule(), minimalCtx);
    const fullConf = engine.calculateConfidence(makeRule(), fullCtx);

    expect(fullConf).toBeGreaterThan(minimalConf);
  });
});

// ─── evaluateAll ───────────────────────────────────────────────────────────

describe('evaluateAll', () => {
  it('evaluates multiple rules', async () => {
    const engine = new RuleEngine();

    const rules: EngineeringRule[] = [
      {
        id: '1',
        code: 'JS-001',
        name: 'JS Test',
        category: 'iluminacao',
        rule_expression: 'function calculate(context) { return { value: context.room.area_m2 * 2 }; }',
        rule_language: 'javascript',
        parameters: {},
        version: 1,
        is_active: true,
        created_at: '',
        updated_at: '',
      },
      {
        id: '2',
        code: 'JL-001',
        name: 'JSON Logic Test',
        category: 'iluminacao',
        rule_expression: JSON.stringify({
          if: [
            { '>': [{ var: 'room.area_m2' }, 20] },
            { large: true },
            { large: false },
          ],
        }),
        rule_language: 'json_logic',
        parameters: {},
        version: 1,
        is_active: true,
        created_at: '',
        updated_at: '',
      },
    ];

    await engine.loadRules(rules);

    const ctx = makeContext({ room: makeRoom({ area_m2: 30 }) });
    const results = await engine.evaluateAll(ctx);

    expect(results).toHaveLength(2);
    expect(results[0].ruleCode).toBe('JS-001');
    expect(results[0].outputs.value).toBe(60);
    expect(results[1].ruleCode).toBe('JL-001');
    expect(results[1].outputs.large).toBe(true);
  });
});
