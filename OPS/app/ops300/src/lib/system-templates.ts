import type { TemplateData } from '@/types';

export const BASALTE_KNX_TEMPLATE: TemplateData = {
  template_type: 'basalte_knx',
  name: 'Basalte Home KNX — Apartamento',
  description: 'Hiperminimalismo tecnológico. Invisibilidade total. 2700K uniforme. Lógica DOT universal.',
  server: 'Basalte Core Plus',
  protocol: 'KNX TP1',
  rooms: [
    {
      code: 'HALL',
      name: 'Hall',
      dots: [{ type: 'DOT4', position: 'entrada', buttons: ['Luz ON', 'Cortina', 'Cena sec.', 'Master OFF'] }],
      lighting: { type: 'spots_trimless', temp: '2700K', cri: '≥90' },
      sensors: ['Auro presença'],
      notes: 'B1=Luz, B2=Cortina, B3=—, B4=Master OFF'
    },
    {
      code: 'SALA',
      name: 'Sala',
      dots: [
        { type: 'DOT4', position: 'A', buttons: ['Luz', 'Cortina', '—', 'Master OFF'] },
        { type: 'DOT4', position: 'C (janela)', buttons: ['Luz', 'Cortina', 'Toldo varanda', 'Master OFF'] }
      ],
      lighting: { type: 'spots_trimless', temp: '2700K', scenes: ['Cinema', 'Jantar', 'Recepção'] },
      audio: 'Sonos Arc + Sub',
      notes: 'Miro remote na mesa de centro'
    },
    {
      code: 'COZINHA',
      name: 'Cozinha',
      dots: [{ type: 'DOT4', buttons: ['Luz', 'Cortina', 'Estore futuro', 'Master OFF'] }],
      lighting: { type: 'spots_trimless', temp: '3000K', cri: '≥95', notes: 'Sob armários + ilha' },
      notes: 'Exaustão downdraft integrada'
    },
    {
      code: 'MASTER',
      name: 'Master Suite',
      dots: [
        { type: 'DOT4', position: 'A (porta)', buttons: ['Luz', '—', '—', 'Master OFF'] },
        { type: 'DOT8', position: 'B (cama)', buttons: ['Luz', 'Cortina', 'Estore', 'Cena Despertar', 'Cena Relaxar', 'Cena Cinema', 'Cena Noite', 'Master OFF'] }
      ],
      lighting: { type: 'spots_trimless', temp: '2700K', scenes: ['Despertar', 'Dormir', 'Leitura'] },
      climate: 'Shelly H&T Gen3',
      notes: 'Botoneira pânico sob cabeceira'
    },
    {
      code: 'Q_HOSPEDES',
      name: 'Quarto Hóspedes',
      dots: [
        { type: 'DOT8', position: 'A (porta)', buttons: ['Luz', '—', '—', 'Cenas B4-B7', '—', '—', '—', 'Master OFF'] },
        { type: 'DOT4', position: 'B (cama)', buttons: ['Luz', 'Cortina', 'Estore', 'Master OFF'] }
      ],
      lighting: { type: 'spots_trimless', temp: '2700K' }
    }
  ],
  dot_logic: {
    B1: 'Iluminação ON — Liga cena preset principal (só liga, nunca toggle)',
    B2: 'Cortina — Ciclo: abre → pára → fecha',
    B3: 'Estore/Blackout/Toldo — Mesmo ciclo. Reservado onde futuro.',
    B4_last: 'Master OFF — Apaga todas as luzes da divisão'
  },
  scenes: [
    { name: 'Bem-Vindo', trigger: 'chegada', actions: ['Luz hall 30%', 'Temperatura conforto'] },
    { name: 'Saída', trigger: 'partida', actions: ['Master OFF geral', 'Temperatura eco'] },
    { name: 'Boa Noite', trigger: '23h', actions: ['Luzes 5%', 'Cortinas fechadas', 'Temperatura dormir'] },
    { name: 'Master OFF Geral', trigger: 'manual', actions: ['Todas as luzes OFF', 'Estores/cortinas não afetados'] }
  ],
  integrations: [
    { system: 'Basalte Core Plus', role: 'Servidor central KNX' },
    { system: 'Wiser KNX', role: 'Interface supervisão' },
    { system: 'Shelly H&T Gen3', role: 'Sensores temperatura/humidade Wi-Fi' },
    { system: 'Nuki Smart Lock 4.0 Pro', role: 'Fechadura inteligente' },
    { system: 'Sonos', role: 'Áudio multiroom' }
  ],
  zt: [
    { name: 'ZT L1', capacity: '15 drivers', protocols: ['DALI', 'KNX'] },
    { name: 'ZT L2', capacity: '20 drivers', protocols: ['DALI', 'KNX'] }
  ]
};

