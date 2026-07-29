"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rule = void 0;
/**
 * CUR-001: Cortinas motorizadas
 *
 * Recomenda cortinas motorizadas com base na função e número de janelas.
 */
exports.rule = {
    code: 'CUR-001',
    name: 'Cortinas motorizadas',
    category: 'cortinas',
    description: 'Recomenda cortinas motorizadas com base na função e número de janelas',
    parameters: {
        motorizable_functions: ['estar', 'suite', 'sala_jantar', 'escritorio'],
    },
    execute: (context) => {
        const room = context.room;
        if (!room) {
            throw new Error('Room is required for CUR-001');
        }
        const windows = room.windows_count ?? 0;
        const motorizable = ['estar', 'suite', 'sala_jantar', 'escritorio'].includes(room.function);
        const level = context.solutionLevel;
        if (!motorizable || windows === 0) {
            return {
                motorized_curtains: 0,
                applicable: false,
            };
        }
        const motorized = level === 'essential' ? Math.min(1, windows) : windows;
        const hasAutomation = level !== 'essential';
        return {
            motorized_curtains: motorized,
            total_windows: windows,
            manual_curtains: windows - motorized,
            automation: hasAutomation,
            scenes: hasAutomation ? ['abertura', 'fecho', 'privacidade', 'pelicula'] : [],
            applicable: true,
        };
    },
};
//# sourceMappingURL=cur-001-curtains.js.map