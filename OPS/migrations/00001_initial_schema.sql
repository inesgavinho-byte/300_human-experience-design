-- ============================================================
-- 300 OPS — Migration Inicial
-- Schema completo: Engineering Engine · Prescriptions · Intelligence Layer
-- Target: PostgreSQL 16 + PostGIS + pgvector (Supabase)
-- ============================================================

-- ============================================================
-- 0. EXTENSIONS
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";
CREATE EXTENSION IF NOT EXISTS "pgvector";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- 1. ENUMS
-- ============================================================

-- Tipos de edifício (Mandato §3.3)
CREATE TYPE building_type AS ENUM (
    'apartamento', 'penthouse', 'moradia', 'villa_grande',
    'edificio_multifamiliar', 'hotel', 'aparthotel', 'resort',
    'escritorio', 'retail', 'espaco_saude', 'residencia_senior'
);
COMMENT ON TYPE building_type IS 'Classificação tipológica do imóvel conforme Mandato §3.3';

-- Níveis de solução (Mandato §5)
CREATE TYPE solution_level AS ENUM ('essential', 'recommended', 'signature');
COMMENT ON TYPE solution_level IS 'Nível de solução: Essential, 300 Recommended, 300 Signature';

-- Estados de detecção (Mandato §3.2)
CREATE TYPE detection_state AS ENUM (
    'confirmed', 'detected', 'inferred', 'to_confirm', 'unavailable'
);
COMMENT ON TYPE detection_state IS 'Estado de cada elemento detectado na planta. Nunca tratar inferred como confirmed.';

-- Categorias de requisito funcional (Mandato §4.1)
CREATE TYPE requirement_category AS ENUM (
    'iluminacao', 'cortinas', 'climatizacao', 'piso_radiante',
    'vmc', 'piscina', 'spa', 'sauna', 'ice_bath',
    'audio', 'video', 'cinema', 'controlo_voz', 'tablets',
    'seguranca', 'cctv', 'controlo_acessos', 'carregamento_eletrico',
    'fotovoltaico', 'baterias', 'rega', 'agua', 'rede',
    'ia_local', 'aprendizagem', 'atuacao_preditiva'
);
COMMENT ON TYPE requirement_category IS 'Categorias de requisitos funcionais conforme Mandato §4.1';

-- Estado de requisito
CREATE TYPE requirement_status AS ENUM ('pending', 'confirmed', 'rejected', 'superseded');

-- Função de divisão
CREATE TYPE room_function AS ENUM (
    'estar', 'jantar', 'quarto', 'suite', 'cozinha', 'wc',
    'hall', 'corredor', 'escritorio', 'ginasio', 'cinema',
    'spa', 'piscina_interior', 'garagem', 'arrumos', 'terraço',
    'jardim', 'zona_tecnica', 'staff', 'outro'
);

-- Orientação de divisão
CREATE TYPE room_orientation AS ENUM ('norte', 'sul', 'este', 'oeste', 'nordeste', 'noroeste', 'sudeste', 'sudoeste');

-- Categoria de sistema
CREATE TYPE system_category AS ENUM (
    'controlo_domotica', 'interfaces_fisicas', 'iluminacao', 'cortinas_estores',
    'climatizacao', 'sistemas_termicos', 'vmc', 'qualidade_ar', 'agua',
    'drenagens', 'energia', 'fotovoltaico', 'baterias', 'elevador',
    'jardim', 'rega', 'ventilacoes', 'piscina', 'acessos', 'seguranca',
    'cctv', 'audio', 'video', 'cinema', 'rede', 'ciberseguranca',
    'ia_local', 'voz', 'cenas', 'integracao', 'commissioning', 'manutencao'
);
COMMENT ON TYPE system_category IS 'Capítulos parametrizados do caderno de prescrição conforme Mandato §8.4';

-- Estado de sistema
CREATE TYPE system_status AS ENUM ('design', 'approved', 'procurement', 'installation', 'commissioning', 'operational');

-- Estado de instalação de equipamento
CREATE TYPE equipment_install_status AS ENUM ('planned', 'ordered', 'delivered', 'installed', 'tested');

-- Estado de commissioning de equipamento
CREATE TYPE equipment_commission_status AS ENUM ('pending', 'in_progress', 'passed', 'failed', 'waived');

-- Categoria de equipamento
CREATE TYPE equipment_category AS ENUM (
    'spot', 'driver_led', 'controlador', 'sensor', 'teclado', 'tablet',
    'motor_cortina', 'unidade_climatizacao', 'difusor', 'ventilador',
    'bomba', 'filtro', 'quadro_eletrico', 'rack', 'servidor', 'ups',
    'gateway', 'router', 'switch', 'camera', 'detetor', 'fechadura',
    'coluna_audio', 'amplificador', 'ecra', 'projetor', 'fonte_alimentacao',
    'modulo_io', 'atuador', 'outro'
);

-- Estados de prescrição
CREATE TYPE prescription_status AS ENUM (
    'draft', 'review', 'approved', 'rejected', 'superseded'
);
COMMENT ON TYPE prescription_status IS 'Ciclo de vida de uma prescrição técnica';

-- Impacto no orçamento
CREATE TYPE budget_impact_level AS ENUM ('reducer', 'neutral', 'increaser', 'critical');

-- Tipos de zona técnica (Mandato §9.2)
CREATE TYPE technical_zone_type AS ENUM (
    'quadro_controlo', 'zona_drivers', 'rack_ti', 'rack_av',
    'servidor_ia', 'ups', 'quadro_knx', 'quadro_dali',
    'zona_piscina', 'zona_termica', 'zona_baterias',
    'zona_rede', 'zona_tecnica_combinada'
);
COMMENT ON TYPE technical_zone_type IS 'Tipologia de zona técnica conforme Mandato §9.2';

-- Estado de zona técnica
CREATE TYPE zone_status AS ENUM ('planned', 'approved', 'installed', 'commissioned');

-- Nível de segurança de integração
CREATE TYPE security_level AS ENUM ('standard', 'elevated', 'critical');

-- Estado de proposta
CREATE TYPE proposal_status AS ENUM ('draft', 'review', 'approved', 'sent', 'accepted', 'rejected');

