const API_KEY = import.meta.env.VITE_DEEPSEEK_API_KEY;
const API_URL = 'https://api.deepseek.com/chat/completions';

const SYSTEM_PROMPT = `You are 300 AI, an expert in Human Experience Design for smart homes and building automation. 
You specialize in KNX, DALI, Basalte, Lutron, Sonos, and integrated building systems.
You help design invisible, anticipatory, and coherent home experiences.
Always respond in the same language as the user's query.
Be concise but thorough. Include specific technical recommendations when relevant.
When asked about lighting, always recommend 2700K as the standard for residential spaces (3000K only for work areas).
When asked about interfaces, recommend Basalte DOT panels with universal logic: B1=Light, B2=Curtain, B3=Blind/Shutter, B4=Master OFF.
When asked about control systems, recommend local-first solutions (KNX, Thread/Matter, HomeKit) over cloud-dependent ones.`;

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface AIContext {
  projectName?: string;
  projectTypology?: string | null;
  projectArea?: number | null;
  configName?: string;
  currentRoom?: string;
  templateType?: string;
}

export async function askDeepSeek(
  messages: ChatMessage[],
  context?: AIContext
): Promise<string> {
  if (API_KEY) {
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_KEY}`
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [
            { role: 'system', content: buildContextualPrompt(context) },
            ...messages
          ],
          temperature: 0.7,
          max_tokens: 2000
        })
      });
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      const data = await response.json();
      return data.choices?.[0]?.message?.content || 'Sem resposta da IA.';
    } catch (err) {
      console.warn('DeepSeek API failed, falling back to template responses:', err);
      return generateFallbackResponse(messages[messages.length - 1]?.content || '', context);
    }
  } else {
    return generateFallbackResponse(messages[messages.length - 1]?.content || '', context);
  }
}

function buildContextualPrompt(context?: AIContext): string {
  let prompt = SYSTEM_PROMPT;
  if (context?.projectName) {
    prompt += `\n\nContexto atual — Projeto: ${context.projectName}`;
    if (context.projectTypology) prompt += `, Tipologia: ${context.projectTypology}`;
    if (context.projectArea) prompt += `, Área: ${context.projectArea}m²`;
  }
  if (context?.configName) {
    prompt += `\nConfiguração em edição: ${context.configName}`;
  }
  if (context?.currentRoom) {
    prompt += `\nDivisão atual: ${context.currentRoom}`;
  }
  return prompt;
}

function generateFallbackResponse(prompt: string, context?: AIContext): string {
  const lower = prompt.toLowerCase();

  // --- Basalte / KNX ---
  if (lower.includes('basalte') || lower.includes('knx')) {
    if (lower.includes('diferença') || lower.includes('vs') || lower.includes('compare')) {
      return `**KNX** é um protocolo de comunicação aberto e normalizado (EN 50090, ISO/IEC 14543) para automação de edifícios. Funciona sobre par torsidado (TP1) ou IP. Qualquer fabricante certificado pode produzir dispositivos KNX compatíveis.\n\n**Basalte** é uma marca belga premium que fabrica interfaces KNX (DOT, Auro, Miro), servidores (Core Plus) e sensores. O valor da Basalte está no design minimalista, na lógica universal de botões e na integração entre hardware e software (Basalte Home).\n\n**Regra prática da 300:** Usamos KNX como backbone de comunicação e Basalte como camada de interface — invisível, consistente e antecipatória.`;
    }
    if (lower.includes('dot') || lower.includes('botão') || lower.includes('botoeira')) {
      return `**Lógica DOT Universal (padrão 300):**\n\n- **B1** — Iluminação principal ON (só liga, nunca toggle). Toque longo para dimming progressivo.\n- **B2** — Cortina: ciclo abre → pára → fecha. Toque longo para posição intermédia.\n- **B3** — Estore / blackout / toldo: mesmo ciclo. Reservado onde não existe ainda.\n- **B4 (último)** — Master OFF: apaga todas as luzes da divisão. Nunca afeta cortinas ou estores.\n\n**DOT8 (divisões complexas):**\nB1-B4 como acima, depois B5-B6 = cenas específicas, B7 = climatização toggle, B8 = Master OFF casa inteira (apenas em pontos estratégicos).\n\n**Dica:** A lógica é idêntica em todas as divisões. O utilizador nunca precisa de "aprender" cada quarto.`;
    }
    if (lower.includes('servidor') || lower.includes('core') || lower.includes('server')) {
      return `**Basalte Core Plus** é o servidor central recomendado para projetos KNX da 300.\n\n**Especificações:**\n- Processador ARM quad-core\n- 2GB RAM / 16GB eMMC\n- Interface KNX TP1 integrada\n- Ethernet + Wi-Fi\n- Basalte Home (app iOS) incluído\n\n**Alternativas:** Para projetos menores, o **Basalte Core** (sem Plus) é suficiente. Para integrações complexas com muitos protocolos, considerar **Gira X1** ou **ABB i-bus KNX Server**`;
    }
    return `**Basalte + KNX — recomendação 300:**\n\nUsamos Basalte KNX quando o cliente valoriza:\n1. **Hiperminimalismo** — nenhum equipamento visível (spots trimless, botoneiras flush)\n2. **Consistência** — a mesma lógica em todos os quartos\n3. **Qualidade de luz** — 2700K uniforme, CRI ≥90\n4. **Soberania digital** — sistema local, sem dependência de cloud\n\n**Arquitetura típica:**\n- Servidor: Basalte Core Plus\n- Iluminação: KNX/DALI com drivers Helvar/Lunatone\n- Controlo: DOT4/DOT8 + Auro (presença)\n- Áudio: Sonos (AirPlay 2) ou Roon\n- Clima: Sensores Shelly H&T Gen3 (Wi-Fi) integrados via KNX IP`;
  }

  // --- Lutron / DALI ---
  if (lower.includes('lutron') || lower.includes('dali')) {
    if (lower.includes('diferença') || lower.includes('vs') || lower.includes('compare')) {
      return `**DALI** (Digital Addressable Lighting Interface) é um protocolo de comunicação digital para iluminação. Controla individualmente cada driver/luminária: dimming, temperatura de cor, cenas. É um protocolo de "nível baixo" — normalmente integrado dentro de KNX ou outro sistema superior.\n\n**Lutron** é uma marca americana que oferece soluções completas de controlo de luz e estores, com protocolos proprietários (Clear Connect, RadioRA 2, HomeWorks QS). Destaca-se em:\n- Controlo de estores Sivoia QS (silencioso, preciso)\n- Keypads de design premium (Palladiom, seeTouch)\n- Integração nativa com HVAC e áudio\n\n**Regra 300:** Preferimos DALI+KNX para projetos europeus (mais aberto, melhor suporte local). Lutron é considerado quando o cliente já tem infraestrutura Lutron ou quando os estores Sivoia são um requisito específico.`;
    }
    return `**DALI — recomendações 300:**\n\n- **Drivers:** Helvar, Lunatone, Tridonic (para DALI-2 com DT8/tunable white)\n- **Cablagem:** 2 fios não polarizados, máx 64 endereços por bus\n- **Integração KNX:** Usar gateway KNX/DALI (Helvar 950, Lunatone DALI-2)\n- **Cenas:** Programar via ETS ou servidor Basalte\n\n**Temperatura de cor com DALI-2 DT8:**\nPermite ajustar CCT (2700K–4000K) em tempo real. Ideal para zonas de trabalho (cozinha, escritório) onde 3000K é aceitável durante o dia.`;
  }

  // --- Scenes / Cenas ---
  if (lower.includes('cena') || lower.includes('scene')) {
    return `**Cenários recomendados (padrão 300):**\n\n**Por divisão:**\n- **Sala:** Cinema, Jantar, Recepção\n- **Master Suite:** Despertar, Dormir, Leitura\n- **Cozinha:** Cozinhar, Servir\n- **Ginásio:** Treino, Recuperação\n- **Lounge/Bar:** Lounge, Bar Aberto\n\n**Cenários globais (casa inteira):**\n- **Bem-Vindo** — luz hall 30%, temperatura conforto\n- **Saída** — Master OFF geral, temperatura eco\n- **Boa Noite** — luzes 5%, cortinas fechadas, temperatura dormir\n- **Master OFF Geral** — todas as luzes OFF (cortinas/estores não afetados)\n\n**Programação técnica:**\n- Disparadores: horários (cron), sensores presença, geofencing (chegada/partida), botões físicos\n- Transições: 3-5 segundos de fade para conforto visual\n- Prioridade: cena manual > sensor > horário`;
  }

  // --- HVAC / Climatização ---
  if (lower.includes('climatiza') || lower.includes('hvac') || lower.includes('aquecimento') || lower.includes('ar condicionado')) {
    return `**Climatização — recomendações 300:**\n\n**Para moradias de luxo:**\n- **VRV:** Daikin VRV IV+ (integração KNX nativa via gateway)\n- **Hidrónico:** YORK YKF para piso radiante (PEX-A Ø16/17)\n- **VMC:** S&P CAD-COMPACT 2500 (double-flow, ≥75% recuperação, 0,8 ren/h)\n- **Sensores:** Shelly H&T Gen3 (Wi-Fi, integração via KNX IP)\n\n**Controlo inteligente:**\n- Temperatura conforto: 21°C inverno / 23°C verão\n- Temperatura eco (saída): 17°C inverno / 26°C verão\n- Temperatura dormir: 19°C inverno / 24°C verão\n\n**Integração KNX:**\n- Gateway Daikin KNX para VRV\n- Atuadores KNX para válvulas hidrónicas\n- Sensores de temperatura/humidade em cada divisão principal`;
  }

  // --- Lighting / Iluminação ---
  if (lower.includes('ilumina') || lower.includes('light') || lower.includes('spot') || lower.includes('lâmpada')) {
    return `**Iluminação — princípios 300:**\n\n1. **2700K em toda a habitação** (exceção: cozinha e zonas de trabalho podem ter 3000K)\n2. **CRI ≥90** (≥95 em cozinha e zonas de leitura)\n3. **Spots trimless** — completamente integrados no teto\n4. **Dimming 1-100%** sem flicker\n5. **Cenas programadas** — não dependem de memorização do utilizador\n\n**Equipamentos recomendados:**\n- **Spots:** Flos, Kreon, iGuzzini (trimless)\n- **Drivers:** Helvar, Lunatone (DALI-2)\n- **Tiras LED:** Hidden profile, 2700K, difusor opalino\n- **Sob armários (cozinha):** Tiras LED 3000K com sensor de movimento\n\n**Acústica:**\n- Drivers em ZT (zona técnica), nunca nas divisões\n- Drivers com noise rating < 25 dB(A) para quartos`;
  }

  // --- Config generation ---
  if (lower.includes('cria') || lower.includes('gera') || lower.includes('configuração') || lower.includes('proposta')) {
    const area = context?.projectArea || 200;
    const type = context?.projectTypology || 'T4';
    return `**Configuração sugerida para ${type} de ~${area}m²:**\n\n**Arquitetura:**\n- Servidor: Basalte Core Plus\n- Protocolo: KNX TP1 + DALI-2\n- Interface: DOT4 (divisões simples), DOT8 (master suite, sala)\n\n**Divisões mínimas:**\n1. Hall — DOT4, Auro presença, 2700K\n2. Sala — DOT4 (2x), spots trimless, Sonos Arc\n3. Cozinha — DOT4, 3000K sob armários, exaustão integrada\n4. Master Suite — DOT8 (cama) + DOT4 (porta), 2700K\n5. Quarto 2 — DOT4, 2700K\n6. Quarto 3 — DOT4, 2700K\n7. Casa de banho social — DOT2, 3000K, sensor humidade\n8. Casa de banho master — DOT4, 2700K+3000K, sensor humidade\n\n**Cenários:**\nBem-Vindo, Saída, Boa Noite, Cinema, Jantar, Master OFF Geral\n\n**Integrações:**\n- Nuki Smart Lock (entrada)\n- Shelly H&T Gen3 (clima por divisão)\n- Sonos (sala + master suite)\n\nQuer que eu detalhe alguma divisão específica?`;
  }

  // --- Generic ---
  return `Olá! Sou o **300 AI**, assistente de design de experiências residenciais inteligentes.\n\nPosso ajudar com:\n• **Design de sistemas** — KNX, DALI, Basalte, Lutron, Crestron, Savant\n• **Cenários e automações** — lógica DOT, cenas programadas, triggers\n• **Validação técnica** — verificar se uma configuração cumpre os princípios 300\n• **Equipamentos** — recomendações de spots, drivers, sensores, servidores\n• **Princípios de design** — invisibilidade, coerência, antecipação, 2700K\n\nComo posso ajudar neste projeto${context?.projectName ? ` (${context.projectName})` : ''}?`;
}

export function generateSuggestion(type: 'room' | 'device' | 'scene' | 'integration', _roomCode?: string): string {
  const suggestions: Record<string, string[]> = {
    room: [
      'A IA sugere adicionar um sensor de presença Auro nesta divisão para iluminação antecipatória.',
      'Com base no padrão 300, recomenda-se spots trimless 2700K com CRI ≥90.',
      'Para divisões com janelas, considere um DOT4 adicional junto à janela para controlo de cortinas/estores.',
      'A temperatura de cor 2700K é o padrão GAVINHO para espaços residenciais.'
    ],
    device: [
      'O Shelly H&T Gen3 é recomendado para monitorização de temperatura e humidade.',
      'Considere integrar o Nuki Smart Lock 4.0 Pro na entrada principal.',
      'Para áudio, o Sonos Arc + Sub oferece a melhor experiência na sala.'
    ],
    scene: [
      'Sugere-se adicionar uma cena "Boa Noite" que diminua as luzes para 5% e feche cortinas.',
      'Uma cena "Despertar" com aumento gradual da luz (simula amanhecer) melhora o bem-estar.',
      'A cena "Master OFF" deve sempre preservar o estado de cortinas e estores.'
    ],
    integration: [
      'A integração KNX/DALI via gateway Helvar 950 é a recomendação standard.',
      'Para VMC, o S&P CAD-COMPACT 2500 oferece recuperação térmica ≥75%.'
    ]
  };
  const list = suggestions[type] || suggestions.room;
  return list[Math.floor(Math.random() * list.length)];
}