export const INTEGRATED_SYSTEMS_TEMPLATE: TemplateData = {
  template_type: 'custom',
  name: 'Sistemas Integrados GAVINHO — Moradia de Luxo',
  description: 'Ecossistema coerente, invisível e antecipatório. 2700K padrão. Invisibilidade total.',
  philosophy: [
    'INVISIBILIDADE — Nenhum equipamento técnico visível nos espaços principais',
    'CONSISTÊNCIA — Lógica de controlo idêntica em todas as divisões',
    'ANTECIPAÇÃO — O sistema reage antes do utilizador pedir',
    'TEMPERATURA DE COR 2700K em toda a habitação',
    'INTERFACE em português europeu, funcional',
    'PRIVACIDADE E SOBERANIA DIGITAL — Soluções locais: KNX, Thread/Matter, HomeKit'
  ],
  server: 'Basalte Core Plus (ou equivalente)',
  protocols: ['KNX TP1', 'IP/Wi-Fi', 'HomeKit/Thread/Matter', 'IR', 'Roon/AirPlay 2'],
  rooms: [
    { code: 'SALA', name: 'Sala', dots: [{ type: 'DOT4', buttons: ['Luz', 'Cortina', '—', 'Master OFF'] }], lighting: { type: 'spots_trimless', temp: '2700K', scenes: ['Cinema', 'Jantar', 'Recepção'] } },
    { code: 'COZINHA', name: 'Cozinha', dots: [{ type: 'DOT4', buttons: ['Luz', 'Cortina', 'Estore', 'Master OFF'] }], lighting: { type: 'spots_trimless', temp: '3000K', cri: '≥95', notes: 'Sob armários + ilha' } },
    { code: 'MASTER', name: 'Master Suite', dots: [{ type: 'DOT8', position: 'cama', buttons: ['Luz', 'Cortina', 'Estore', 'Cena Despertar', 'Cena Relaxar', 'Cena Cinema', 'Cena Noite', 'Master OFF'] }], lighting: { type: 'spots_trimless', temp: '2700K', scenes: ['Despertar', 'Dormir', 'Leitura'] }, climate: 'Shelly H&T Gen3' },
    { code: 'Q_HOSPEDES', name: 'Quarto Hóspedes', dots: [{ type: 'DOT4', buttons: ['Luz', 'Cortina', 'Estore', 'Master OFF'] }], lighting: { type: 'spots_trimless', temp: '2700K' } },
    { code: 'GINASIO', name: 'Ginásio', dots: [{ type: 'DOT4', buttons: ['Luz', 'Cortina', 'Cena Treino', 'Master OFF'] }], lighting: { type: 'spots_trimless', temp: '3000K', scenes: ['Treino', 'Recuperação'] } },
    { code: 'LOUNGE_S', name: 'Lounge Bar (S)', dots: [{ type: 'DOT8', buttons: ['Luz', 'Cortina', 'Estore', 'Cena Lounge', 'Cena Bar Aberto', '—', '—', 'Master OFF'] }], lighting: { type: 'spots_trimless', temp: '2700K', scenes: ['Lounge', 'Bar Aberto'] } }
  ],
  systems: [
    { name: 'Domótica', system: 'KNX/Basalte', server: 'Basalte Core Plus', location: 'ZT piso –2' },
    { name: 'Iluminação', system: 'DALI/KNX', spots: 'Flos/Kreon/iGuzzini', drivers: 'Helvar/Lunatone', temp: '2700K (3000K zonas trabalho)' },
    { name: 'Cortinas', system: 'KNX', motor: 'Silent Gliss 5600', estores: 'TAO Roll Hide' },
    { name: 'Climatização', system: 'VRV + Hidrónico', vrv: 'Daikin VRV IV+', hidrónico: 'YORK YKF', piso_radiante: 'PEX-A Ø16/17' },
    { name: 'VMC', system: 'Double-flow', model: 'S&P CAD-COMPACT 2500', caudal: '0,8 ren/h', recuperação: '≥75%' },
    { name: 'AQS', system: 'Bomba de calor', model: 'ENERGIE AQUAPURA 500I', capacidade: '500L' },
    { name: 'Gás Natural', system: 'Floene', usos: ['Backup AQS', 'Lareira', 'Placa cozinha (opção)', 'Conversation pit (opção)'] },
    { name: 'Água', system: 'POE + SAAP', poe: 'AcquaRobot/Culligan', saap: '10-15m³' },
    { name: 'Energia', system: 'PV Pavimento', area: '~250m²', potência: '15-25 kWp' },
    { name: 'Elevador', system: 'RJB HOME', model: 'PSE1202-24-10-0', carga: '250kg' },
    { name: 'Áudio/Vídeo', system: 'Roon/AirPlay 2', distribuição: 'Multi-zona high-res' },
    { name: 'Segurança', system: 'CCTV Grau 3 + CRA 24h', status: 'A adjudicar' },
    { name: 'Piscina', system: 'Integração KNX', volume: '102m²', jets: 'KS sim / S a confirmar' },
    { name: 'Jardim', system: 'Rega automatizada KNX', programador: 'Hunter/Rain Bird', alimentação: 'SAAP' }
  ],
  interfaces: {
    physical: 'Atelier Luxus BL Light Bronze — aparelhagem bespoke integral',
    sensors: 'Basalte Auro (preto, LED desactivado)',
    remotes: 'Basalte Miro',
    app: 'Basalte Home (iOS)'
  },
  dot_programming: {
    DOT4_simples: {
      B1: 'Iluminação principal — Dimming progressivo (toque longo)',
      B2: 'Cortinas — Ciclo: abre → pára → fecha',
      B3: 'Estore/Blackout — Posição intermédia',
      B4: 'Master OFF — Toda a divisão'
    },
    DOT8_complexas: {
      B1: 'Iluminação principal — Dimming',
      B2: 'Cortinas — Posição intermédia',
      B3: 'Estore/Blackout — Posição intermédia',
      B4: 'Iluminação cénica/decorativa — Dimming',
      B5: 'Cena 1 — específica da divisão',
      B6: 'Cena 2 — específica da divisão',
      B7: 'Climatização (toggle)',
      B8: 'Master OFF — Casa inteira'
    }
  },
  acoustic_targets: {
    quartos_noite: '< 25 dB(A)',
    elevador_cabina: '≤ 45 dB(A)',
    elevador_adjacentes: '≤ 30 dB(A)',
    cortinas_motor: '≤ 41 dB(A), ideal ≤ 35'
  },
  scenes: [
    { name: 'Bem-Vindo', trigger: 'chegada', actions: ['Luz hall 30%', 'Temperatura conforto'] },
    { name: 'Saída', trigger: 'partida', actions: ['Master OFF geral', 'Temperatura eco'] },
    { name: 'Boa Noite', trigger: '23h', actions: ['Luzes 5%', 'Cortinas fechadas', 'Temperatura dormir'] },
    { name: 'Cinema', trigger: 'manual', actions: ['Luzes OFF', 'Cortinas fechadas', 'Áudio ON'] },
    { name: 'Jantar', trigger: 'manual', actions: ['Luzes 60% mesa', 'Luzes 10% resto'] },
    { name: 'Master OFF Geral', trigger: 'manual', actions: ['Todas as luzes OFF', 'Estores/cortinas não afetados'] }
  ],
  integrations: [
    { system: 'Basalte Core Plus', role: 'Servidor central KNX' },
    { system: 'Wiser KNX', role: 'Interface supervisão' },
    { system: 'Shelly H&T Gen3', role: 'Sensores temperatura/humidade Wi-Fi' },
    { system: 'Daikin VRV IV+', role: 'Climatização VRV', protocols: ['KNX'] },
    { system: 'YORK YKF', role: 'Sistema hidrónico', protocols: ['KNX'] },
    { system: 'Silent Gliss 5600', role: 'Motores cortinas', protocols: ['KNX'] },
    { system: 'Sonos / Roon', role: 'Áudio multiroom high-res', protocols: ['AirPlay 2', 'Roon'] },
    { system: 'Nuki Smart Lock 4.0 Pro', role: 'Fechadura inteligente' },
    { system: 'S&P CAD-COMPACT 2500', role: 'VMC double-flow' }
  ]
};

