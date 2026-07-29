import { BuiltInRule, RuleExecutionContext } from '../../types/rule.types';

/**
 * CLI-001: Zonas de climatização
 *
 * Define se a divisão requer uma zona independente de climatização
 * com base na área e na função.
 */
export const rule: BuiltInRule = {
  code: 'CLI-001',
  name: 'Zonas de climatização',
  category: 'climatizacao',
  description: 'Determina zonas de climatização com base na área e função da divisão',
  parameters: {
    area_threshold: 25,
    standalone_functions: ['estar', 'suite', 'escritorio', 'ginasio'],
  },
  execute: (context: RuleExecutionContext) => {
    const room = context.room;

    if (!room) {
      throw new Error('Room is required for CLI-001');
    }

    const needsZone = room.area_m2 > 25 || ['estar', 'suite', 'escritorio', 'ginasio'].includes(room.function);

    return {
      zones: needsZone ? 1 : 0,
      requires_independent_zone: needsZone,
      recommended_system: needsZone ? 'split_inverter' : 'central_ducted',
      btu_estimate: Math.ceil(room.area_m2 * 600),
    };
  },
};
