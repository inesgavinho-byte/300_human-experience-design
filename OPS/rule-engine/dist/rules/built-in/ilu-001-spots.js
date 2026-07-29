"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rule = void 0;
/**
 * ILU-001: Cálculo de spots de iluminação
 *
 * Calcula o número mínimo e máximo de spots com base na área da divisão.
 */
exports.rule = {
    code: 'ILU-001',
    name: 'Cálculo de spots',
    category: 'iluminacao',
    description: 'Calcula o número de spots de iluminação com base na área da divisão',
    parameters: {
        area_factor: 4,
        max_variation: 1.3,
    },
    execute: (context) => {
        const room = context.room;
        const params = {
            area_factor: 4,
            max_variation: 1.3,
            ...context,
        };
        if (!room) {
            throw new Error('Room is required for ILU-001');
        }
        const base = Math.ceil(room.area_m2 / params.area_factor);
        const max = Math.ceil(base * params.max_variation);
        return {
            spots: {
                min: base,
                max: max,
            },
        };
    },
};
//# sourceMappingURL=ilu-001-spots.js.map