export const LUTRON_DALI_TEMPLATE: TemplateData = {
  template_type: 'lutron_dali',
  name: 'Lutron HomeWorks QS + DALI — Moradia Premium',
  description: 'Sistema americano premium. Estore Sivoia QS silencioso. Keypads Palladiom/seeTouch. Integração nativa HVAC e áudio.',
  server: 'Lutron HomeWorks QS Processor',
  protocol: 'Clear Connect RF / DALI',
  rooms: [
    {
      code: 'HALL',
      name: 'Hall',
      dots: [{ type: 'Palladiom 4B', position: 'entrada', buttons: ['Luz ON', 'Cortina', 'Cena sec.', 'Master OFF'] }],
      lighting: { type: 'spots_trimless', temp: '2700K', cri: '≥90' },
      sensors: ['Occupancy sensor'],
      notes: 'B1=Luz, B2=Cortina, B3=—, B4=Master OFF'
    },
    {
      code: 'SALA',
      name: 'Sala',
      dots: [
        { type: 'Palladiom 4B', position: 'A', buttons: ['Luz', 'Cortina', '—', 'Master OFF'] },
        { type: 'seeTouch 8B', position: 'C (janela)', buttons: ['Luz', 'Cortina', 'Toldo varanda', 'Cena Cinema', 'Cena Jantar', 'Cena Recepção', '—', 'Master OFF'] }
      ],
      lighting: { type: 'spots_trimless', temp: '2700K', scenes: ['Cinema', 'Jantar', 'Recepção'] },
      audio: 'Sonos Arc + Sub',
      notes: 'Pico remote na mesa de centro'
    },
    {
      code: 'COZINHA',
      name: 'Cozinha',
      dots: [{ type: 'Palladiom 4B', buttons: ['Luz', 'Cortina', 'Estore futuro', 'Master OFF'] }],
      lighting: { type: 'spots_trimless', temp: 'DALI-2 DT8', cri: '≥95', notes: 'Sob armários + ilha — tunable white' },
      notes: 'Exaustão downdraft integrada'
    },
    {
      code: 'MASTER',
      name: 'Master Suite',
      dots: [
        { type: 'Palladiom 4B', position: 'A (porta)', buttons: ['Luz', '—', '—', 'Master OFF'] },
        { type: 'seeTouch 8B', position: 'B (cama)', buttons: ['Luz', 'Cortina', 'Estore', 'Cena Despertar', 'Cena Relaxar', 'Cena Cinema', 'Cena Noite', 'Master OFF'] }
      ],
      lighting: { type: 'spots_trimless', temp: '2700K', scenes: ['Despertar', 'Dormir', 'Leitura'] },
      climate: 'Lutron thermostat',
      notes: 'Botoneira pânico sob cabeceira'
    },
    {
      code: 'Q_HOSPEDES',
      name: 'Quarto Hóspedes',
      dots: [
        { type: 'seeTouch 6B', position: 'A (porta)', buttons: ['Luz', '—', 'Cenas', 'Cortina', '—', 'Master OFF'] },
        { type: 'Palladiom 4B', position: 'B (cama)', buttons: ['Luz', 'Cortina', 'Estore', 'Master OFF'] }
      ],
      lighting: { type: 'spots_trimless', temp: '2700K' }
    },
    {
      code: 'GINASIO',
      name: 'Ginásio',
      dots: [{ type: 'Palladiom 4B', buttons: ['Luz', 'Cortina', 'Cena Treino', 'Master OFF'] }],
      lighting: { type: 'spots_trimless', temp: 'DALI-2 DT8', scenes: ['Treino', 'Recuperação'], notes: 'Tunable white para circadiano' }
    },
    {
      code: 'LOUNGE_S',
      name: 'Lounge Bar',
      dots: [{ type: 'seeTouch 8B', buttons: ['Luz', 'Cortina', 'Estore', 'Cena Lounge', 'Cena Bar Aberto', '—', '—', 'Master OFF'] }],
      lighting: { type: 'spots_trimless', temp: '2700K', scenes: ['Lounge', 'Bar Aberto'] }
    }
  ],
  keypad_logic: {
    B1: 'Iluminação ON — Liga cena preset principal (só liga, nunca toggle)',
    B2: 'Cortina — Ciclo: abre → pára → fecha',
    B3: 'Estore/Blackout/Toldo — Mesmo ciclo. Reservado onde futuro.',
    B4_last: 'Master OFF — Apaga todas as luzes da divisão'
  },
  scenes: [
    { name: 'Bem-Vindo', trigger: 'chegada', actions: ['Luz hall 30%', 'Temperatura conforto'] },
    { name: 'Saída', trigger: 'partida', actions: ['Master OFF geral', 'Temperatura eco'] },
    { name: 'Boa Noite', trigger: '23h', actions: ['Luzes 5%', 'Cortinas fechadas', 'Temperatura dormir'] },
    { name: 'Master OFF Geral', trigger: 'manual', actions: ['Todas as luzes OFF', 'Estores/cortinas não afetados'] }
  ],
  integrations: [
    { system: 'Lutron HomeWorks QS', role: 'Processador central' },
    { system: 'Lutron Sivoia QS', role: 'Estores silenciosos' },
    { system: 'Palladiom keypads', role: 'Interface física premium' },
    { system: 'seeTouch keypads', role: 'Interface física clássica' },
    { system: 'DALI-2 Helvar/Lunatone', role: 'Drivers iluminação', protocols: ['DALI-2'] },
    { system: 'Daikin VRV', role: 'Climatização', protocols: ['Lutron integration'] },
    { system: 'Sonos Arc + Sub', role: 'Áudio multiroom', protocols: ['AirPlay 2'] }
  ]
};

