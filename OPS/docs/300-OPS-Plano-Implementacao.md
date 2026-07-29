# 300 OPS — Plano de Implementação Técnico
## Engineering Engine · Prescriptions Generator · Intelligence Layer

**Versão:** 1.0  
**Data:** 2026-07-28  
**Estado:** Rascunho para revisão

---

## Índice

1. [Visão Arquitetural](#1-visão-arquitetural)
2. [Modelo de Dados](#2-modelo-de-dados)
3. [Stack Tecnológica](#3-stack-tecnológica)
4. [Arquitetura de Serviços](#4-arquitetura-de-serviços)
5. [Fases de Implementação](#5-fases-de-implementação)
6. [Infraestrutura e DevOps](#6-infraestrutura-e-devops)
7. [Segurança e Conformidade](#7-segurança-e-conformidade)
8. [Riscos e Mitigações](#8-riscos-e-mitigações)

---

## 1. Visão Arquitetural

### 1.1 Diagrama de Contexto

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLIENTES / UTILIZADORES                        │
│  (Web App · Mobile · Tablets · Voz · API Partners)                         │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         300 OPS — API Gateway                               │
│  Auth · Rate Limiting · Routing · Validation · Observability               │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
        ┌─────────────────────────────┼─────────────────────────────┐
        ▼                             ▼                             ▼
┌───────────────┐           ┌───────────────┐           ┌───────────────┐
│   CORE        │           │  INTELLIGENCE │           │   EXTERNAL    │
│   SERVICES    │◄─────────►│    LAYER      │◄─────────►│  INTEGRATIONS │
│               │           │               │           │               │
│ · Project     │           │ · NLP Engine  │           │ · KNX/DALI    │
│ · Building    │           │ · ML Models   │           │ · BACnet      │
│ · Prescription│           │ · Voice       │           │ · Modbus      │
│ · Proposal    │           │ · Predictive  │           │ · Cloud APIs  │
│ · Procurement │           │ · Digital Twin│           │ · CAD/IFC     │
│ · Commissioning│          │               │           │ · Suppliers   │
└───────────────┘           └───────────────┘           └───────────────┘
        │                             │                             │
        └─────────────────────────────┼─────────────────────────────┘
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         SINGLE SOURCE OF TRUTH                               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │ PostgreSQL  │  │  Document   │  │   Vector    │  │   Event Store       │ │
│  │  (Primary)  │  │   Store     │  │   Store     │  │  (Audit/Changes)    │ │
│  │             │  │  (S3/MinIO) │  │  (pgvector) │  │                     │ │
│  │ · Objects   │  │ · PDFs      │  │ · Embeddings│  │ · Domain Events     │ │
│  │ · Relations │  │ · DWG/DXF   │  │ · Semantic  │  │ · Change Log        │ │
│  │ · History   │  │ · Images    │  │   Search    │  │ · Time Series       │ │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 1.2 Princípios de Design

| Princípio | Implementação Técnica |
|-----------|----------------------|
| Single Source of Truth | Event Sourcing + CQRS com PostgreSQL; todos os serviços consomem do mesmo event store |
| Object-Based System | Domain-Driven Design (DDD) com Aggregates bem definidos; cada objecto tem lifecycle próprio |
| Explainable Engineering | Cada recomendação gera um `ExplanationLog` com regra, inputs, confiança, dependências |
| Human Validation | Workflow engine (Temporal/Cadence) com estados de aprovação obrigatórios antes de emissão |
| Audit Trail Completo | Todos os objectos têm `created_at`, `updated_at`, `version`, `author_id`, `approved_by`, `approved_at` |
| Extensibilidade | Plugin architecture para regras de engenharia, equipamentos e protocolos |

---

## 2. Modelo de Dados

### 2.1 Entidades Principais (Core Domain)

```sql
-- ============================================
-- CORE: PROJECT
-- ============================================
CREATE TABLE projects (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code                TEXT NOT NULL UNIQUE,           -- "300-2026-001"
    name                TEXT NOT NULL,
    client_id           UUID NOT NULL REFERENCES clients(id),
    status              project_status NOT NULL DEFAULT 'draft',
    building_type       building_type NOT NULL,         -- apartamento, penthouse, moradia...
    total_area_m2       DECIMAL(10,2),
    num_floors          INTEGER,
    num_rooms           INTEGER,
    budget_total        DECIMAL(15,2),
    budget_flexibility  budget_flexibility NOT NULL DEFAULT 'fixed',
    solution_level      solution_level NOT NULL DEFAULT 'recommended',
    
    -- Metadados de controle
    created_by          UUID NOT NULL REFERENCES users(id),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    version             INTEGER NOT NULL DEFAULT 1,
    approved_by         UUID REFERENCES users(id),
    approved_at         TIMESTAMPTZ,
    
    -- JSON flexível para dados não estruturados
    metadata            JSONB DEFAULT '{}',
    
    CONSTRAINT valid_approval CHECK (
        (approved_by IS NULL AND approved_at IS NULL) OR
        (approved_by IS NOT NULL AND approved_at IS NOT NULL)
    )
);

-- ============================================
-- CORE: BUILDING & SPATIAL HIERARCHY
-- ============================================
CREATE TABLE buildings (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id      UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name            TEXT NOT NULL,
    perimeter       GEOMETRY(POLYGON, 4326),            -- PostGIS
    total_area_m2   DECIMAL(10,2),
    num_floors      INTEGER,
    orientation     DECIMAL(5,2),                        -- graus, 0=Norte
    metadata        JSONB DEFAULT '{}',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE floors (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    building_id     UUID NOT NULL REFERENCES buildings(id) ON DELETE CASCADE,
    floor_number    INTEGER NOT NULL,
    name            TEXT,                                -- "Rés-do-chão", "1º Andar"
    area_m2         DECIMAL(10,2),
    height_m        DECIMAL(5,2),
    plan_dwg_url    TEXT,                                -- referência S3
    metadata        JSONB DEFAULT '{}',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE rooms (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    floor_id        UUID NOT NULL REFERENCES floors(id) ON DELETE CASCADE,
    name            TEXT NOT NULL,
    function        room_function NOT NULL,             -- estar, jantar, quarto, cozinha...
    area_m2         DECIMAL(10,2),
    perimeter       GEOMETRY(POLYGON, 4326),
    orientation     room_orientation,
    
    -- Estados de detecção (Mandato §3.2)
    detection_state detection_state NOT NULL DEFAULT 'inferred',
    
    -- Características
    has_windows     BOOLEAN DEFAULT false,
    num_windows     INTEGER DEFAULT 0,
    has_balcony     BOOLEAN DEFAULT false,
    is_wet_zone     BOOLEAN DEFAULT false,
    is_circulation  BOOLEAN DEFAULT false,
    is_technical    BOOLEAN DEFAULT false,
    
    metadata        JSONB DEFAULT '{}',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- CORE: REQUIREMENTS & EXPERIENCES
-- ============================================
CREATE TABLE requirements (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id          UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    room_id             UUID REFERENCES rooms(id),       -- NULL = requisito global
    category            requirement_category NOT NULL,   -- iluminacao, climatizacao, audio...
    subcategory         TEXT,
    description         TEXT NOT NULL,
    
    -- Níveis de solução (Mandato §5)
    level_essential     BOOLEAN DEFAULT false,
    level_recommended   BOOLEAN DEFAULT false,
    level_signature     BOOLEAN DEFAULT false,
    
    -- Estado e prioridade
    status              requirement_status DEFAULT 'pending',
    priority            INTEGER NOT NULL DEFAULT 3,     -- 1=critico, 5=desejavel
    
    -- Metadados
    source              TEXT,                            -- "cliente", "inferido", "regra"
    validated_by        UUID REFERENCES users(id),
    validated_at        TIMESTAMPTZ,
    metadata            JSONB DEFAULT '{}',
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE experiences (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id      UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name            TEXT NOT NULL,                       -- "Jantar Romântico", "Cinema em Casa"
    description     TEXT,
    trigger_type    experience_trigger,                 -- manual, schedule, voice, sensor, predictive
    
    -- Sequência de acções (JSON array ordenado)
    actions         JSONB NOT NULL DEFAULT '[]',
    
    is_active       BOOLEAN DEFAULT true,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- CORE: SYSTEMS & EQUIPMENT
-- ============================================
CREATE TABLE systems (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id      UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    code            TEXT NOT NULL,                       -- "ILU", "CLI", "AUD"
    name            TEXT NOT NULL,                       -- "Iluminação", "Climatização"
    category        system_category NOT NULL,
    protocol        TEXT,                                -- KNX, DALI, BACnet, Modbus...
    
    -- Estado
    status          system_status DEFAULT 'design',
    
    -- Topologia (JSON grafo de conectividade)
    topology        JSONB DEFAULT '{}',
    
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE subsystems (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    system_id       UUID NOT NULL REFERENCES systems(id) ON DELETE CASCADE,
    code            TEXT NOT NULL,
    name            TEXT NOT NULL,
    function        TEXT,
    topology        JSONB DEFAULT '{}',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE equipment (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    library_id          UUID REFERENCES equipment_library(id),  -- NULL = custom
    subsystem_id        UUID NOT NULL REFERENCES subsystems(id),
    room_id             UUID REFERENCES rooms(id),               -- NULL = zona técnica
    
    -- Identificação
    code                TEXT NOT NULL,
    name                TEXT NOT NULL,
    description         TEXT,
    
    -- Posicionamento
    position_geometry   GEOMETRY(POINT, 4326),                   -- PostGIS
    
    -- Especificações técnicas
    specifications      JSONB DEFAULT '{}',                       -- dimensões, potência, IP, IK...
    
    -- Estados
    installation_status equipment_install_status DEFAULT 'planned',
    commissioning_status equipment_commission_status DEFAULT 'pending',
    
    -- Custos
    unit_cost           DECIMAL(12,2),
    installation_cost   DECIMAL(12,2),
    quantity            INTEGER NOT NULL DEFAULT 1,
    
    metadata            JSONB DEFAULT '{}',
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- CORE: PRESCRIPTION (Caderno de Prescrição)
-- ============================================
CREATE TABLE prescriptions (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id              UUID NOT NULL REFERENCES projects(id),
    system_id               UUID REFERENCES systems(id),
    subsystem_id            UUID REFERENCES subsystems(id),
    room_id                 UUID REFERENCES rooms(id),
    
    -- Identificação (Mandato §7.1)
    code                    TEXT NOT NULL,
    version                 INTEGER NOT NULL DEFAULT 1,
    
    -- Requisitos
    functional_requirement  TEXT NOT NULL,
    technical_requirement   TEXT NOT NULL,
    min_performance         TEXT,
    
    -- Solução
    sizing_criterion        TEXT,
    reference_solution      TEXT,                           -- solução de referência 300
    acceptable_alternatives JSONB DEFAULT '[]',
    
    -- Infraestrutura e integração
    required_infrastructure TEXT,
    integrations            JSONB DEFAULT '[]',
    protocols               JSONB DEFAULT '[]',
    
    -- Validação
    acceptance_criterion    TEXT,
    test_method             TEXT,
    applicable_standard     TEXT,                           -- norma aplicável
    
    -- Controlo
    responsible_validation  UUID REFERENCES users(id),
    origin                  TEXT,                           -- origem da regra/prescrição
    status                  prescription_status DEFAULT 'draft',
    priority                INTEGER DEFAULT 3,
    
    -- Impacto
    estimated_cost          DECIMAL(12,2),
    budget_impact           budget_impact_level DEFAULT 'neutral',
    dependencies            JSONB DEFAULT '[]',             -- IDs de prescrições dependentes
    risks                   JSONB DEFAULT '[]',
    exceptions              JSONB DEFAULT '[]',
    pending_items           JSONB DEFAULT '[]',
    
    -- Aprovação
    created_by              UUID NOT NULL REFERENCES users(id),
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    approved_by             UUID REFERENCES users(id),
    approved_at             TIMESTAMPTZ,
    
    -- Único por código+versão
    UNIQUE(code, version)
);

-- ============================================
-- CORE: TECHNICAL ZONES
-- ============================================
CREATE TABLE technical_zones (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id          UUID NOT NULL REFERENCES projects(id),
    building_id         UUID REFERENCES buildings(id),
    
    -- Identificação
    code                TEXT NOT NULL,
    name                TEXT NOT NULL,
    zone_type           technical_zone_type NOT NULL,       -- quadro_controlo, rack_ti, rack_av...
    
    -- Dimensões
    width_mm            INTEGER,
    height_mm           INTEGER,
    depth_mm            INTEGER,
    area_m2             DECIMAL(8,2),
    
    -- Localização
    location_geometry   GEOMETRY(POINT, 4326),
    floor_id            UUID REFERENCES floors(id),
    
    -- Capacidade
    max_din_units       INTEGER,
    max_dissipation_w   INTEGER,
    max_weight_kg       INTEGER,
    
    -- Ambiente
    ventilation_type    TEXT,
    noise_limit_db      INTEGER,
    access_requirement  TEXT,
    
    -- Estado
    status              zone_status DEFAULT 'planned',
    
    -- Layout interno (JSON com posicionamento de equipamentos)
    internal_layout     JSONB DEFAULT '{}',
    
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- CORE: INTEGRATION MATRIX
-- ============================================
CREATE TABLE integrations (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id          UUID NOT NULL REFERENCES projects(id),
    
    -- Origem e destino
    source_system_id    UUID NOT NULL REFERENCES systems(id),
    target_system_id    UUID NOT NULL REFERENCES systems(id),
    
    -- Evento e condição
    event_trigger       TEXT NOT NULL,                      -- "CO2 > 900 ppm"
    condition           TEXT,                               -- "durante 5 minutos"
    
    -- Acção
    action              TEXT NOT NULL,                      -- "Boost local VMC"
    
    -- Protocolo e gateway
    protocol            TEXT,
    gateway_id          UUID REFERENCES equipment(id),
    
    -- Resiliência
    priority            INTEGER DEFAULT 3,
    fallback_action     TEXT,                               -- "Se gateway falhar..."
    timeout_seconds     INTEGER DEFAULT 30,
    
    -- Segurança
    security_level      security_level DEFAULT 'standard',
    test_procedure      TEXT,
    
    is_active           BOOLEAN DEFAULT true,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- INTELLIGENCE: AI LOCAL
-- ============================================
CREATE TABLE ai_local_servers (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id          UUID NOT NULL REFERENCES projects(id),
    
    -- Hardware
    model               TEXT NOT NULL,
    serial_number       TEXT,
    ip_address          INET,
    mac_address         MACADDR,
    
    -- Recursos
    cpu_cores           INTEGER,
    ram_gb              INTEGER,
    storage_gb          INTEGER,
    gpu_model           TEXT,
    
    -- Estado
    status              ai_server_status DEFAULT 'active',
    last_heartbeat      TIMESTAMPTZ,
    
    -- Modelos instalados
    installed_models    JSONB DEFAULT '[]',
    
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE ai_learned_patterns (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    server_id           UUID NOT NULL REFERENCES ai_local_servers(id),
    
    pattern_name        TEXT NOT NULL,
    pattern_type        pattern_type NOT NULL,              -- occupancy, temperature, lighting...
    
    -- Dados do padrão
    trigger_conditions  JSONB NOT NULL,
    proposed_actions    JSONB NOT NULL,
    confidence_score    DECIMAL(3,2),                       -- 0.00 - 1.00
    
    -- Validação (Mandato §16.4)
    status              pattern_status DEFAULT 'suggested',
    approved_by         UUID REFERENCES users(id),
    approved_at         TIMESTAMPTZ,
    rule_scope          TEXT,                               -- âmbito da regra
    affected_users      JSONB DEFAULT '[]',
    max_executions      INTEGER,                            -- limite
    execution_history   JSONB DEFAULT '[]',
    
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- PROCUREMENT & COSTS
-- ============================================
CREATE TABLE equipment_library (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Identificação
    brand               TEXT NOT NULL,
    reference           TEXT NOT NULL,
    category            equipment_category NOT NULL,
    description         TEXT,
    
    -- Especificações
    dimensions_mm       JSONB,                              -- {w, h, d}
    weight_kg           DECIMAL(8,2),
    mount_type          TEXT,
    din_units           INTEGER,
    power_w             INTEGER,
    dissipation_w       INTEGER,
    voltage_v           DECIMAL(6,2),
    protocols           JSONB DEFAULT '[]',
    inputs              JSONB DEFAULT '[]',
    outputs             JSONB DEFAULT '[]',
    ip_rating           TEXT,
    ik_rating           TEXT,
    noise_db            INTEGER,
    compatibilities     JSONB DEFAULT '[]',
    
    -- Comercial
    list_price          DECIMAL(12,2),
    discount_pct        DECIMAL(5,2) DEFAULT 0,
    net_price           DECIMAL(12,2),
    currency            TEXT DEFAULT 'EUR',
    price_valid_until   DATE,
    lead_time_days      INTEGER,
    supplier_id         UUID REFERENCES suppliers(id),
    warranty_months     INTEGER,
    maintenance_schedule TEXT,
    documentation_url   TEXT,
    
    -- Controlo
    is_active           BOOLEAN DEFAULT true,
    last_updated        TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by          UUID REFERENCES users(id),
    
    UNIQUE(brand, reference)
);

CREATE TABLE proposals (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id          UUID NOT NULL REFERENCES projects(id),
    
    -- Identificação
    code                TEXT NOT NULL,
    version             INTEGER NOT NULL DEFAULT 1,
    solution_level      solution_level NOT NULL,
    
    -- Conteúdo editorial (Mandato §13)
    title               TEXT NOT NULL,
    summary             TEXT,
    vision_text         TEXT,                               -- visão da solução
    building_reading    TEXT,                               -- leitura do imóvel
    identified_needs    JSONB DEFAULT '[]',
    experiences         JSONB DEFAULT '[]',
    systems_summary     JSONB DEFAULT '[]',
    ai_local_summary    TEXT,
    interfaces_summary  JSONB DEFAULT '[]',
    
    -- Opções e custos
    investment_total    DECIMAL(15,2),
    installation_cost   DECIMAL(15,2),
    programming_cost    DECIMAL(15,2),
    commissioning_cost  DECIMAL(15,2),
    licenses_cost       DECIMAL(15,2),
    annual_maintenance  DECIMAL(15,2),
    
    -- Exclusões e pressupostos
    exclusions          JSONB DEFAULT '[]',
    assumptions         JSONB DEFAULT '[]',
    
    -- Metadados
    status              proposal_status DEFAULT 'draft',
    created_by          UUID NOT NULL REFERENCES users(id),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    approved_by         UUID REFERENCES users(id),
    approved_at         TIMESTAMPTZ,
    
    UNIQUE(code, version)
);

-- ============================================
-- EXPLAINABILITY & AUDIT
-- ============================================
CREATE TABLE explanation_logs (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Ligação
    project_id          UUID NOT NULL REFERENCES projects(id),
    entity_type         TEXT NOT NULL,                      -- "prescription", "equipment", "zone"
    entity_id           UUID NOT NULL,
    
    -- Dados de entrada
    input_data          JSONB NOT NULL,
    
    -- Regra aplicada
    rule_id             UUID REFERENCES engineering_rules(id),
    rule_name           TEXT,
    rule_source         TEXT,                               -- origem da regra
    
    -- Resultado
    output_data         JSONB NOT NULL,
    confidence_score    DECIMAL(3,2),
    
    -- Dependências e impacto
    dependencies        JSONB DEFAULT '[]',
    economic_impact     JSONB,
    
    -- Validação
    needs_human_validation BOOLEAN DEFAULT true,
    validated_by        UUID REFERENCES users(id),
    validated_at        TIMESTAMPTZ,
    
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE engineering_rules (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Identificação
    code                TEXT NOT NULL UNIQUE,
    name                TEXT NOT NULL,
    description         TEXT,
    
    -- Categorização
    category            rule_category NOT NULL,             -- iluminacao, climatizacao...
    applies_to_type     building_type[],                     -- ARRAY de tipologias
    
    -- Regra (pode ser código, expressão, ou referência a função)
    rule_expression     TEXT NOT NULL,                      -- ex: "spots = ceil(area_m2 / 4)"
    rule_language       TEXT DEFAULT 'javascript',          -- javascript, python, sql...
    
    -- Parâmetros
    parameters          JSONB DEFAULT '{}',                 -- {min_spacing: 2.5, max_w_per_spot: 12}
    
    -- Condições
    preconditions       JSONB DEFAULT '[]',                 -- condições necessárias
    exclusions          JSONB DEFAULT '[]',                 -- quando NÃO aplicar
    incompatibilities   JSONB DEFAULT '[]',                 -- equipamentos incompatíveis
    
    -- Metadados
    source              TEXT,                               -- norma, fabricante, experiencia
    version             INTEGER NOT NULL DEFAULT 1,
    author              UUID REFERENCES users(id),
    approval_status     rule_approval_status DEFAULT 'draft',
    
    is_active           BOOLEAN DEFAULT true,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- EVENT STORE (Single Source of Truth)
-- ============================================
CREATE TABLE domain_events (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Identificação
    aggregate_type      TEXT NOT NULL,                      -- "project", "prescription", "equipment"
    aggregate_id        UUID NOT NULL,
    event_type          TEXT NOT NULL,                      -- "ProjectCreated", "EquipmentAdded"
    event_version       INTEGER NOT NULL DEFAULT 1,
    
    -- Payload
    payload             JSONB NOT NULL,
    
    -- Metadados
    correlation_id      UUID,                               -- rastreabilidade cross-service
    causation_id        UUID,                               -- evento que causou este
    
    -- Origem
    emitted_by          UUID REFERENCES users(id),
    emitted_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    -- Processamento
    processed           BOOLEAN DEFAULT false,
    processed_at        TIMESTAMPTZ,
    processed_by        TEXT,                               -- nome do consumer
    
    -- Índice para ordenação
    sequence_number     BIGSERIAL
);

CREATE INDEX idx_domain_events_aggregate ON domain_events(aggregate_type, aggregate_id, sequence_number);
CREATE INDEX idx_domain_events_unprocessed ON domain_events(processed, emitted_at);
```

### 2.2 Enumerações (Tipos Customizados)

```sql
-- Tipos de edifício (Mandato §3.3)
CREATE TYPE building_type AS ENUM (
    'apartamento', 'penthouse', 'moradia', 'villa_grande',
    'edificio_multifamiliar', 'hotel', 'aparthotel', 'resort',
    'escritorio', 'retail', 'espaco_saude', 'residencia_senior'
);

-- Níveis de solução (Mandato §5)
CREATE TYPE solution_level AS ENUM ('essential', 'recommended', 'signature');

-- Estados de detecção (Mandato §3.2)
CREATE TYPE detection_state AS ENUM (
    'confirmed', 'detected', 'inferred', 'to_confirm', 'unavailable'
);

-- Categorias de requisito
CREATE TYPE requirement_category AS ENUM (
    'iluminacao', 'cortinas', 'climatizacao', 'piso_radiante',
    'vmc', 'piscina', 'spa', 'sauna', 'ice_bath',
    'audio', 'video', 'cinema', 'controlo_voz', 'tablets',
    'seguranca', 'cctv', 'controlo_acessos', 'carregamento_eletrico',
    'fotovoltaico', 'baterias', 'rega', 'agua', 'rede',
    'ia_local', 'aprendizagem', 'atuacao_preditiva'
);

-- Estados de prescrição
CREATE TYPE prescription_status AS ENUM (
    'draft', 'review', 'approved', 'rejected', 'superseded'
);

-- Tipos de zona técnica (Mandato §9.2)
CREATE TYPE technical_zone_type AS ENUM (
    'quadro_controlo', 'zona_drivers', 'rack_ti', 'rack_av',
    'servidor_ia', 'ups', 'quadro_knx', 'quadro_dali',
    'zona_piscina', 'zona_termica', 'zona_baterias',
    'zona_rede', 'zona_tecnica_combinada'
);

-- Estados do padrão de IA (Mandato §16.4)
CREATE TYPE pattern_status AS ENUM (
    'suggested', 'pending_approval', 'approved', 'rejected', 'active', 'revoked'
);
```

### 2.3 Relações e Integridade Referencial

```
Project 1───* Building 1───* Floor 1───* Room
    │           │              │           │
    │           │              │           ├─* Requirement
    │           │              │           ├─* Equipment
    │           │              │           └─* Prescription
    │           │              │
    │           │              └─* TechnicalZone
    │           │
    ├─* System 1───* Subsystem 1───* Equipment
    │   │                              │
    │   └─* Integration ◄──────────────┘
    │
    ├─* Requirement (global)
    ├─* Experience
    ├─* Prescription
    ├─* Proposal
    ├─* AILocalServer 1───* AILearnedPattern
    └─* ExplanationLog

EngineeringRule 1───* ExplanationLog
```

---

## 3. Stack Tecnológica

### 3.1 Backend

| Camada | Tecnologia | Justificação |
|--------|-----------|--------------|
| **Runtime** | Node.js 22 LTS + TypeScript | Ecosistema maduro, tipagem forte, excelente para APIs REST/GraphQL |
| **Framework** | NestJS | Arquitetura modular, DDD nativo, DI container, guards/pipes/interceptors |
| **ORM** | Prisma + Kysely | Prisma para migrations e DAL; Kysely para queries complexas e performáticas |
| **Base de Dados** | PostgreSQL 16 + PostGIS | ACID, JSONB, full-text search, pgvector para embeddings, PostGIS para geometria |
| **Cache** | Redis 7 | Sessions, rate limiting, real-time pub/sub, cache de regras |
| **Event Bus** | PostgreSQL LISTEN/NOTIFY + Redis Streams | Event sourcing leve; para escala futura: NATS ou RabbitMQ |
| **Workflow Engine** | Temporal.io | Orquestração de workflows longos (aprovações, commissioning) |
| **Fila** | BullMQ (Redis) | Background jobs: processamento de PDFs, geração de propostas |

### 3.2 Frontend

| Camada | Tecnologia | Justificação |
|--------|-----------|--------------|
| **Framework** | Next.js 15 (App Router) | SSR/SSG, React Server Components, streaming |
| **Linguagem** | TypeScript 5.5 | Tipagem end-to-end |
| **Estilização** | Tailwind CSS + shadcn/ui | Componentes acessíveis, design system consistente |
| **Estado Global** | Zustand + TanStack Query | Simplicidade para UI state; cache server-side eficiente |
| **Visualização 2D** | Fabric.js / React-Konva | Desenho e edição de plantas no browser |
| **Visualização 3D** | Three.js / React Three Fiber | Visualização de zonas técnicas e integração arquitetónica |
| **Gráficos** | Recharts / Visx | Dashboards e métricas |

### 3.3 IA / Machine Learning

| Componente | Tecnologia | Justificação |
|-----------|-----------|--------------|
| **LLM Local** | Ollama + Llama 3 / Mistral | Soberania digital; pode correr em servidor local do projecto |
| **Embeddings** | sentence-transformers (multilingual) | Português + Inglês; compatível com pgvector |
| **RAG** | LangChain / LlamaIndex | Retrieval-augmented generation sobre biblioteca técnica 300 |
| **Voice** | Whisper (local) + Piper TTS | Reconhecimento e síntese de voz offline |
| **Document AI** | Docling / Marker | Extração estruturada de PDFs, DWG metadata |
| **Time Series** | InfluxDB | Dados de sensores, padrões de ocupação, consumos |

### 3.4 Infraestrutura

| Componente | Tecnologia | Justificação |
|-----------|-----------|--------------|
| **Containerização** | Docker + Docker Compose (dev) / Kubernetes (prod) | Portabilidade, escalabilidade |
| **CI/CD** | GitHub Actions | Integração nativa com GitHub |
| **Observability** | Grafana + Prometheus + Loki + Tempo | Métricas, logs, traces (stack OpenTelemetry) |
| **Object Storage** | MinIO (self-hosted) ou S3 | DWGs, PDFs, imagens, documentos |
| **Reverse Proxy** | Traefik | Routing automático, Let's Encrypt, middlewares |
| **VPN** | WireGuard | Acesso remoto seguro a sites |

---

## 4. Arquitetura de Serviços

### 4.1 Diagrama de Serviços

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              API GATEWAY (Traefik)                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │   Auth      │  │   Rate      │  │   Request   │  │   WebSocket         │ │
│  │   Service   │  │   Limiter   │  │   Router    │  │   Handler           │ │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
        ┌─────────────────────────────┼─────────────────────────────┐
        ▼                             ▼                             ▼
┌───────────────┐           ┌───────────────┐           ┌───────────────┐
│   PROJECT     │           │  ENGINEERING  │           │  INTELLIGENCE │
│   SERVICE     │◄─────────►│    ENGINE     │◄─────────►│    SERVICE    │
│               │           │               │           │               │
│ · CRUD Proj   │           │ · Rule Engine │           │ · NLP/Voice   │
│ · Buildings   │           │ · Sizing      │           │ · ML Models   │
│ · Rooms       │           │ · Topology    │           │ · Patterns    │
│ · Documents   │           │ · Prescribe   │           │ · Predictions │
│ · Requirements│           │ · Zones       │           │ · Digital Twin│
└───────────────┘           └───────────────┘           └───────────────┘
        │                             │                             │
        │                    ┌────────┴────────┐                    │
        │                    ▼                 ▼                    │
        │            ┌───────────────┐  ┌───────────────┐          │
        │            │  PROCUREMENT  │  │   DOCUMENT    │          │
        │            │   SERVICE     │  │   SERVICE     │          │
        │            │               │  │               │          │
        │            │ · Catalog     │  │ · PDF Gen     │          │
        │            │ · Pricing     │  │ · DWG Export  │          │
        │            │ · Suppliers   │  │ · Proposals   │          │
        │            │ · Value Eng.  │  │ · Specs       │          │
        │            └───────────────┘  └───────────────┘          │
        │                    │                 │                    │
        └────────────────────┴─────────────────┴────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         SHARED INFRASTRUCTURE                                │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │ PostgreSQL  │  │    Redis    │  │   MinIO     │  │   Temporal          │ │
│  │  + PostGIS  │  │             │  │   (S3)      │  │   (Workflows)       │ │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────────────┘ │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │  InfluxDB   │  │  pgvector   │  │  BullMQ     │  │   Ollama            │ │
│  │ (Time Ser.) │  │(Embeddings) │  │  (Queue)    │  │   (LLM Local)       │ │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 4.2 Contratos de API

Todas as APIs seguem padrão **REST + JSON:API** ou **GraphQL** para queries complexas.

**Headers obrigatórios:**
```
X-Request-ID: <uuid>           -- rastreabilidade
X-Correlation-ID: <uuid>      -- rastreabilidade cross-service
X-User-ID: <uuid>             -- identificação do utilizador
X-Project-Context: <uuid>     -- contexto de projecto (multi-tenant)
```

**Respostas padronizadas:**
```json
{
  "data": { ... },
  "meta": {
    "version": "1.0",
    "request_id": "uuid",
    "timestamp": "2026-07-28T20:00:00Z",
    "confidence": 0.94,
    "needs_validation": true
  },
  "links": {
    "self": "/api/v1/prescriptions/abc123",
    "related": {
      "equipment": "/api/v1/equipment?prescription_id=abc123",
      "explanation": "/api/v1/explanations?entity_id=abc123"
    }
  }
}
```

### 4.3 Eventos de Domínio (Event Sourcing)

```typescript
// Exemplos de eventos para o aggregate "Project"
interface ProjectCreated {
  type: 'ProjectCreated';
  aggregateId: string;
  payload: {
    code: string;
    name: string;
    clientId: string;
    buildingType: BuildingType;
  };
}

interface RoomDetected {
  type: 'RoomDetected';
  aggregateId: string;
  payload: {
    roomId: string;
    floorId: string;
    name: string;
    areaM2: number;
    detectionMethod: 'ai_vision' | 'manual' | 'dwg_import';
    confidence: number;
  };
}

interface PrescriptionApproved {
  type: 'PrescriptionApproved';
  aggregateId: string;
  payload: {
    prescriptionId: string;
    version: number;
    approvedBy: string;
    approvedAt: string;
  };
}

// Projeções (read models) são atualizadas assincronamente por event handlers
```

---

## 5. Fases de Implementação

### Fase 0: Fundações (Semanas 1-4)
**Objectivo:** Infraestrutura, CI/CD, autenticação, base de dados com migrations.

| Deliverable | Descrição |
|-------------|-----------|
| Repo + CI/CD | GitHub repo, GitHub Actions (lint, test, build, deploy) |
| Docker Compose | Ambiente de desenvolvimento completo com hot-reload |
| Base de Dados | Schema completo com enums, constraints, índices, PostGIS |
| Auth Service | JWT + OAuth2, roles (admin, engenheiro, técnico, cliente) |
| API Gateway | Traefik com routing, rate limiting, CORS |
| Observability | Grafana + Prometheus + Loki básicos |

**Milestone:** `curl /health` retorna OK com toda a stack a correr.

---

### Fase 1: Core Domain — Project & Building (Semanas 5-10)
**Objectivo:** CRUD completo de projectos, edifícios, pisos, divisões com leitura de plantas.

| Deliverable | Descrição |
|-------------|-----------|
| Project Service | CRUD projectos, clientes, equipas |
| Building Import | Upload e parsing de PDFs, DWG, DXF, IFC |
| Room Detection | AI para detecção de divisões em plantas (estados: detected/inferred/confirmed) |
| Web App v0.1 | Dashboard de projectos, upload de documentos, visualizador de plantas |
| Document Store | MinIO para armazenamento de documentos de entrada |

**Milestone:** Conseguir criar um projecto, fazer upload de uma planta, e ver divisões detectadas com estados.

---

### Fase 2: Engineering Engine v1 (Semanas 11-18)
**Objectivo:** Motor de regras de engenharia com prescrições básicas.

| Deliverable | Descrição |
|-------------|-----------|
| Rule Engine | Motor de regras parametrizáveis (JS/DSL) com versioning |
| Rule Library | Biblioteca inicial de regras: iluminação, cortinas, climatização básica |
| Prescription Service | Geração de prescrições a partir de requisitos + regras |
| Explanation Engine | Cada prescrição gera ExplanationLog com dados de entrada, regra, confiança |
| Validation Workflow | Estados de aprovação obrigatórios antes de "approved" |
| Web App v0.2 | Editor de requisitos, visualizador de prescrições, log de explicabilidade |

**Milestone:** Introduzir requisitos para uma sala (58m², estar+jantar, Recommended) e obter prescrição de iluminação com spots, circuitos, justificação e confiança.

---

### Fase 3: Equipment, Zones & Proposal (Semanas 19-26)
**Objectivo:** Biblioteca técnica, zonas técnicas, e geração de propostas.

| Deliverable | Descrição |
|-------------|-----------|
| Equipment Library | Catálogo com especificações técnicas completas, preços, fornecedores |
| Equipment Matching | Matching de prescrições a equipamentos da biblioteca |
| Technical Zone Generator | Geração paramétrica de zonas técnicas com layouts internos |
| Proposal Generator | Geração de propostas Essential/Recommended/Signature |
| Document Generation | PDF de proposta com imagens, custos, comparativo |
| Cost Engine | Cálculo de investimento, instalação, commissioning, TCO |

**Milestone:** Gerar proposta completa com 3 níveis de solução para um apartamento de exemplo.

---

### Fase 4: Intelligence Layer — AI Local (Semanas 27-34)
**Objectivo:** IA local, controlo por voz, aprendizagem proactiva.

| Deliverable | Descrição |
|-------------|-----------|
| AI Local Server | Configuração de servidor local por projecto (Ollama + modelos) |
| Voice Interface | Reconhecimento (Whisper) e síntese (Piper) de voz em PT/EN |
| NLP Engine | Interpretação de comandos naturais → acções estruturadas |
| Pattern Learning | Detecção de padrões de uso com aprovação obrigatória |
| Predictive Engine | Antecipação de chegadas, ocupação, temperatura, manutenção |
| Privacy Matrix | Configuração de privacidade por divisão e por utilizador |
| Digital Twin v0.1 | Representação virtual do estado actual do edifício |

**Milestone:** Dizer "Prepara a casa para jantar" e o sistema sugerir/executar a cena com track de aprovação.

---

### Fase 5: Integration, Commissioning & Production (Semanas 35-44)
**Objectivo:** Integrações com protocolos, commissioning, digital twin operacional.

| Deliverable | Descrição |
|-------------|-----------|
| Integration Matrix | Registo de integrações sistema-a-sistema com fallbacks |
| Protocol Adapters | KNX, DALI, BACnet, Modbus, MQTT |
| Commissioning Module | Planos de teste, checklists, registo de resultados |
| Maintenance Module | Agendamento, histórico, alertas preditivos |
| Digital Twin v1.0 | Representação em tempo real com dados de sensores |
| Mobile App v0.1 | App para técnicos em campo (checklists, fotos, assinaturas) |

**Milestone:** Commissioning completo de um projecto piloto com digital twin operacional.

---

### Fase 6: Scale & Polish (Semanas 45-52)
**Objectivo:** Performance, escalabilidade, refinamento UX, analytics.

| Deliverable | Descrição |
|-------------|-----------|
| Performance | Query optimization, caching, CDN para assets |
| Analytics | Dashboards de KPIs, relatórios de produtividade |
| Template Library | Soluções-tipo pré-configuradas (apartamento, penthouse, hotel...) |
| API Partners | API pública para integrações com parceiros |
| White-label | Customização de marca por cliente/parceiro |
| Security Audit | Penetration testing, hardening, compliance |

---

## 6. Infraestrutura e DevOps

### 6.1 Ambientes

| Ambiente | Infraestrutura | Dados |
|----------|---------------|-------|
| **Local (Dev)** | Docker Compose em máquina do developer | Seeds + fixtures |
| **Staging** | Kubernetes em cloud (Hetzner/DigitalOcean) | Dados anonimizados de produção |
| **Production** | Kubernetes on-premise ou cloud dedicada | Dados reais, backups, HA |
| **Edge (Site)** | Servidor local do projecto (AI, gateway) | Dados do projecto, sync com cloud |

### 6.2 Backup e Disaster Recovery

```yaml
# Política de backups
postgresql:
  full_backup: "0 2 * * *"      # Diário às 02:00
  retention: "30d"
  offsite: "s3://backup-300/"

minio:
  replication: "cross-region"
  versioning: "enabled"
  lifecycle:
    - transition_to_glacier: "90d"
    - delete_after: "7y"        # retenção legal de projectos

temporal:
  archive_after: "30d"
  retention: "1y"
```

### 6.3 Escalabilidade

```
Horizontal Scaling Triggers:
  - API Gateway:      CPU > 70% por 2min → +1 pod
  - Project Service:  Request queue > 100 → +1 pod
  - Engineering Engine: Job queue > 50 → +1 worker
  - AI Service:       GPU utilization > 80% → +1 node

Vertical Scaling:
  - PostgreSQL:       Connection pool > 80% → upgrade instance
  - Redis:            Memory > 70% → upgrade instance
```

---

## 7. Segurança e Conformidade

### 7.1 Modelo de Segurança

```
┌─────────────────────────────────────────────────────────────┐
│                      ZERO TRUST                              │
├─────────────────────────────────────────────────────────────┤
│  Layer 1: Network                                           │
│    · VLANs segregadas (IoT, Management, AV, General)       │
│    · Firewall por segmento                                  │
│    · VPN obrigatório para acesso remoto                     │
│                                                             │
│  Layer 2: Application                                       │
│    · OAuth2 + MFA para todos os utilizadores               │
│    · RBAC com princípio do menor privilégio                │
│    · Rate limiting por utilizador e por IP                 │
│    · Input validation em todos os endpoints                │
│                                                             │
│  Layer 3: Data                                              │
│    · Encryption at rest (AES-256)                          │
│    · Encryption in transit (TLS 1.3)                       │
│    · Field-level encryption para dados sensíveis           │
│    · Audit log de todos os acessos                         │
│                                                             │
│  Layer 4: AI / Privacy                                      │
│    · Soberania digital: funções essenciais operam local    │
│    · Cloud opcional, nunca obrigatória                     │
│    · Matriz de privacidade por divisão                     │
│    · Consentimento explícito para gravação de voz/vídeo    │
└─────────────────────────────────────────────────────────────┘
```

### 7.2 Ações Críticas (Mandato §16.7)

| Ação | Controles Adicionais |
|------|---------------------|
| Abrir portas | MFA + notificação push + registo de audit |
| Desactivar alarmes | MFA + aprovação de segundo administrador |
| Alterar acessos | Aprovação do gestor + notificação ao utilizador |
| Gravar áudio/vídeo | Consentimento explícito + indicador visual |
| Operar equipamentos de risco | Confirmação de segurança + timeout automático |

### 7.3 Compliance

| Requisito | Implementação |
|-----------|--------------|
| **RGPD** | Consentimento, direito ao esquecimento, portabilidade, DPO |
| **ISO 27001** | Políticas de segurança, gestão de riscos, controles |
| **KNX/DALI** | Compatibilidade certificada de gateways |
| **NFC 15-100** (França) / **REBT** (Portugal) | Regras de engenharia alinhadas |

---

## 8. Riscos e Mitigações

| Risco | Probabilidade | Impacto | Mitigação |
|-------|--------------|---------|-----------|
| Complexidade do rule engine paralisar entregas | Média | Alto | Começar com regras hardcoded em JS, evoluir para DSL |
| Performance com geometria PostGIS em escala | Média | Alto | Indexação espacial, particionamento por projecto |
| Integração com DWG/IFC inconsistente | Alta | Médio | Fallback para upload manual, validação humana obrigatória |
| LLM local não ter capacidade suficiente | Média | Médio | Fallback para cloud opcional, com consentimento |
| Resistência de utilizadores à validação obrigatória | Média | Médio | UX frictionless, notificações contextuais, batch approval |
| Vendor lock-in de equipamentos | Baixa | Alto | Biblioteca aberta, regras de equivalência, múltiplos fornecedores |
| Segurança de IoT comprometida | Média | Alto | VLANs, segmentação, updates automáticos, monitorização |

---

## Apêndice A: Estimativa de Esforço

| Fase | Duração | Equipa | Story Points (est.) |
|------|---------|--------|---------------------|
| Fase 0: Fundações | 4 semanas | 2 eng backend + 1 DevOps | ~80 |
| Fase 1: Core Domain | 6 semanas | 2 eng backend + 1 frontend + 1 UX | ~120 |
| Fase 2: Engineering Engine | 8 semanas | 2 eng backend + 1 ML + 1 frontend | ~160 |
| Fase 3: Equipment & Proposal | 8 semanas | 2 eng backend + 1 frontend + 1 data | ~160 |
| Fase 4: Intelligence Layer | 8 semanas | 2 eng backend + 2 ML/AI + 1 frontend | ~200 |
| Fase 5: Integration & Prod | 10 semanas | 2 eng backend + 1 embedded + 1 mobile + 1 frontend | ~200 |
| Fase 6: Scale & Polish | 8 semanas | Full team | ~160 |
| **Total** | **52 semanas (~1 ano)** | **Peak: 6-8 pessoas** | **~1080** |

---

## Apêndice B: Glossário de Termos

| Termo | Definição |
|-------|-----------|
| **Single Source of Truth** | Um único modelo de dados alimenta todos os outputs; alterações propagam-se automaticamente |
| **Event Sourcing** | Estado actual derivado de sequência imutável de eventos; permite replay e audit |
| **CQRS** | Command Query Responsibility Segregation — separação de modelos de escrita e leitura |
| **Digital Twin** | Réplica virtual do edifício em tempo real, usada para monitorização e simulação |
| **Commissioning** | Processo de verificação e teste sistemático de todos os sistemas instalados |
| **Value Engineering** | Análise de função/custo para otimizar investimento sem comprometer qualidade |
| **Soberania Digital** | Capacidade de operar funções essenciais sem dependência de serviços cloud |

---

*Documento gerado a partir do Mandato 300 OPS. Requer revisão técnica e aprovação antes de início de implementação.*
