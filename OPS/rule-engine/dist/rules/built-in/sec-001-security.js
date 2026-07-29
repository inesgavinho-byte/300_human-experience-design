"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rule = void 0;
/**
 * SEC-001: Sensores de segurança
 *
 * Recomenda sensores de segurança com base na função e acessos da divisão.
 */
exports.rule = {
    code: 'SEC-001',
    name: 'Sensores de segurança',
    category: 'seguranca',
    description: 'Recomenda sensores de segurança por divisão',
    parameters: {
        perimetral_functions: ['estar', 'cozinha', 'escritorio'],
    },
    execute: (context) => {
        const room = context.room;
        if (!room) {
            throw new Error('Room is required for SEC-001');
        }
        const level = context.solutionLevel;
        let motionSensors = 0;
        let doorSensors = 0;
        let glassBreakSensors = 0;
        let cameras = 0;
        switch (room.function) {
            case 'estar':
                motionSensors = Math.max(1, Math.ceil(room.area_m2 / 30));
                glassBreakSensors = room.windows_count && room.windows_count > 0 ? 1 : 0;
                cameras = level === 'signature' ? 1 : 0;
                break;
            case 'suite':
                motionSensors = 1;
                doorSensors = 1;
                break;
            case 'entrada':
                motionSensors = 1;
                doorSensors = 1;
                cameras = level !== 'essential' ? 1 : 0;
                break;
            case 'cozinha':
                motionSensors = 1;
                doorSensors = 1; // porta exterior
                break;
            case 'escritorio':
                motionSensors = 1;
                cameras = level === 'signature' ? 1 : 0;
                break;
            default:
                motionSensors = room.area_m2 > 20 ? 1 : 0;
        }
        return {
            motion_sensors: motionSensors,
            door_sensors: doorSensors,
            glass_break_sensors: glassBreakSensors,
            cameras,
            total_devices: motionSensors + doorSensors + glassBreakSensors + cameras,
        };
    },
};
//# sourceMappingURL=sec-001-security.js.map