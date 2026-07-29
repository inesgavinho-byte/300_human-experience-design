"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rule = void 0;
/**
 * NET-001: Pontos de rede
 *
 * Calcula o número de pontos de rede necessários com base na função da divisão.
 */
exports.rule = {
    code: 'NET-001',
    name: 'Pontos de rede',
    category: 'rede',
    description: 'Calcula pontos de rede necessários por divisão',
    parameters: {
        base_points: 2,
    },
    execute: (context) => {
        const room = context.room;
        if (!room) {
            throw new Error('Room is required for NET-001');
        }
        const level = context.solutionLevel;
        let points = 2;
        let accessPoints = 0;
        switch (room.function) {
            case 'estar':
                points = level === 'essential' ? 2 : level === 'recommended' ? 4 : 6;
                accessPoints = level === 'signature' ? 1 : 0;
                break;
            case 'suite':
                points = level === 'essential' ? 2 : 3;
                break;
            case 'escritorio':
                points = Math.max(4, Math.ceil(room.area_m2 / 10));
                break;
            case 'cozinha':
                points = 2;
                break;
            case 'sala_jantar':
                points = level === 'essential' ? 1 : 2;
                break;
            default:
                points = 1;
        }
        return {
            ethernet_points: points,
            access_points: accessPoints,
            total_ports: points + accessPoints,
            recommended_speed_mbps: level === 'signature' ? 10000 : level === 'recommended' ? 2500 : 1000,
        };
    },
};
//# sourceMappingURL=net-001-network.js.map