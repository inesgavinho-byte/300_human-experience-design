import { BuiltInRule, RuleExecutionContext } from '../../types/rule.types';

/**
 * ILU-002: Cálculo de circuitos de iluminação
 *
 * Determina o número de circuitos necessários com base no nível de solução
 * e na área da divisão.
 */
export const rule: BuiltInRule = {
  code: 'ILU-002',
  name: 'Circuitos de iluminação',
  category: 'iluminacao',
  description: 'Determina o número de circuitos de iluminação necessários',
  parameters: {
    essential_circuits: 2,
    recommended_circuits: 3,
    signature_circuits: 4,
    area_threshold: 50,
  },
  execute: (context: RuleExecutionContext) => {
    const room = context.room;

    if (!room) {
      throw new Error('Room is required for ILU-002');
    }

    const level = context.solutionLevel;
    let circuits: number;

    switch (level) {
      case 'essential':
        circuits = 2;
        break;
      case 'recommended':
        circuits = 3;
        break;
      case 'signature':
        circuits = 4;
        break;
      default:
        circuits = 2;
    }

    // Sala grande (>50m²) sempre tem circuito extra
    if (room.area_m2 > 50) {
      circuits += 1;
    }

    return {
      circuits_iluminacao: circuits,
      circuits_general: circuits,
      dimmable: level !== 'essential',
    };
  },
};
