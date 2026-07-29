import { BuiltInRule, RuleExecutionContext } from '../../types/rule.types';

/**
 * AUD-001: Zonas de áudio
 *
 * Define zonas de áudio com base na função da divisão e nível de solução.
 */
export const rule: BuiltInRule = {
  code: 'AUD-001',
  name: 'Zonas de áudio',
  category: 'audio',
  description: 'Determina zonas de áudio com base na função da divisão',
  parameters: {
    audio_functions: ['estar', 'suite', 'sala_jantar', 'terraco', 'piscina'],
  },
  execute: (context: RuleExecutionContext) => {
    const room = context.room;

    if (!room) {
      throw new Error('Room is required for AUD-001');
    }

    const audioRooms = ['estar', 'suite', 'sala_jantar', 'terraco', 'piscina', 'cozinha'];
    const hasAudio = audioRooms.includes(room.function);
    const level = context.solutionLevel;

    let speakers = 0;
    let zones = 0;
    let subwoofer = false;

    if (hasAudio) {
      zones = 1;

      switch (room.function) {
        case 'estar':
          speakers = level === 'signature' ? 5 : level === 'recommended' ? 3 : 2;
          subwoofer = level !== 'essential';
          break;
        case 'suite':
          speakers = level === 'signature' ? 4 : 2;
          subwoofer = level === 'signature';
          break;
        case 'sala_jantar':
          speakers = level === 'essential' ? 2 : 4;
          break;
        case 'terraco':
        case 'piscina':
          speakers = level === 'essential' ? 2 : 4;
          break;
        default:
          speakers = 2;
      }
    }

    return {
      zones,
      speakers,
      subwoofer,
      streaming: hasAudio && level !== 'essential',
      wall_controls: hasAudio ? 1 : 0,
    };
  },
};
