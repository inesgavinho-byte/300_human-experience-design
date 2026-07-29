"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rule = void 0;
/**
 * ILU-003: Exemplo mandato — Sala 58m²
 *
 * Regra específica para sala de 58m² conforme mandato §6.3.
 * 14-18 spots, 3 circuitos, dimmable, cenas predefinidas.
 */
exports.rule = {
    code: 'ILU-003',
    name: 'Sala 58m² — Mandato §6.3',
    category: 'iluminacao',
    description: 'Regra específica para sala de 58m² conforme mandato §6.3',
    parameters: {
        area_exact: 58,
        spots_min: 14,
        spots_max: 18,
        circuits: 3,
        scenes: ['geral', 'filme', 'jantar', 'leitura'],
    },
    preconditions: {
        'room.function': 'estar',
    },
    execute: (context) => {
        const room = context.room;
        if (!room) {
            throw new Error('Room is required for ILU-003');
        }
        if (room.area_m2 < 50 || room.area_m2 > 65) {
            return {
                applicable: false,
                reason: 'Room area does not match the 58m² mandate range (50-65m²)',
            };
        }
        return {
            applicable: true,
            spots: {
                min: 14,
                max: 18,
            },
            circuits_iluminacao: 3,
            dimmable: true,
            scenes: ['geral', 'filme', 'jantar', 'leitura'],
            colour_temperature_k: 2700,
            cri_min: 90,
            notes: 'Conforme Mandato §6.3 — Sala de estar 58m²',
        };
    },
};
//# sourceMappingURL=ilu-003-sala-58m2.js.map