export const CRESTRON_TEMPLATE: TemplateData = {
  template_type: 'crestron',
  name: 'Crestron Home — Residência Inteligente',
  description: 'Automação completa A/V, iluminação, climatização. Processador CP4-R. Interfaces TSW/touch panels.',
  server: 'Crestron CP4-R',
  protocol: 'Cresnet / IP / DALI',
  rooms: [
    {
      code: 'HALL',
      name: 'Hall',
      dots: [{ type: 'Cameo keypad', position: 'entrada', buttons: ['Luz ON', 'Cortina', 'Cena sec.', 'Master OFF'] }],
      lighting: { type: 'spots_trimless', temp: '2700K', cri: '≥90' },
      sensors: ['Occupancy sensor'],
      notes: 'TSW-770 no hall de entrada'
    },
    {
      code: 'SALA',
      name: 'Sala',
      dots: [
        { type: 'Cameo keypad', position: 'A', buttons: ['Luz', 'Cortina', '—', 'Master OFF'] },
        { type: 'TSW-770', position: 'parede', buttons: ['Luz', 'Cortina', 'Toldo varanda', 'Cena Cinema', 'Cena Jantar', 'Cena Recepção', 'Áudio', 'Master OFF'] }
      ],
      lighting: { type: 'spots_trimless', temp: '2700K', scenes: ['Cinema', 'Jantar', 'Recepção'] },
      audio: 'Sonos Arc + Sub',
      notes: 'HR-310 na mesa de centro'
    },
    {
      code: 'COZINHA',
      name: 'Cozinha',
      dots: [{ type: 'Cameo keypad', buttons: ['Luz', 'Cortina', 'Estore futuro', 'Master OFF'] }],
      lighting: { type: 'spots_trimless', temp: '3000K', cri: '≥95', notes: 'Sob armários + ilha' },
      notes: 'TSW-770 na parede principal'
    },
    {
      code: 'MASTER',
      name: 'Master Suite',
      dots: [
        { type: 'Cameo keypad', position: 'A (porta)', buttons: ['Luz', '—', '—', 'Master OFF'] },
        { type: 'TSW-770', position: 'B (cama)', buttons: ['Luz', 'Cortina', 'Estore', 'Cena Despertar', 'Cena Relaxar', 'Cena Cinema', 'Cena Noite', 'Master OFF'] }
      ],
      lighting: { type: 'spots_trimless', temp: '2700K', scenes: ['Despertar', 'Dormir', 'Leitura'] },
      climate: 'Crestron thermostat',
      notes: 'HR-310 na cabeceira'
    },
    {
      code: 'Q_HOSPEDES',
      name: 'Quarto Hóspedes',
      dots: [
        { type: 'Cameo keypad', position: 'A (porta)', buttons: ['Luz', '—', '—', 'Master OFF'] },
        { type: 'Cameo keypad', position: 'B (cama)', buttons: ['Luz', 'Cortina', 'Estore', 'Master OFF'] }
      ],
      lighting: { type: 'spots_trimless', temp: '2700K' }
    },
    {
      code: 'GINASIO',
      name: 'Ginásio',
      dots: [{ type: 'Cameo keypad', buttons: ['Luz', 'Cortina', 'Cena Treino', 'Master OFF'] }],
      lighting: { type: 'spots_trimless', temp: '3000K', scenes: ['Treino', 'Recuperação'] }
    },
    {
      code: 'LOUNGE_S',
      name: 'Lounge Bar',
      dots: [{ type: 'TSW-770', buttons: ['Luz', 'Cortina', 'Estore', 'Cena Lounge', 'Cena Bar Aberto', '—', '—', 'Master OFF'] }],
      lighting: { type: 'spots_trimless', temp: '2700K', scenes: ['Lounge', 'Bar Aberto'] }
    }
  ],
  scenes: [
    { name: 'Bem-Vindo', trigger: 'chegada', actions: ['Luz hall 30%', 'Temperatura conforto'] },
    { name: 'Saída', trigger: 'partida', actions: ['Master OFF geral', 'Temperatura eco'] },
    { name: 'Boa Noite', trigger: '23h', actions: ['Luzes 5%', 'Cortinas fechadas', 'Temperatura dormir'] },
    { name: 'Master OFF Geral', trigger: 'manual', actions: ['Todas as luzes OFF', 'Estores/cortinas não afetados'] }
  ],
  integrations: [
    { system: 'Crestron CP4-R', role: 'Processador central' },
    { system: 'Crestron TSW touch panels', role: 'Interfaces touch' },
    { system: 'DALI-2 gateway', role: 'Gateway iluminação', protocols: ['DALI-2'] },
    { system: 'Daikin VRV', role: 'Climatização' },
    { system: 'Sonos', role: 'Áudio multiroom' },
    { system: 'Roon', role: 'Streaming high-res' },
    { system: 'Lutron', role: 'Estores (se necessário)' }
  ]
};

