import { describe, it, expect } from 'vitest';
import { RuleEngine } from './engine.js';
import { ilu001, ilu002, ilu003, cli001, aud001 } from './rules/built-in.js';
import { RuleExecutionContext } from './types.js';

describe('RuleEngine', () => {
  const engine = new RuleEngine();

  describe('ILU-001 (spots)', () => {
    const makeCtx = (area: number): RuleExecutionContext => ({
      room: { area_m2: area, function: 'estar' },
      level: 'recommended',
    });

    it('calculates spots for 20m²', () => {
      const result = engine.evaluateRule(ilu001, makeCtx(20));
      expect(result.outputs.spots).toEqual({ min: 5, max: 7 });
    });

    it('calculates spots for 40m²', () => {
      const result = engine.evaluateRule(ilu001, makeCtx(40));
      expect(result.outputs.spots).toEqual({ min: 10, max: 13 });
    });

    it('calculates spots for 58m²', () => {
      const result = engine.evaluateRule(ilu001, makeCtx(58));
      expect(result.outputs.spots).toEqual({ min: 15, max: 20 });
    });

    it('calculates spots for 100m²', () => {
      const result = engine.evaluateRule(ilu001, makeCtx(100));
      expect(result.outputs.spots).toEqual({ min: 25, max: 33 });
    });
  });

  describe('ILU-002 (circuits)', () => {
    const makeCtx = (level: RuleExecutionContext['level']): RuleExecutionContext => ({
      room: { area_m2: 30, function: 'estar' },
      level,
    });

    it('returns 2 general circuits for essential', () => {
      const result = engine.evaluateRule(ilu002, makeCtx('essential'));
      expect(result.outputs.circuits_general).toBe(2);
      expect(result.outputs.circuits_decorative).toBe(1);
      expect(result.outputs.circuits_led).toBe(2);
    });

    it('returns 3 general circuits for recommended', () => {
      const result = engine.evaluateRule(ilu002, makeCtx('recommended'));
      expect(result.outputs.circuits_general).toBe(3);
      expect(result.outputs.circuits_decorative).toBe(1);
      expect(result.outputs.circuits_led).toBe(2);
    });

    it('returns 3 general + 2 decorative for signature', () => {
      const result = engine.evaluateRule(ilu002, makeCtx('signature'));
      expect(result.outputs.circuits_general).toBe(3);
      expect(result.outputs.circuits_decorative).toBe(2);
      expect(result.outputs.circuits_led).toBe(2);
    });
  });

  describe('ILU-003 (sala 58m²)', () => {
    it('returns the complete spec', () => {
      const result = engine.evaluateRule(ilu003, {
        room: { area_m2: 58, function: 'estar' },
        level: 'signature',
      });
      expect(result.outputs.spots).toEqual({ min: 14, max: 18 });
      expect(result.outputs.circuits_general).toBe(3);
      expect(result.outputs.circuits_decorative).toBe(2);
      expect(result.outputs.circuits_led).toBe(2);
      expect(result.outputs.sensor_presence).toBe(1);
      expect(result.outputs.wall_interface).toBe(1);
      expect(result.outputs.curtain_zones).toBe(2);
      expect(result.outputs.climate_zone).toBe(1);
      expect(result.outputs.audio_zone).toBe(1);
      expect(result.outputs.voice_point).toBe(1);
      expect(result.outputs.wifi_point).toBe(1);
      expect(result.outputs.local_scenes).toBe(2);
      expect(result.outputs.master_off).toBe(true);
    });
  });

  describe('CLI-001 (climate)', () => {
    it('returns 1 zone for area > 25', () => {
      const result = engine.evaluateRule(cli001, {
        room: { area_m2: 58, function: 'wc' },
        level: 'recommended',
      });
      expect(result.outputs.zones).toBe(1);
    });

    it('returns 0 zone for small room', () => {
      const result = engine.evaluateRule(cli001, {
        room: { area_m2: 15, function: 'wc' },
        level: 'recommended',
      });
      expect(result.outputs.zones).toBe(0);
    });

    it('returns 1 zone for estar regardless of area', () => {
      const result = engine.evaluateRule(cli001, {
        room: { area_m2: 15, function: 'estar' },
        level: 'recommended',
      });
      expect(result.outputs.zones).toBe(1);
    });
  });

  describe('AUD-001 (audio)', () => {
    it('returns 1 audio_zone for estar with 2 speakers for 30m²', () => {
      const result = engine.evaluateRule(aud001, {
        room: { area_m2: 30, function: 'estar' },
        level: 'recommended',
      });
      expect(result.outputs.audio_zone).toBe(1);
      expect(result.outputs.speakers).toBe(2);
    });

    it('returns 0 audio_zone for wc with 4 speakers for 50m²', () => {
      const result = engine.evaluateRule(aud001, {
        room: { area_m2: 50, function: 'wc' },
        level: 'recommended',
      });
      expect(result.outputs.audio_zone).toBe(0);
      expect(result.outputs.speakers).toBe(4);
    });
  });

  describe('calculateConfidence', () => {
    it('returns 0.5 for minimal context', () => {
      const confidence = engine.calculateConfidence({
        room: { area_m2: 0, function: '' },
        level: '' as any,
      });
      expect(confidence).toBe(0.5);
    });

    it('returns 1.0 for full context', () => {
      const confidence = engine.calculateConfidence({
        room: { area_m2: 58, function: 'estar', orientation: 'S' },
        level: 'signature',
        buildingType: 'apartment',
      });
      expect(confidence).toBe(1.0);
    });
  });

  describe('evaluateAll', () => {
    it('evaluates all built-in rules', () => {
      const rules = [ilu001, ilu002, cli001, aud001];
      const context: RuleExecutionContext = {
        room: { area_m2: 58, function: 'estar' },
        level: 'signature',
      };
      const results = engine.evaluateAll(rules, context);
      expect(results).toHaveLength(4);
      expect(results.map((r) => r.ruleCode)).toEqual(['ILU-001', 'ILU-002', 'CLI-001', 'AUD-001']);
    });
  });

  describe('error handling', () => {
    it('throws for invalid rule expression', () => {
      const badRule = {
        code: 'BAD-001',
        name: 'Bad Rule',
        category: 'test',
        ruleLanguage: 'javascript' as const,
        ruleExpression: '42 + 1',
        parameters: {},
      };
      expect(() =>
        engine.evaluateRule(badRule, { room: { area_m2: 10, function: 'test' }, level: 'essential' })
      ).toThrow('Invalid JavaScript rule');
    });

    it('throws for rule that does not return an object', () => {
      const badRule = {
        code: 'BAD-002',
        name: 'Bad Rule',
        category: 'test',
        ruleLanguage: 'javascript' as const,
        ruleExpression: 'function() { return 42; }',
        parameters: {},
      };
      expect(() =>
        engine.evaluateRule(badRule, { room: { area_m2: 10, function: 'test' }, level: 'essential' })
      ).toThrow('Rule did not return an object');
    });

    it('throws for unsupported rule language', () => {
      const badRule = {
        code: 'BAD-003',
        name: 'Bad Rule',
        category: 'test',
        ruleLanguage: 'python' as any,
        ruleExpression: 'print(1)',
        parameters: {},
      };
      expect(() =>
        engine.evaluateRule(badRule, { room: { area_m2: 10, function: 'test' }, level: 'essential' })
      ).toThrow('Unsupported rule language');
    });
  });
});