-- Estado de servidor AI local
CREATE TYPE ai_server_status AS ENUM ('active', 'maintenance', 'offline', 'decommissioned');

-- Tipos de padrão de IA
CREATE TYPE pattern_type AS ENUM (
    'occupancy', 'temperature', 'lighting', 'air_quality', 'energy',
    'arrival', 'pool', 'spa', 'maintenance', 'failure'
);
COMMENT ON TYPE pattern_type IS 'Domínios de padrões aprendidos pela IA local conforme Mandato §16.4-16.5';

-- Estados de padrão aprendido
CREATE TYPE pattern_status AS ENUM (
    'suggested', 'pending_approval', 'approved', 'rejected', 'active', 'revoked'
);
COMMENT ON TYPE pattern_status IS 'Ciclo de vida de padrão aprendido. Nenhum comportamento sem aprovação.';

-- Categoria de regra de engenharia
CREATE TYPE rule_category AS ENUM (
    'iluminacao', 'cortinas', 'climatizacao', 'audio', 'video', 'rede',
    'seguranca', 'energia', 'agua', 'vmc', 'integracao', 'zonas_tecnicas'
);

-- Estado de aprovação de regra
CREATE TYPE rule_approval_status AS ENUM ('draft', 'under_review', 'approved', 'deprecated');

-- Estado de projeto
CREATE TYPE project_status AS ENUM ('draft', 'active', 'on_hold', 'completed', 'archived');

-- Flexibilidade de orçamento
CREATE TYPE budget_flexibility AS ENUM ('fixed', 'flexible_10', 'flexible_20', 'open');

-- Trigger de experiência
CREATE TYPE experience_trigger AS ENUM ('manual', 'schedule', 'voice', 'sensor', 'predictive', 'event');

-- ============================================================
-- 2. FUNÇÕES AUXILIARES
-- ============================================================

-- Trigger function para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
COMMENT ON FUNCTION update_updated_at_column() IS 'Trigger function para timestamp automático de updated_at';

-- Função para gerar código de projeto sequencial
CREATE OR REPLACE FUNCTION generate_project_code()
RETURNS TRIGGER AS $$
BEGIN
    NEW.code := '300-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(NEXTVAL('project_code_seq')::TEXT, 3, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 3. SEQUENCES
-- ============================================================
CREATE SEQUENCE IF NOT EXISTS project_code_seq START 1;

-- ============================================================
-- 4. TABELAS BASE (sem foreign keys ou com mínimas)
-- ============================================================

-- Utilizadores (integração com Supabase Auth, mas tabela de perfil local)
CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email           TEXT NOT NULL UNIQUE,
    full_name       TEXT,
    role            TEXT NOT NULL DEFAULT 'engineer' CHECK (role IN ('admin', 'engineer', 'technician', 'client', 'viewer')),
    phone           TEXT,
    avatar_url      TEXT,
    is_active       BOOLEAN DEFAULT true,
    preferences     JSONB DEFAULT '{}',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE users IS 'Perfis de utilizadores da plataforma 300 OPS';
CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Clientes
CREATE TABLE clients (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name            TEXT NOT NULL,
    email           TEXT,
    phone           TEXT,
    address         TEXT,
    tax_id          TEXT,
    type            TEXT DEFAULT 'private' CHECK (type IN ('private', 'company', 'developer', 'hotel_group')),
    preferences     JSONB DEFAULT '{}',
    notes           TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE clients IS 'Entidades cliente da 300 OPS';
CREATE TRIGGER trg_clients_updated_at BEFORE UPDATE ON clients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Fornecedores
CREATE TABLE suppliers (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name            TEXT NOT NULL,
    contact_name    TEXT,
    email           TEXT,
    phone           TEXT,
    address         TEXT,
    tax_id          TEXT,
    payment_terms   TEXT,
    lead_time_days  INTEGER,
    is_active       BOOLEAN DEFAULT true,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE suppliers IS 'Fornecedores de equipamentos e serviços';
CREATE TRIGGER trg_suppliers_updated_at BEFORE UPDATE ON suppliers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Biblioteca de equipamentos (Mandato §11.1)
CREATE TABLE equipment_library (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Identificação
    brand               TEXT NOT NULL,
    reference           TEXT NOT NULL,
    category            equipment_category NOT NULL,
    description         TEXT,
    
    -- Especificações técnicas
    dimensions_mm       JSONB,                              -- {"w": 120, "h": 80, "d": 60}
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
    net_price           DECIMAL(12,2) GENERATED ALWAYS AS (
        COALESCE(list_price, 0) * (1 - COALESCE(discount_pct, 0) / 100)
    ) STORED,
    currency            TEXT DEFAULT 'EUR',
    price_valid_until   DATE,
    lead_time_days      INTEGER,
    supplier_id         UUID REFERENCES suppliers(id) ON DELETE SET NULL,
    warranty_months     INTEGER,
    maintenance_schedule TEXT,
    documentation_url   TEXT,
    
    -- Controlo
    is_active           BOOLEAN DEFAULT true,
    last_updated        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by          UUID REFERENCES users(id) ON DELETE SET NULL,
    
    UNIQUE(brand, reference)
);
COMMENT ON TABLE equipment_library IS 'Biblioteca técnica 300 — catálogo de equipamentos conforme Mandato §11.1';
CREATE INDEX idx_equip_lib_brand ON equipment_library(brand);
CREATE INDEX idx_equip_lib_category ON equipment_library(category);
CREATE INDEX idx_equip_lib_supplier ON equipment_library(supplier_id);
CREATE TRIGGER trg_equip_lib_updated_at BEFORE UPDATE ON equipment_library
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Regras de engenharia (Mandato §6.2, §11.2)
CREATE TABLE engineering_rules (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Identificação
    code                TEXT NOT NULL UNIQUE,
    name                TEXT NOT NULL,
    description         TEXT,
    
    -- Categorização
    category            rule_category NOT NULL,
    applies_to_type     building_type[],                     -- ARRAY de tipologias onde aplica
    
    -- Regra executável
    rule_expression     TEXT NOT NULL,
    rule_language       TEXT DEFAULT 'javascript' CHECK (rule_language IN ('javascript', 'python', 'sql', 'json_logic')),
    
    -- Parâmetros
    parameters          JSONB DEFAULT '{}',
    
    -- Condições
    preconditions       JSONB DEFAULT '[]',
    exclusions          JSONB DEFAULT '[]',
    incompatibilities   JSONB DEFAULT '[]',
    
    -- Metadados
    source              TEXT,                               -- norma, fabricante, experiencia
    version             INTEGER NOT NULL DEFAULT 1,
    author              UUID REFERENCES users(id) ON DELETE SET NULL,
    approval_status     rule_approval_status DEFAULT 'draft',
    
    is_active           BOOLEAN DEFAULT true,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE engineering_rules IS 'Biblioteca de regras de engenharia parametrizáveis conforme Mandato §11.2';
CREATE INDEX idx_rules_category ON engineering_rules(category);
CREATE INDEX idx_rules_active ON engineering_rules(is_active, approval_status);
CREATE TRIGGER trg_rules_updated_at BEFORE UPDATE ON engineering_rules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 5. PROJETOS E HIERARQUIA ESPACIAL
-- ============================================================

CREATE TABLE projects (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code                TEXT NOT NULL UNIQUE,
    name                TEXT NOT NULL,
    client_id           UUID NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
    status              project_status NOT NULL DEFAULT 'draft',
    building_type       building_type NOT NULL,
    total_area_m2       DECIMAL(10,2),
    num_floors          INTEGER,
    num_rooms           INTEGER,
    budget_total        DECIMAL(15,2),
    budget_flexibility  budget_flexibility NOT NULL DEFAULT 'fixed',
    solution_level      solution_level NOT NULL DEFAULT 'recommended',
    
    -- Perfil do cliente (Mandato §4)
    client_profile      JSONB DEFAULT '{}',
    
    -- Metadados de controle
    created_by          UUID NOT NULL REFERENCES users(id),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    version             INTEGER NOT NULL DEFAULT 1,
    approved_by         UUID REFERENCES users(id) ON DELETE SET NULL,
    approved_at         TIMESTAMPTZ,
    
    -- JSON flexível
    metadata            JSONB DEFAULT '{}',
    
    CONSTRAINT valid_project_approval CHECK (
        (approved_by IS NULL AND approved_at IS NULL) OR
        (approved_by IS NOT NULL AND approved_at IS NOT NULL)
    )
);
COMMENT ON TABLE projects IS 'Projecto 300 OPS — unidade central de trabalho';
COMMENT ON COLUMN projects.client_profile IS 'Dados do perfil do cliente: utilizadores, residentes, ecossistema, prioridades, etc.';
CREATE INDEX idx_projects_client ON projects(client_id);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_type ON projects(building_type);
CREATE TRIGGER trg_projects_updated_at BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger para gerar código automático de projeto
CREATE TRIGGER trg_projects_generate_code
    BEFORE INSERT ON projects
    FOR EACH ROW
    WHEN (NEW.code IS NULL)
    EXECUTE FUNCTION generate_project_code();

-- Edifícios
CREATE TABLE buildings (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id      UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name            TEXT NOT NULL,
    perimeter       GEOMETRY(POLYGON, 4326),
    total_area_m2   DECIMAL(10,2),
    num_floors      INTEGER,
    orientation     DECIMAL(5,2),
    address         TEXT,
    metadata        JSONB DEFAULT '{}',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE buildings IS 'Edifício dentro de um projecto';
CREATE INDEX idx_buildings_project ON buildings(project_id);
CREATE TRIGGER trg_buildings_updated_at BEFORE UPDATE ON buildings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Pisos
CREATE TABLE floors (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    building_id     UUID NOT NULL REFERENCES buildings(id) ON DELETE CASCADE,
    floor_number    INTEGER NOT NULL,
    name            TEXT,
    area_m2         DECIMAL(10,2),
    height_m        DECIMAL(5,2),
    plan_dwg_url    TEXT,
    plan_image_url  TEXT,
    metadata        JSONB DEFAULT '{}',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE floors IS 'Piso/andar de um edifício';
CREATE INDEX idx_floors_building ON floors(building_id);
CREATE TRIGGER trg_floors_updated_at BEFORE UPDATE ON floors
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Divisões
CREATE TABLE rooms (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    floor_id        UUID NOT NULL REFERENCES floors(id) ON DELETE CASCADE,
    name            TEXT NOT NULL,
    function        room_function NOT NULL DEFAULT 'outro',
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
    is_staff_area   BOOLEAN DEFAULT false,
    
    -- Requisitos funcionais desta divisão (denormalizado para performance)
    functional_requirements JSONB DEFAULT '{}',
    
    metadata        JSONB DEFAULT '{}',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE rooms IS 'Divisão/ambiente dentro de um piso';
COMMENT ON COLUMN rooms.detection_state IS 'Estado de detecção: confirmed, detected, inferred, to_confirm, unavailable. Nunca assumir inferred como confirmed.';
CREATE INDEX idx_rooms_floor ON rooms(floor_id);
CREATE INDEX idx_rooms_function ON rooms(function);
CREATE INDEX idx_rooms_detection ON rooms(detection_state);
CREATE TRIGGER trg_rooms_updated_at BEFORE UPDATE ON rooms
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 6. REQUISITOS E EXPERIÊNCIAS
-- ============================================================

CREATE TABLE requirements (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id          UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    room_id             UUID REFERENCES rooms(id) ON DELETE SET NULL,
    category            requirement_category NOT NULL,
    subcategory         TEXT,
    description         TEXT NOT NULL,
    
    -- Níveis de solução (Mandato §5)
    level_essential     BOOLEAN DEFAULT false,
    level_recommended   BOOLEAN DEFAULT false,
    level_signature     BOOLEAN DEFAULT false,
    
    -- Estado e prioridade
    status              requirement_status DEFAULT 'pending',
    priority            INTEGER NOT NULL DEFAULT 3 CHECK (priority BETWEEN 1 AND 5),
    
    -- Metadados
    source              TEXT DEFAULT 'client',              -- cliente, inferido, regra
    source_reference    TEXT,                               -- ID da regra ou documento de origem
    validated_by        UUID REFERENCES users(id) ON DELETE SET NULL,
    validated_at        TIMESTAMPTZ,
    metadata            JSONB DEFAULT '{}',
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE requirements IS 'Requisitos funcionais por projecto ou por divisão';
CREATE INDEX idx_requirements_project ON requirements(project_id);
CREATE INDEX idx_requirements_room ON requirements(room_id);
CREATE INDEX idx_requirements_category ON requirements(category);
CREATE TRIGGER trg_requirements_updated_at BEFORE UPDATE ON requirements
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Experiências (Mandato §8.2, §16.3)
CREATE TABLE experiences (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id      UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name            TEXT NOT NULL,
    description     TEXT,
    trigger_type    experience_trigger DEFAULT 'manual',
    
    -- Sequência de acções (JSON array ordenado)
    -- Exemplo: [{"action": "set_scene", "target": "sala", "value": "jantar"}, ...]
    actions         JSONB NOT NULL DEFAULT '[]',
    
    -- Condições de activação (para triggers automáticos)
    trigger_conditions JSONB DEFAULT '{}',
    
    is_active       BOOLEAN DEFAULT true,
    created_by      UUID NOT NULL REFERENCES users(id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE experiences IS 'Experiências programáveis: cenas, rotinas, automações conforme Mandato §8.2';
CREATE INDEX idx_experiences_project ON experiences(project_id);
CREATE TRIGGER trg_experiences_updated_at BEFORE UPDATE ON experiences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 7. SISTEMAS E EQUIPAMENTOS
-- ============================================================

CREATE TABLE systems (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id      UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    code            TEXT NOT NULL,
    name            TEXT NOT NULL,
    category        system_category NOT NULL,
    protocol        TEXT,                                       -- KNX, DALI, BACnet, Modbus, MQTT, etc.
    description     TEXT,
    
    -- Estado
    status          system_status DEFAULT 'design',
    
    -- Topologia (grafo de conectividade em JSON)
    topology        JSONB DEFAULT '{}',
    
    -- Metadados
    metadata        JSONB DEFAULT '{}',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE systems IS 'Sistema técnico de um projecto (iluminação, climatização, etc.)';
CREATE INDEX idx_systems_project ON systems(project_id);
CREATE INDEX idx_systems_category ON systems(category);
CREATE TRIGGER trg_systems_updated_at BEFORE UPDATE ON systems
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE subsystems (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    system_id       UUID NOT NULL REFERENCES systems(id) ON DELETE CASCADE,
    code            TEXT NOT NULL,
    name            TEXT NOT NULL,
    function        TEXT,
    topology        JSONB DEFAULT '{}',
    metadata        JSONB DEFAULT '{}',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE subsystems IS 'Subsistema dentro de um sistema';
CREATE INDEX idx_subsystems_system ON subsystems(system_id);
CREATE TRIGGER trg_subsystems_updated_at BEFORE UPDATE ON subsystems
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE equipment (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    library_id          UUID REFERENCES equipment_library(id) ON DELETE SET NULL,
    subsystem_id        UUID NOT NULL REFERENCES subsystems(id) ON DELETE CASCADE,
    room_id             UUID REFERENCES rooms(id) ON DELETE SET NULL,
    technical_zone_id   UUID,                                   -- preenchido após geração de zonas
    
    -- Identificação
    code                TEXT NOT NULL,
    name                TEXT NOT NULL,
    description         TEXT,
    
    -- Posicionamento
    position_geometry   GEOMETRY(POINT, 4326),
    
    -- Especificações (sobrescrevem library se necessário)
    specifications      JSONB DEFAULT '{}',
    
    -- Estados
    installation_status equipment_install_status DEFAULT 'planned',
    commissioning_status equipment_commission_status DEFAULT 'pending',
    
    -- Custos
    unit_cost           DECIMAL(12,2),
    installation_cost   DECIMAL(12,2),
    programming_cost    DECIMAL(12,2),
    quantity            INTEGER NOT NULL DEFAULT 1,
    
    -- Datas
    ordered_at          TIMESTAMPTZ,
    delivered_at        TIMESTAMPTZ,
    installed_at        TIMESTAMPTZ,
    commissioned_at     TIMESTAMPTZ,
    
    metadata            JSONB DEFAULT '{}',
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE equipment IS 'Equipamento específico de um projecto';
CREATE INDEX idx_equipment_subsystem ON equipment(subsystem_id);
CREATE INDEX idx_equipment_room ON equipment(room_id);
CREATE INDEX idx_equipment_library ON equipment(library_id);
CREATE INDEX idx_equipment_zone ON equipment(technical_zone_id);
CREATE TRIGGER trg_equipment_updated_at BEFORE UPDATE ON equipment
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 8. ZONAS TÉCNICAS (Mandato §9)
-- ============================================================

CREATE TABLE technical_zones (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id          UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    building_id         UUID REFERENCES buildings(id) ON DELETE SET NULL,
    floor_id            UUID REFERENCES floors(id) ON DELETE SET NULL,
    
    -- Identificação
    code                TEXT NOT NULL,
    name                TEXT NOT NULL,
    zone_type           technical_zone_type NOT NULL,
    
    -- Dimensões (mm)
    width_mm            INTEGER,
    height_mm           INTEGER,
    depth_mm            INTEGER,
    area_m2             DECIMAL(8,2),
    
    -- Localização
    location_geometry   GEOMETRY(POINT, 4326),
    location_notes      TEXT,
    
    -- Capacidade
    max_din_units       INTEGER,
    max_dissipation_w   INTEGER,
    max_weight_kg       INTEGER,
    
    -- Ambiente
    ventilation_type    TEXT,
    noise_limit_db      INTEGER,
    access_requirement  TEXT,
    
    -- Requisitos de infraestrutura
    power_requirement_va INTEGER,
    cooling_requirement_w INTEGER,
    network_ports       INTEGER,
    
    -- Estado
    status              zone_status DEFAULT 'planned',
    
    -- Layout interno (JSON com posicionamento de equipamentos)
    internal_layout     JSONB DEFAULT '{}',
    
    -- Documentos
    plan_url            TEXT,
    elevation_url       TEXT,
    section_url         TEXT,
    
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE technical_zones IS 'Zonas técnicas geradas parametricamente conforme Mandato §9';
CREATE INDEX idx_zones_project ON technical_zones(project_id);
CREATE INDEX idx_zones_building ON technical_zones(building_id);
CREATE INDEX idx_zones_type ON technical_zones(zone_type);
CREATE TRIGGER trg_zones_updated_at BEFORE UPDATE ON technical_zones
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Adicionar FK de equipment -> technical_zones agora que a tabela existe
ALTER TABLE equipment ADD CONSTRAINT fk_equipment_technical_zone
    FOREIGN KEY (technical_zone_id) REFERENCES technical_zones(id) ON DELETE SET NULL;

-- ============================================================
-- 9. PRESCRIÇÕES (Mandato §7)
-- ============================================================

CREATE TABLE prescriptions (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id              UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    system_id               UUID REFERENCES systems(id) ON DELETE SET NULL,
    subsystem_id            UUID REFERENCES subsystems(id) ON DELETE SET NULL,
    room_id                 UUID REFERENCES rooms(id) ON DELETE SET NULL,
    equipment_id            UUID REFERENCES equipment(id) ON DELETE SET NULL,
    
    -- Identificação (Mandato §7.1)
    code                    TEXT NOT NULL,
    version                 INTEGER NOT NULL DEFAULT 1,
    
    -- Requisitos
    functional_requirement  TEXT NOT NULL,
    technical_requirement   TEXT NOT NULL,
    min_performance         TEXT,
    
    -- Solução
    sizing_criterion        TEXT,
    reference_solution      TEXT,
    acceptable_alternatives JSONB DEFAULT '[]',
    selected_equipment_brand TEXT,
    selected_equipment_ref  TEXT,
    
    -- Infraestrutura e integração
    required_infrastructure TEXT,
    integrations            JSONB DEFAULT '[]',
    protocols               JSONB DEFAULT '[]',
    
    -- Validação
    acceptance_criterion    TEXT,
    test_method             TEXT,
    applicable_standard     TEXT,
    
    -- Controlo
    responsible_validation  UUID REFERENCES users(id) ON DELETE SET NULL,
    origin                  TEXT,
    status                  prescription_status DEFAULT 'draft',
    priority                INTEGER DEFAULT 3 CHECK (priority BETWEEN 1 AND 5),
    
    -- Impacto
    estimated_cost          DECIMAL(12,2),
    budget_impact           budget_impact_level DEFAULT 'neutral',
    dependencies            JSONB DEFAULT '[]',
    risks                   JSONB DEFAULT '[]',
    exceptions              JSONB DEFAULT '[]',
    pending_items           JSONB DEFAULT '[]',
    
    -- Aprovação
    created_by              UUID NOT NULL REFERENCES users(id),
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    approved_by             UUID REFERENCES users(id) ON DELETE SET NULL,
    approved_at             TIMESTAMPTZ,
    superseded_by           UUID REFERENCES prescriptions(id) ON DELETE SET NULL,
    
    CONSTRAINT valid_prescription_approval CHECK (
        (approved_by IS NULL AND approved_at IS NULL) OR
        (approved_by IS NOT NULL AND approved_at IS NOT NULL)
    ),
    UNIQUE(code, version)
);
COMMENT ON TABLE prescriptions IS 'Prescrição técnica — objecto central do caderno de prescrição conforme Mandato §7';
CREATE INDEX idx_prescriptions_project ON prescriptions(project_id);
CREATE INDEX idx_prescriptions_system ON prescriptions(system_id);
CREATE INDEX idx_prescriptions_room ON prescriptions(room_id);
CREATE INDEX idx_prescriptions_status ON prescriptions(status);
CREATE INDEX idx_prescriptions_equipment ON prescriptions(equipment_id);

-- ============================================================
-- 10. MATRIZ DE INTEGRAÇÃO (Mandato §15)
-- ============================================================

CREATE TABLE integrations (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id          UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    
    -- Origem e destino
    source_system_id    UUID NOT NULL REFERENCES systems(id) ON DELETE CASCADE,
    target_system_id    UUID NOT NULL REFERENCES systems(id) ON DELETE CASCADE,
    
    -- Evento e condição
    event_trigger       TEXT NOT NULL,
    condition           TEXT,
    
    -- Acção
    action              TEXT NOT NULL,
    action_parameters   JSONB DEFAULT '{}',
    
    -- Protocolo e gateway
    protocol            TEXT,
    gateway_equipment_id UUID REFERENCES equipment(id) ON DELETE SET NULL,
    
    -- Resiliência
    priority            INTEGER DEFAULT 3 CHECK (priority BETWEEN 1 AND 5),
    fallback_action     TEXT,
    timeout_seconds     INTEGER DEFAULT 30,
    
    -- Segurança
    security_level      security_level DEFAULT 'standard',
    test_procedure      TEXT,
    test_result         TEXT,
    tested_at           TIMESTAMPTZ,
    tested_by           UUID REFERENCES users(id) ON DELETE SET NULL,
    
    is_active           BOOLEAN DEFAULT true,
    created_by          UUID NOT NULL REFERENCES users(id),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE integrations IS 'Matriz de integração sistema-a-sistema conforme Mandato §15';
CREATE INDEX idx_integrations_project ON integrations(project_id);
CREATE INDEX idx_integrations_source ON integrations(source_system_id);
CREATE INDEX idx_integrations_target ON integrations(target_system_id);
CREATE TRIGGER trg_integrations_updated_at BEFORE UPDATE ON integrations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 11. PROCUREMENT E PROPOSTAS
-- ============================================================

CREATE TABLE proposals (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id          UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    
    -- Identificação
    code                TEXT NOT NULL,
    version             INTEGER NOT NULL DEFAULT 1,
    solution_level      solution_level NOT NULL,
    
    -- Conteúdo editorial (Mandato §13)
    title               TEXT NOT NULL,
    summary             TEXT,
    vision_text         TEXT,
    building_reading    TEXT,
    identified_needs    JSONB DEFAULT '[]',
    experiences         JSONB DEFAULT '[]',
    systems_summary     JSONB DEFAULT '[]',
    ai_local_summary    TEXT,
    interfaces_summary  JSONB DEFAULT '[]',
    images              JSONB DEFAULT '[]',
    
    -- Custos detalhados
    investment_total    DECIMAL(15,2),
    installation_cost   DECIMAL(15,2),
    programming_cost    DECIMAL(15,2),
    commissioning_cost  DECIMAL(15,2),
    licenses_cost       DECIMAL(15,2),
    annual_maintenance  DECIMAL(15,2),
    subscriptions_annual DECIMAL(15,2),
    
    -- TCO
    estimated_consumption_annual DECIMAL(15,2),
    estimated_lifespan_years INTEGER,
    estimated_replacement_cost DECIMAL(15,2),
    total_cost_of_ownership DECIMAL(15,2),
    
    -- Exclusões e pressupostos
    exclusions          JSONB DEFAULT '[]',
    assumptions         JSONB DEFAULT '[]',
    next_steps          JSONB DEFAULT '[]',
    
    -- Prazo
    estimated_duration_weeks INTEGER,
    
    -- Metadados
    status              proposal_status DEFAULT 'draft',
    sent_at             TIMESTAMPTZ,
    sent_to             JSONB DEFAULT '[]',
    
    created_by          UUID NOT NULL REFERENCES users(id),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    approved_by         UUID REFERENCES users(id) ON DELETE SET NULL,
    approved_at         TIMESTAMPTZ,
    
    CONSTRAINT valid_proposal_approval CHECK (
        (approved_by IS NULL AND approved_at IS NULL) OR
        (approved_by IS NOT NULL AND approved_at IS NOT NULL)
    ),
    UNIQUE(code, version)
);
COMMENT ON TABLE proposals IS 'Proposta editorial para o cliente conforme Mandato §13';
CREATE INDEX idx_proposals_project ON proposals(project_id);
CREATE INDEX idx_proposals_status ON proposals(status);
CREATE INDEX idx_proposals_level ON proposals(solution_level);

-- ============================================================
-- 12. INTELLIGENCE LAYER — AI LOCAL (Mandato §16)
-- ============================================================

CREATE TABLE ai_local_servers (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id          UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    
    -- Hardware
    model               TEXT NOT NULL,
    serial_number       TEXT,
    ip_address          INET,
    mac_address         TEXT,
    
    -- Recursos
    cpu_cores           INTEGER,
    ram_gb              INTEGER,
    storage_gb          INTEGER,
    gpu_model           TEXT,
    gpu_vram_gb         INTEGER,
    
    -- Estado
    status              ai_server_status DEFAULT 'active',
    last_heartbeat      TIMESTAMPTZ,
    uptime_seconds      BIGINT,
    
    -- Modelos instalados
    installed_models    JSONB DEFAULT '[]',
    
    -- Configuração
    config              JSONB DEFAULT '{}',
    
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE ai_local_servers IS 'Servidor de IA local por edifício conforme Mandato §16.1-16.2';
CREATE INDEX idx_ai_servers_project ON ai_local_servers(project_id);
CREATE TRIGGER trg_ai_servers_updated_at BEFORE UPDATE ON ai_local_servers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE ai_learned_patterns (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    server_id           UUID NOT NULL REFERENCES ai_local_servers(id) ON DELETE CASCADE,
    project_id          UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    
    pattern_name        TEXT NOT NULL,
    pattern_type        pattern_type NOT NULL,
    description         TEXT,
    
    -- Dados do padrão
    trigger_conditions  JSONB NOT NULL,
    proposed_actions    JSONB NOT NULL,
    confidence_score    DECIMAL(3,2) CHECK (confidence_score >= 0 AND confidence_score <= 1),
    
    -- Estatísticas
    occurrence_count    INTEGER DEFAULT 0,
    first_seen_at       TIMESTAMPTZ,
    last_seen_at        TIMESTAMPTZ,
    
    -- Validação humana obrigatória (Mandato §16.4)
    status              pattern_status DEFAULT 'suggested',
    approved_by         UUID REFERENCES users(id) ON DELETE SET NULL,
    approved_at         TIMESTAMPTZ,
    rejected_by         UUID REFERENCES users(id) ON DELETE SET NULL,
    rejected_at         TIMESTAMPTZ,
    rejection_reason    TEXT,
    
    -- Regra resultante
    rule_scope          TEXT,
    affected_users      JSONB DEFAULT '[]',
    max_executions      INTEGER,
    execution_count     INTEGER DEFAULT 0,
    execution_history   JSONB DEFAULT '[]',
    
    -- Reversão
    can_auto_revert     BOOLEAN DEFAULT true,
    revert_after_minutes INTEGER,
    
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE ai_learned_patterns IS 'Padrões aprendidos pela IA local. Nenhum comportamento sem aprovação humana conforme Mandato §16.4';
CREATE INDEX idx_patterns_server ON ai_learned_patterns(server_id);
CREATE INDEX idx_patterns_project ON ai_learned_patterns(project_id);
CREATE INDEX idx_patterns_type ON ai_learned_patterns(pattern_type);
CREATE INDEX idx_patterns_status ON ai_learned_patterns(status);
CREATE TRIGGER trg_patterns_updated_at BEFORE UPDATE ON ai_learned_patterns
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 13. EXPLAINABILITY & AUDIT
-- ============================================================

CREATE TABLE explanation_logs (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Ligação
    project_id          UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    entity_type         TEXT NOT NULL CHECK (entity_type IN ('prescription', 'equipment', 'zone', 'proposal', 'integration', 'pattern')),
    entity_id           UUID NOT NULL,
    
    -- Dados de entrada
    input_data          JSONB NOT NULL,
    
    -- Regra aplicada
    rule_id             UUID REFERENCES engineering_rules(id) ON DELETE SET NULL,
    rule_name           TEXT,
    rule_source         TEXT,
    
    -- Resultado
    output_data         JSONB NOT NULL,
    confidence_score    DECIMAL(3,2) CHECK (confidence_score >= 0 AND confidence_score <= 1),
    
    -- Dependências e impacto
    dependencies        JSONB DEFAULT '[]',
    economic_impact     JSONB,
    
    -- Validação
    needs_human_validation BOOLEAN DEFAULT true,
    validated_by        UUID REFERENCES users(id) ON DELETE SET NULL,
    validated_at        TIMESTAMPTZ,
    validation_notes    TEXT,
    
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE explanation_logs IS 'Log de explicabilidade de cada recomendação do motor de engenharia conforme Mandato §2.3';
CREATE INDEX idx_explanations_project ON explanation_logs(project_id);
CREATE INDEX idx_explanations_entity ON explanation_logs(entity_type, entity_id);
CREATE INDEX idx_explanations_rule ON explanation_logs(rule_id);
CREATE INDEX idx_explanations_validation ON explanation_logs(needs_human_validation, validated_at);

-- ============================================================
-- 14. EVENT STORE (Single Source of Truth)
-- ============================================================

CREATE TABLE domain_events (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Identificação
    aggregate_type      TEXT NOT NULL,
    aggregate_id        UUID NOT NULL,
    event_type          TEXT NOT NULL,
    event_version       INTEGER NOT NULL DEFAULT 1,
    
    -- Payload
    payload             JSONB NOT NULL,
    
    -- Metadados de rastreabilidade
    correlation_id      UUID,
    causation_id        UUID,
    
    -- Origem
    emitted_by          UUID REFERENCES users(id) ON DELETE SET NULL,
    emitted_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Processamento
    processed           BOOLEAN DEFAULT false,
    processed_at        TIMESTAMPTZ,
    processed_by        TEXT,
    processing_error    TEXT,
    
    -- Ordenação global
    sequence_number     BIGSERIAL
);
COMMENT ON TABLE domain_events IS 'Event store para single source of truth e audit trail completo conforme Mandato §2.1';
CREATE INDEX idx_events_aggregate ON domain_events(aggregate_type, aggregate_id, sequence_number);
CREATE INDEX idx_events_unprocessed ON domain_events(processed, emitted_at);
CREATE INDEX idx_events_correlation ON domain_events(correlation_id);
CREATE INDEX idx_events_type ON domain_events(event_type, emitted_at);

-- ============================================================
-- 15. PRIVACITY MATRIX (Mandato §17.2)
-- ============================================================

CREATE TABLE privacy_matrix (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id          UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    room_id             UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    
    -- Captação
    voice_capture       BOOLEAN DEFAULT false,
    voice_retention_days INTEGER DEFAULT 0,
    face_recognition    BOOLEAN DEFAULT false,
    camera_enabled      BOOLEAN DEFAULT false,
    camera_retention_days INTEGER DEFAULT 0,
    
    -- Armazenamento e acesso
    local_storage_only  BOOLEAN DEFAULT true,
    cloud_allowed       BOOLEAN DEFAULT false,
    cloud_purpose       TEXT,
    authorized_users    JSONB DEFAULT '[]',
    
    -- Modos
    privacy_mode_available BOOLEAN DEFAULT true,
    privacy_mode_active BOOLEAN DEFAULT false,
    
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by          UUID REFERENCES users(id) ON DELETE SET NULL,
    
    UNIQUE(project_id, room_id)
);
COMMENT ON TABLE privacy_matrix IS 'Matriz de privacidade por divisão conforme Mandato §17.2';
CREATE TRIGGER trg_privacy_updated_at BEFORE UPDATE ON privacy_matrix
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 16. ROW LEVEL SECURITY (RLS) — MULTI-TENANCY POR PROJETO
-- ============================================================

-- Função para obter projectos acessíveis ao utilizador actual
CREATE OR REPLACE FUNCTION get_user_project_ids()
RETURNS SETOF UUID AS $$
BEGIN
    -- Placeholder: em produção, isto lê de uma tabela de memberships
    RETURN QUERY SELECT id FROM projects;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Habilitar RLS em todas as tabelas de domínio
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE buildings ENABLE ROW LEVEL SECURITY;
ALTER TABLE floors ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE experiences ENABLE ROW LEVEL SECURITY;
ALTER TABLE systems ENABLE ROW LEVEL SECURITY;
ALTER TABLE subsystems ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE technical_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_local_servers ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_learned_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE explanation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE privacy_matrix ENABLE ROW LEVEL SECURITY;

-- Policies baseadas em project_id (a serem refinadas com tabela de memberships)
CREATE POLICY projects_isolation ON projects
    USING (id IN (SELECT get_user_project_ids()));

CREATE POLICY buildings_isolation ON buildings
    USING (project_id IN (SELECT get_user_project_ids()));

CREATE POLICY floors_isolation ON floors
    USING (building_id IN (SELECT id FROM buildings WHERE project_id IN (SELECT get_user_project_ids())));

CREATE POLICY rooms_isolation ON rooms
    USING (floor_id IN (
        SELECT f.id FROM floors f
        JOIN buildings b ON b.id = f.building_id
        WHERE b.project_id IN (SELECT get_user_project_ids())
    ));

CREATE POLICY requirements_isolation ON requirements
    USING (project_id IN (SELECT get_user_project_ids()));

CREATE POLICY experiences_isolation ON experiences
    USING (project_id IN (SELECT get_user_project_ids()));

CREATE POLICY systems_isolation ON systems
    USING (project_id IN (SELECT get_user_project_ids()));

CREATE POLICY subsystems_isolation ON subsystems
    USING (system_id IN (SELECT id FROM systems WHERE project_id IN (SELECT get_user_project_ids())));

CREATE POLICY equipment_isolation ON equipment
    USING (subsystem_id IN (
        SELECT ss.id FROM subsystems ss
        JOIN systems s ON s.id = ss.system_id
        WHERE s.project_id IN (SELECT get_user_project_ids())
    ));

CREATE POLICY zones_isolation ON technical_zones
    USING (project_id IN (SELECT get_user_project_ids()));

CREATE POLICY prescriptions_isolation ON prescriptions
    USING (project_id IN (SELECT get_user_project_ids()));

CREATE POLICY integrations_isolation ON integrations
    USING (project_id IN (SELECT get_user_project_ids()));

CREATE POLICY proposals_isolation ON proposals
    USING (project_id IN (SELECT get_user_project_ids()));

CREATE POLICY ai_servers_isolation ON ai_local_servers
    USING (project_id IN (SELECT get_user_project_ids()));

CREATE POLICY ai_patterns_isolation ON ai_learned_patterns
    USING (project_id IN (SELECT get_user_project_ids()));

CREATE POLICY explanations_isolation ON explanation_logs
    USING (project_id IN (SELECT get_user_project_ids()));

CREATE POLICY privacy_isolation ON privacy_matrix
    USING (project_id IN (SELECT get_user_project_ids()));

-- ============================================================
-- 17. VIEWS ÚTEIS
-- ============================================================

-- View: resumo de projeto com contagens
CREATE OR REPLACE VIEW project_summary AS
SELECT 
    p.id,
    p.code,
    p.name,
    p.status,
    p.building_type,
    p.solution_level,
    c.name AS client_name,
    COUNT(DISTINCT b.id) AS num_buildings,
    COUNT(DISTINCT f.id) AS num_floors,
    COUNT(DISTINCT r.id) AS num_rooms,
    COUNT(DISTINCT s.id) AS num_systems,
    COUNT(DISTINCT pr.id) AS num_prescriptions,
    COUNT(DISTINCT eq.id) AS num_equipment,
    p.created_at,
    p.approved_at
FROM projects p
LEFT JOIN clients c ON c.id = p.client_id
LEFT JOIN buildings b ON b.project_id = p.id
LEFT JOIN floors f ON f.building_id = b.id
LEFT JOIN rooms r ON r.floor_id = f.id
LEFT JOIN systems s ON s.project_id = p.id
LEFT JOIN prescriptions pr ON pr.project_id = p.id
LEFT JOIN equipment eq ON eq.room_id = r.id
GROUP BY p.id, p.code, p.name, p.status, p.building_type, p.solution_level, c.name, p.created_at, p.approved_at;

COMMENT ON VIEW project_summary IS 'Resumo consolidado de cada projeto com contagens de entidades';

-- View: matriz de prescrições por divisão (Mandato §8.5)
CREATE OR REPLACE VIEW room_prescription_matrix AS
SELECT 
    r.id AS room_id,
    r.name AS room_name,
    r.function AS room_function,
    r.area_m2,
    f.name AS floor_name,
    b.name AS building_name,
    p.id AS project_id,
    
    -- Contagens por categoria
    COUNT(DISTINCT CASE WHEN pr.category = 'iluminacao' THEN pr.id END) AS lighting_prescriptions,
    COUNT(DISTINCT CASE WHEN pr.category = 'cortinas' THEN pr.id END) AS curtain_prescriptions,
    COUNT(DISTINCT CASE WHEN pr.category = 'climatizacao' THEN pr.id END) AS climate_prescriptions,
    COUNT(DISTINCT CASE WHEN pr.category = 'audio' THEN pr.id END) AS audio_prescriptions,
    COUNT(DISTINCT CASE WHEN pr.category = 'video' THEN pr.id END) AS video_prescriptions,
    COUNT(DISTINCT CASE WHEN pr.category = 'seguranca' THEN pr.id END) AS security_prescriptions,
    COUNT(DISTINCT CASE WHEN pr.category = 'rede' THEN pr.id END) AS network_prescriptions,
    
    -- Equipamentos
    COUNT(DISTINCT eq.id) AS total_equipment,
    SUM(eq.quantity) AS total_equipment_quantity,
    SUM(COALESCE(eq.unit_cost, 0) * eq.quantity) AS estimated_equipment_cost
    
FROM rooms r
JOIN floors f ON f.id = r.floor_id
JOIN buildings b ON b.id = f.building_id
JOIN projects p ON p.id = b.project_id
LEFT JOIN requirements req ON req.room_id = r.id
LEFT JOIN prescriptions pr ON pr.room_id = r.id
LEFT JOIN equipment eq ON eq.room_id = r.id
GROUP BY r.id, r.name, r.function, r.area_m2, f.name, b.name, p.id;

COMMENT ON VIEW room_prescription_matrix IS 'Matriz de prescrições por divisão conforme Mandato §8.5';

-- ============================================================
-- 18. DADOS DE SEED (Mínimos para teste)
-- ============================================================

-- Utilizador de sistema
INSERT INTO users (id, email, full_name, role) VALUES
    (uuid_generate_v4(), 'admin@300.pt', 'Administrador 300', 'admin'),
    (uuid_generate_v4(), 'eng@300.pt', 'Engenheiro 300', 'engineer')
ON CONFLICT DO NOTHING;

-- Fornecedores de exemplo
INSERT INTO suppliers (id, name, contact_name, email, is_active) VALUES
    (uuid_generate_v4(), 'ABB', 'Comercial ABB', 'pt@abb.com', true),
    (uuid_generate_v4(), 'Jung', 'Comercial Jung', 'pt@jung.de', true),
    (uuid_generate_v4(), 'Gira', 'Comercial Gira', 'pt@gira.de', true),
    (uuid_generate_v4(), 'Lutron', 'Comercial Lutron', 'emea@lutron.com', true)
ON CONFLICT DO NOTHING;

-- Regras de engenharia de exemplo (Mandato §6.3)
INSERT INTO engineering_rules (code, name, description, category, rule_expression, rule_language, parameters, source) VALUES
    (
        'ILU-001',
        'Cálculo de spots — sala estar/jantar',
        'Número de spots baseado na área da divisão para uso estar/jantar',
        'iluminacao',
        'function calculate(room) { const base = Math.ceil(room.area_m2 / 4); return { spots: { min: base, max: Math.ceil(base * 1.3) } }; }',
        'javascript',
        '{"area_factor": 4, "max_variation": 1.3, "min_spacing_m": 2.5}',
        'Experiência 300 — iluminação residencial'
    ),
    (
        'ILU-002',
        'Circuitos de iluminação — sala',
        'Divisão de circuitos por tipo de iluminação',
        'iluminacao',
        'function calculate(room, level) { const circuits = { general: level === "essential" ? 2 : 3, decorative: level === "signature" ? 2 : 1, led: 2 }; return circuits; }',
        'javascript',
        '{"general_essential": 2, "general_recommended": 3, "general_signature": 3, "decorative_signature": 2}',
        'NFC 15-100 adaptado'
    ),
    (
        'CLI-001',
        'Zonas de climatização — divisão',
        'Uma zona de climatização por divisão com area > 25m2 ou uso especial',
        'climatizacao',
        'function calculate(room) { return { zones: room.area_m2 > 25 || ["estar", "suite", "escritorio"].includes(room.function) ? 1 : 0 }; }',
        'javascript',
        '{"min_area_for_zone": 25, "functions_requiring_zone": ["estar", "suite", "escritorio"]}',
        'Experiência 300 — conforto térmico'
    )
ON CONFLICT DO NOTHING;

-- ============================================================
-- FIM DA MIGRATION
-- ============================================================