export const SAVANT_TEMPLATE: TemplateData = {
  template_type: 'savant',
  name: 'Savant Pro — Experiência Premium',
  description: 'Experiência do utilizador intuitiva. Integração nativa Apple HomeKit. Host Pro. Interfaces elegantes via app.',
  server: 'Savant Host Pro',
  protocol: 'IP / Zigbee / DALI / HomeKit',
  rooms: [
    {
      code: 'HALL',
      name: 'Hall',
      dots: [{ type: 'Savant Keypad 4B', position: 'entrada', buttons: ['Luz ON', 'Cortina', 'Cena sec.', 'Master OFF'] }],
      lighting: { type: 'spots_trimless', temp: '2700K', cri: '≥90' },
      sensors: ['Motion sensor'],
      notes: 'Savant Touch no hall de entrada'
    },
    {
      code: 'SALA',
      name: 'Sala',
      dots: [
        { type: 'Savant Keypad 4B', position: 'A', buttons: ['Luz', 'Cortina', '—', 'Master OFF'] },
        { type: 'Savant Keypad 8B', position: 'C (janela)', buttons: ['Luz', 'Cortina', 'Toldo varanda', 'Cena Cinema', 'Cena Jantar', 'Cena Recepção', '—', 'Master OFF'] }
      ],
      lighting: { type: 'spots_trimless', temp: '2700K', scenes: ['Cinema', 'Jantar', 'Recepção'] },
      audio: 'Sonos Arc + Sub',
      notes: 'Savant Touch na mesa de centro'
    },
    {
      code: 'COZINHA',
      name: 'Cozinha',
      dots: [{ type: 'Savant Keypad 4B', buttons: ['Luz', 'Cortina', 'Estore futuro', 'Master OFF'] }],
      lighting: { type: 'spots_trimless', temp: 'DALI-2', cri: '≥95', notes: 'Sob armários + ilha — tunable white' },
      notes: 'Savant Touch na parede principal'
    },
    {
      code: 'MASTER',
      name: 'Master Suite',
      dots: [
        { type: 'Savant Keypad 4B', position: 'A (porta)', buttons: ['Luz', '—', '—', 'Master OFF'] },
        { type: 'Savant Keypad 8B', position: 'B (cama)', buttons: ['Luz', 'Cortina', 'Estore', 'Cena Despertar', 'Cena Relaxar', 'Cena Cinema', 'Cena Noite', 'Master OFF'] }
      ],
      lighting: { type: 'spots_trimless', temp: '2700K', scenes: ['Despertar', 'Dormir', 'Leitura'] },
      climate: 'Savant climate',
      notes: 'Botoneira pânico sob cabeceira'
    },
    {
      code: 'Q_HOSPEDES',
      name: 'Quarto Hóspedes',
      dots: [
        { type: 'Savant Keypad 8B', position: 'A (porta)', buttons: ['Luz', '—', '—', 'Cenas B4-B7', '—', '—', '—', 'Master OFF'] },
        { type: 'Savant Keypad 4B', position: 'B (cama)', buttons: ['Luz', 'Cortina', 'Estore', 'Master OFF'] }
      ],
      lighting: { type: 'spots_trimless', temp: '2700K' }
    },
    {
      code: 'GINASIO',
      name: 'Ginásio',
      dots: [{ type: 'Savant Keypad 4B', buttons: ['Luz', 'Cortina', 'Cena Treino', 'Master OFF'] }],
      lighting: { type: 'spots_trimless', temp: 'DALI-2', scenes: ['Treino', 'Recuperação'], notes: 'Tunable white' }
    },
    {
      code: 'LOUNGE_S',
      name: 'Lounge Bar',
      dots: [{ type: 'Savant Keypad 8B', buttons: ['Luz', 'Cortina', 'Estore', 'Cena Lounge', 'Cena Bar Aberto', '—', '—', 'Master OFF'] }],
      lighting: { type: 'spots_trimless', temp: '2700K', scenes: ['Lounge', 'Bar Aberto'] }
    }
  ],
  scenes: [
    { name: 'Bem-Vindo', trigger: 'chegada', actions: ['Luz hall 30%', 'Temperatura conforto'] },
    { name: 'Saída', trigger: 'partida', actions: ['Master OFF geral', 'Temperatura eco'] },
    { name: 'Boa Noite', trigger: '23h', actions: ['Luzes 5%', 'Cortinas fechadas', 'Temperatura dormir'] },
    { name: 'Master OFF Geral', trigger: 'manual', actions: ['Todas as luzes OFF', 'Estores/cortinas não afetados'] }
  ],
  integrations: [
    { system: 'Savant Host Pro', role: 'Host central' },
    { system: 'Savant Keypads', role: 'Interfaces físicas' },
    { system: 'DALI-2', role: 'Iluminação', protocols: ['DALI-2'] },
    { system: 'Apple HomeKit', role: 'Integração nativa Apple', protocols: ['HomeKit'] },
    { system: 'Daikin VRV', role: 'Climatização' },
    { system: 'Sonos', role: 'Áudio multiroom' },
    { system: 'Roon', role: 'Streaming high-res' }
  ]
};

export const TEMPLATES: Record<string, TemplateData> = {
  basalte_knx: BASALTE_KNX_TEMPLATE,
  integrated_systems: INTEGRATED_SYSTEMS_TEMPLATE,
  lutron_dali: LUTRON_DALI_TEMPLATE,
  crestron: CRESTRON_TEMPLATE,
  savant: SAVANT_TEMPLATE
};

export function getTemplateByType(type: string): TemplateData | undefined {
  if (type === 'basalte_knx') return BASALTE_KNX_TEMPLATE;
  if (type === 'lutron_dali') return LUTRON_DALI_TEMPLATE;
  if (type === 'crestron') return CRESTRON_TEMPLATE;
  if (type === 'savant') return SAVANT_TEMPLATE;
  if (type === 'custom') return { ...INTEGRATED_SYSTEMS_TEMPLATE, template_type: 'custom', name: 'Configuração Personalizada', description: 'Sistema configurado de raiz.', rooms: [], scenes: [], integrations: [] };
  return undefined;
}
