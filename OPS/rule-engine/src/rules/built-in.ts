import { EngineeringRule } from '../types.js';

export const ilu001: EngineeringRule = {
  code: 'ILU-001',
  name: 'Spots Calculation',
  category: 'iluminação',
  ruleLanguage: 'javascript',
  ruleExpression: `function(room) { const base = Math.ceil(room.area_m2 / 4); return { spots: { min: base, max: Math.ceil(base * 1.3) } }; }`,
  parameters: {},
};

export const ilu002: EngineeringRule = {
  code: 'ILU-002',
  name: 'Circuits Calculation',
  category: 'iluminação',
  ruleLanguage: 'javascript',
  ruleExpression: `function(room, level) { return { circuits_general: level === 'essential' ? 2 : 3, circuits_decorative: level === 'signature' ? 2 : 1, circuits_led: 2 }; }`,
  parameters: {},
};

export const ilu003: EngineeringRule = {
  code: 'ILU-003',
  name: 'Sala 58m² Complete Spec',
  category: 'iluminação',
  ruleLanguage: 'javascript',
  ruleExpression: `function() { return { spots: { min: 14, max: 18 }, circuits_general: 3, circuits_decorative: 2, circuits_led: 2, sensor_presence: 1, wall_interface: 1, curtain_zones: 2, climate_zone: 1, audio_zone: 1, voice_point: 1, wifi_point: 1, local_scenes: 2, master_off: true }; }`,
  parameters: {},
};

export const cli001: EngineeringRule = {
  code: 'CLI-001',
  name: 'Climate Zones',
  category: 'climatização',
  ruleLanguage: 'javascript',
  ruleExpression: `function(room) { return { zones: room.area_m2 > 25 || ['estar','suite','escritorio'].includes(room.function) ? 1 : 0 }; }`,
  parameters: {},
};

export const aud001: EngineeringRule = {
  code: 'AUD-001',
  name: 'Audio Zones',
  category: 'audio',
  ruleLanguage: 'javascript',
  ruleExpression: `function(room) { return { audio_zone: ['estar','jantar','suite'].includes(room.function) ? 1 : 0, speakers: room.area_m2 > 40 ? 4 : 2 }; }`,
  parameters: {},
};

export const builtInRules: EngineeringRule[] = [ilu001, ilu002, ilu003, cli001, aud001];
