"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const rule_engine_1 = require("../engine/rule-engine");
const built_in_1 = require("../rules/built-in");
// ─── Helpers ───────────────────────────────────────────────────────────────
function makeProject(overrides = {}) {
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
function makeRoom(overrides = {}) {
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
function makeContext(options = {}) {
    return {
        project: options.project ?? makeProject(),
        room: 'room' in options ? options.room : makeRoom(),
        requirements: options.requirements ?? [],
        solutionLevel: options.level ?? 'recommended',
        equipmentLibrary: [],
    };
}
room ?  : rule_types_1.Room;
level ?  : rule_types_1.SolutionLevel;
requirements ?  : rule_types_1.Requirement[];
project ?  : rule_types_1.Project;
{ }
rule_types_1.RuleExecutionContext;
{
    return {
        project: options.project ?? makeProject(),
        room: options.room ?? makeRoom(),
        requirements: options.requirements ?? [],
        solutionLevel: options.level ?? 'recommended',
        equipmentLibrary: [],
    };
}
// ─── Built-in Rule Tests ───────────────────────────────────────────────────
(0, vitest_1.describe)('Built-in Rules', () => {
    let engine;
    (0, vitest_1.beforeEach)(() => {
        engine = new rule_engine_1.RuleEngine();
        engine.registerBuiltinRules([built_in_1.ILU001, built_in_1.ILU002, built_in_1.ILU003, built_in_1.CLI001, built_in_1.AUD001, built_in_1.CUR001, built_in_1.NET001, built_in_1.SEC001]);
    });
    (0, vitest_1.describe)('ILU-001: Cálculo de spots', () => {
        (0, vitest_1.it)('calculates spots for a 16m² room', async () => {
            const ctx = makeContext({ room: makeRoom({ area_m2: 16 }) });
            const result = await engine.evaluateBuiltinRule('ILU-001', ctx);
            (0, vitest_1.expect)(result.errors).toHaveLength(0);
            (0, vitest_1.expect)(result.outputs.spots.min).toBe(4);
            (0, vitest_1.expect)(result.outputs.spots.max).toBe(6);
            (0, vitest_1.expect)(result.errors).toHaveLength(0);
        });
        (0, vitest_1.it)('calculates spots for a 58m² room', async () => {
            const ctx = makeContext({ room: makeRoom({ area_m2: 58 }) });
            const result = await engine.evaluateBuiltinRule('ILU-001', ctx);
            (0, vitest_1.expect)(result.outputs.spots.min).toBe(15);
            (0, vitest_1.expect)(result.outputs.spots.max).toBe(20);
        });
        (0, vitest_1.it)('throws when room is missing', async () => {
            const ctx = makeContext({ room: undefined });
            const result = await engine.evaluateBuiltinRule('ILU-001', ctx);
            (0, vitest_1.expect)(result.errors.length).toBeGreaterThan(0);
            (0, vitest_1.expect)(result.errors[0]).toContain('Room is required');
        });
    });
    (0, vitest_1.describe)('ILU-002: Circuitos de iluminação', () => {
        (0, vitest_1.it)('returns 2 circuits for essential level', async () => {
            const ctx = makeContext({ room: makeRoom({ area_m2: 20 }), level: 'essential' });
            const result = await engine.evaluateBuiltinRule('ILU-002', ctx);
            (0, vitest_1.expect)(result.outputs.circuits_iluminacao).toBe(2);
            (0, vitest_1.expect)(result.outputs.dimmable).toBe(false);
        });
        (0, vitest_1.it)('returns 3 circuits for recommended level', async () => {
            const ctx = makeContext({ room: makeRoom({ area_m2: 20 }), level: 'recommended' });
            const result = await engine.evaluateBuiltinRule('ILU-002', ctx);
            (0, vitest_1.expect)(result.outputs.circuits_iluminacao).toBe(3);
            (0, vitest_1.expect)(result.outputs.dimmable).toBe(true);
        });
        (0, vitest_1.it)('adds extra circuit for large rooms (>50m²)', async () => {
            const ctx = makeContext({ room: makeRoom({ area_m2: 58 }), level: 'signature' });
            const result = await engine.evaluateBuiltinRule('ILU-002', ctx);
            (0, vitest_1.expect)(result.outputs.circuits_iluminacao).toBe(5);
        });
    });
    (0, vitest_1.describe)('ILU-003: Sala 58m² Mandato', () => {
        (0, vitest_1.it)('applies to 58m² estar room', async () => {
            const ctx = makeContext({ room: makeRoom({ area_m2: 58, function: 'estar' }) });
            const result = await engine.evaluateBuiltinRule('ILU-003', ctx);
            (0, vitest_1.expect)(result.outputs.applicable).toBe(true);
            (0, vitest_1.expect)(result.outputs.spots.min).toBe(14);
            (0, vitest_1.expect)(result.outputs.spots.max).toBe(18);
            (0, vitest_1.expect)(result.outputs.circuits_iluminacao).toBe(3);
            (0, vitest_1.expect)(result.outputs.dimmable).toBe(true);
        });
        (0, vitest_1.it)('does not apply to small rooms', async () => {
            const ctx = makeContext({ room: makeRoom({ area_m2: 20, function: 'estar' }) });
            const result = await engine.evaluateBuiltinRule('ILU-003', ctx);
            (0, vitest_1.expect)(result.outputs.applicable).toBe(false);
        });
    });
    (0, vitest_1.describe)('CLI-001: Zonas de climatização', () => {
        (0, vitest_1.it)('returns zone=0 for small wc', async () => {
            const ctx = makeContext({ room: makeRoom({ area_m2: 5, function: 'wc' }) });
            const result = await engine.evaluateBuiltinRule('CLI-001', ctx);
            (0, vitest_1.expect)(result.outputs.zones).toBe(0);
            (0, vitest_1.expect)(result.outputs.requires_independent_zone).toBe(false);
        });
        (0, vitest_1.it)('returns zone=1 for large room', async () => {
            const ctx = makeContext({ room: makeRoom({ area_m2: 30, function: 'estar' }) });
            const result = await engine.evaluateBuiltinRule('CLI-001', ctx);
            (0, vitest_1.expect)(result.outputs.zones).toBe(1);
            (0, vitest_1.expect)(result.outputs.requires_independent_zone).toBe(true);
        });
        (0, vitest_1.it)('returns zone=1 for suite regardless of size', async () => {
            const ctx = makeContext({ room: makeRoom({ area_m2: 15, function: 'suite' }) });
            const result = await engine.evaluateBuiltinRule('CLI-001', ctx);
            (0, vitest_1.expect)(result.outputs.zones).toBe(1);
        });
    });
    (0, vitest_1.describe)('AUD-001: Zonas de áudio', () => {
        (0, vitest_1.it)('returns no audio for wc', async () => {
            const ctx = makeContext({ room: makeRoom({ area_m2: 5, function: 'wc' }) });
            const result = await engine.evaluateBuiltinRule('AUD-001', ctx);
            (0, vitest_1.expect)(result.outputs.zones).toBe(0);
            (0, vitest_1.expect)(result.outputs.speakers).toBe(0);
        });
        (0, vitest_1.it)('returns 2 speakers for estar essential', async () => {
            const ctx = makeContext({ room: makeRoom({ area_m2: 30, function: 'estar' }), level: 'essential' });
            const result = await engine.evaluateBuiltinRule('AUD-001', ctx);
            (0, vitest_1.expect)(result.outputs.speakers).toBe(2);
            (0, vitest_1.expect)(result.outputs.subwoofer).toBe(false);
        });
        (0, vitest_1.it)('returns 5 speakers + subwoofer for estar signature', async () => {
            const ctx = makeContext({ room: makeRoom({ area_m2: 30, function: 'estar' }), level: 'signature' });
            const result = await engine.evaluateBuiltinRule('AUD-001', ctx);
            (0, vitest_1.expect)(result.outputs.speakers).toBe(5);
            (0, vitest_1.expect)(result.outputs.subwoofer).toBe(true);
        });
    });
    (0, vitest_1.describe)('CUR-001: Cortinas', () => {
        (0, vitest_1.it)('returns no curtains for wc', async () => {
            const ctx = makeContext({ room: makeRoom({ area_m2: 5, function: 'wc', windows_count: 1 }) });
            const result = await engine.evaluateBuiltinRule('CUR-001', ctx);
            (0, vitest_1.expect)(result.outputs.applicable).toBe(false);
        });
        (0, vitest_1.it)('returns motorized curtains for estar', async () => {
            const ctx = makeContext({ room: makeRoom({ area_m2: 30, function: 'estar', windows_count: 3 }), level: 'recommended' });
            const result = await engine.evaluateBuiltinRule('CUR-001', ctx);
            (0, vitest_1.expect)(result.outputs.applicable).toBe(true);
            (0, vitest_1.expect)(result.outputs.motorized_curtains).toBe(3);
            (0, vitest_1.expect)(result.outputs.automation).toBe(true);
        });
    });
    (0, vitest_1.describe)('NET-001: Pontos de rede', () => {
        (0, vitest_1.it)('returns 2 points for essential cozinha', async () => {
            const ctx = makeContext({ room: makeRoom({ area_m2: 12, function: 'cozinha' }), level: 'essential' });
            const result = await engine.evaluateBuiltinRule('NET-001', ctx);
            (0, vitest_1.expect)(result.outputs.ethernet_points).toBe(2);
        });
        (0, vitest_1.it)('returns more points for escritorio', async () => {
            const ctx = makeContext({ room: makeRoom({ area_m2: 30, function: 'escritorio' }) });
            const result = await engine.evaluateBuiltinRule('NET-001', ctx);
            (0, vitest_1.expect)(result.outputs.ethernet_points).toBe(4);
        });
    });
    (0, vitest_1.describe)('SEC-001: Segurança', () => {
        (0, vitest_1.it)('returns sensors for estar', async () => {
            const ctx = makeContext({ room: makeRoom({ area_m2: 58, function: 'estar', windows_count: 2 }) });
            const result = await engine.evaluateBuiltinRule('SEC-001', ctx);
            (0, vitest_1.expect)(result.outputs.motion_sensors).toBeGreaterThanOrEqual(1);
            (0, vitest_1.expect)(result.outputs.total_devices).toBeGreaterThanOrEqual(1);
        });
        (0, vitest_1.it)('returns door sensor for suite', async () => {
            const ctx = makeContext({ room: makeRoom({ area_m2: 20, function: 'suite' }) });
            const result = await engine.evaluateBuiltinRule('SEC-001', ctx);
            (0, vitest_1.expect)(result.outputs.door_sensors).toBe(1);
        });
    });
});
// ─── Preconditions & Exclusions ────────────────────────────────────────────
(0, vitest_1.describe)('Preconditions and Exclusions', () => {
    let engine;
    (0, vitest_1.beforeEach)(() => {
        engine = new rule_engine_1.RuleEngine();
    });
    (0, vitest_1.it)('passes when no preconditions are set', () => {
        const rule = {
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
        (0, vitest_1.expect)(engine.checkPreconditions(rule, ctx)).toBe(true);
        (0, vitest_1.expect)(engine.checkExclusions(rule, ctx)).toBe(false);
    });
    (0, vitest_1.it)('checks exact match preconditions', () => {
        const rule = {
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
        (0, vitest_1.expect)(engine.checkPreconditions(rule, makeContext({ room: makeRoom({ function: 'estar' }) }))).toBe(true);
        (0, vitest_1.expect)(engine.checkPreconditions(rule, makeContext({ room: makeRoom({ function: 'wc' }) }))).toBe(false);
    });
    (0, vitest_1.it)('checks operator preconditions ($gt, $in)', () => {
        const rule = {
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
        (0, vitest_1.expect)(engine.checkPreconditions(rule, makeContext({ room: makeRoom({ area_m2: 30, function: 'estar' }) }))).toBe(true);
        (0, vitest_1.expect)(engine.checkPreconditions(rule, makeContext({ room: makeRoom({ area_m2: 20, function: 'estar' }) }))).toBe(false);
        (0, vitest_1.expect)(engine.checkPreconditions(rule, makeContext({ room: makeRoom({ area_m2: 30, function: 'wc' }) }))).toBe(false);
    });
});
// ─── Confidence Scoring ────────────────────────────────────────────────────
(0, vitest_1.describe)('Confidence Scoring', () => {
    let engine;
    (0, vitest_1.beforeEach)(() => {
        engine = new rule_engine_1.RuleEngine();
    });
    function makeRule() {
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
    (0, vitest_1.it)('calculates base confidence', () => {
        const ctx = makeContext();
        const confidence = engine.calculateConfidence(makeRule(), ctx);
        (0, vitest_1.expect)(confidence).toBeGreaterThanOrEqual(0.8);
        (0, vitest_1.expect)(confidence).toBeLessThanOrEqual(1.0);
    });
    (0, vitest_1.it)('reduces confidence for inferred detection state', () => {
        const confirmedCtx = makeContext({ room: makeRoom({ detection_state: 'confirmed' }) });
        const inferredCtx = makeContext({ room: makeRoom({ detection_state: 'inferred' }) });
        const confirmedConfidence = engine.calculateConfidence(makeRule(), confirmedCtx);
        const inferredConfidence = engine.calculateConfidence(makeRule(), inferredCtx);
        (0, vitest_1.expect)(confirmedConfidence).toBeGreaterThan(inferredConfidence);
    });
    (0, vitest_1.it)('increases confidence with explicit requirements', () => {
        const noReqsCtx = makeContext({ requirements: [] });
        const explicitReqsCtx = makeContext({
            requirements: [
                { id: '1', project_id: 'proj-1', category: 'iluminacao', key: 'spots', value: 10, source: 'explicit', priority: 1 },
            ],
        });
        const noReqsConf = engine.calculateConfidence(makeRule(), noReqsCtx);
        const explicitConf = engine.calculateConfidence(makeRule(), explicitReqsCtx);
        (0, vitest_1.expect)(explicitConf).toBeGreaterThan(noReqsConf);
    });
    (0, vitest_1.it)('increases confidence with budget and building type defined', () => {
        const minimalCtx = makeContext({
            project: makeProject({ budget: undefined, building_type: undefined }),
        });
        const fullCtx = makeContext({
            project: makeProject({ budget: 500000, building_type: 'apartment' }),
        });
        const minimalConf = engine.calculateConfidence(makeRule(), minimalCtx);
        const fullConf = engine.calculateConfidence(makeRule(), fullCtx);
        (0, vitest_1.expect)(fullConf).toBeGreaterThan(minimalConf);
    });
});
// ─── evaluateAll ───────────────────────────────────────────────────────────
(0, vitest_1.describe)('evaluateAll', () => {
    (0, vitest_1.it)('evaluates multiple rules', async () => {
        const engine = new rule_engine_1.RuleEngine();
        const rules = [
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
        (0, vitest_1.expect)(results).toHaveLength(2);
        (0, vitest_1.expect)(results[0].ruleCode).toBe('JS-001');
        (0, vitest_1.expect)(results[0].outputs.value).toBe(60);
        (0, vitest_1.expect)(results[1].ruleCode).toBe('JL-001');
        (0, vitest_1.expect)(results[1].outputs.large).toBe(true);
    });
});
//# sourceMappingURL=rule-engine.test.js.map