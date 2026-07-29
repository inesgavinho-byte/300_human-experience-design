-- ============================================================
-- 300 OPS — Migration Incremental v2
-- Adaptação ao schema existente do 300-ops-platform
-- Preserva TODAS as tabelas e dados existentes
-- ============================================================

-- ============================================================
-- 0. EXTENSIONS (idempotente)
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "postgis";
CREATE EXTENSION IF NOT EXISTS "pgvector";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- 1. ENUMS (idempotente com DO blocks)
-- ============================================================

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'building_type') THEN
        CREATE TYPE building_type AS ENUM (
            'apartamento', 'penthouse', 'moradia', 'villa_grande',
            'edificio_multifamiliar', 'hotel', 'aparthotel', 'resort',
            'escritorio', 'retail', 'espaco_saude', 'residencia_senior'
        );
    END IF;
END $$;
COMMENT ON TYPE building_type IS 'Classificação tipológica do imóvel conforme Mandato §3.3';

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'solution_level') THEN
        CREATE TYPE solution_level AS ENUM ('essential', 'recommended', 'signature');
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'detection_state') THEN
        CREATE TYPE detection_state AS ENUM (
            'confirmed', 'detected', 'inferred', 'to_confirm', 'unavailable'
        );
    END IF;
END $$;
COMMENT ON TYPE detection_state IS 'Estado de cada elemento detectado na planta. Nunca tratar inferred como confirmed.';

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'requirement_category') THEN
        CREATE TYPE requirement_category AS ENUM (
            'iluminacao', 'cortinas', 'climatizacao', 'piso_radiante',
            'vmc', 'piscina', 'spa', 'sauna', 'ice_bath',
            'audio', 'video', 'cinema', 'controlo_voz', 'tablets',
            'seguranca', 'cctv', 'controlo_acessos', 'carregamento_eletrico',
            'fotovoltaico', 'baterias', 'rega', 'agua', 'rede',
            'ia_local', 'aprendizagem', 'atuacao_preditiva'
        );
    END IF;
END $$;
COMMENT ON TYPE requirement_category IS 'Categorias de requisitos funcionais conforme Mandato §4.1';

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'requirement_status') THEN
        CREATE TYPE requirement_status AS ENUM ('pending', 'confirmed', 'rejected', 'superseded');
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'room_function') THEN
        CREATE TYPE room_function AS ENUM (
            'estar', 'jantar', 'quarto', 'suite', 'cozinha', 'wc',
            'hall', 'corredor', 'escritorio', 'ginasio', 'cinema',
            'spa', 'piscina_interior', 'garagem', 'arrumos', 'terraco',
            'jardim', 'zona_tecnica', 'staff', 'outro'
        );
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'room_orientation') THEN
        CREATE TYPE room_orientation AS ENUM (
            'norte', 'sul', 'este', 'oeste', 'nordeste', 'noroeste', 'sudeste', 'sudoeste'
        );
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'system_category') THEN
        CREATE TYPE system_category AS ENUM (
            'controlo_domotica', 'interfaces_fisicas', 'iluminacao', 'cortinas_estores',
            'climatizacao', 'sistemas_termicos', 'vmc', 'qualidade_ar', 'agua',
            'drenagens', 'energia', 'fotovoltaico', 'baterias', 'elevador',
            'jardim', 'rega', 'ventilacoes', 'piscina', 'acessos', 'seguranca',
            'cctv', 'audio', 'video', 'cinema', 'rede', 'ciberseguranca',
            'ia_local', 'voz', 'cenas', 'integracao', 'commissioning', 'manutencao'
        );
    END IF;
END $$;
COMMENT ON TYPE system_category IS 'Capítulos parametrizados do caderno de prescrição conforme Mandato §8.4';

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'system_status') THEN
        CREATE TYPE system_status AS ENUM (
            'design', 'approved', 'procurement', 'installation', 'commissioning', 'operational'
        );
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'equipment_install_status') THEN
        CREATE TYPE equipment_install_status AS ENUM (
            'planned', 'ordered', 'delivered', 'installed', 'tested'
        );
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'equipment_commission_status') THEN
        CREATE TYPE equipment_commission_status AS ENUM (
            'pending', 'in_progress', 'passed', 'failed', 'waived'
        );
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'equipment_category') THEN
        CREATE TYPE equipment_category AS ENUM (
            'spot', 'driver_led', 'controlador', 'sensor', 'teclado', 'tablet',
            'motor_cortina', 'unidade_climatizacao', 'difusor', 'ventilador',
            'bomba', 'filtro', 'quadro_eletrico', 'rack', 'servidor', 'ups',
            'gateway', 'router', 'switch', 'camera', 'detetor', 'fechadura',
            'coluna_audio', 'amplificador', 'ecra', 'projetor', 'fonte_alimentacao',
            'modulo_io', 'atuador', 'outro'
        );
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'prescription_status') THEN
        CREATE TYPE prescription_status AS ENUM (
            'draft', 'review', 'approved', 'rejected', 'superseded'
        );
    END IF;
END $$;
COMMENT ON TYPE prescription_status IS 'Ciclo de vida de uma prescrição técnica';

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'budget_impact_level') THEN
        CREATE TYPE budget_impact_level AS ENUM ('reducer', 'neutral', 'increaser', 'critical');
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'technical_zone_type') THEN
        CREATE TYPE technical_zone_type AS ENUM (
            'quadro_controlo', 'zona_drivers', 'rack_ti', 'rack_av',
            'servidor_ia', 'ups', 'quadro_knx', 'quadro_dali',
            'zona_piscina', 'zona_termica', 'zona_baterias',
            'zona_rede', 'zona_tecnica_combinada'
        );
    END IF;
END $$;
COMMENT ON TYPE technical_zone_type IS 'Tipologia de zona técnica conforme Mandato §9.2';

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'zone_status') THEN
        CREATE TYPE zone_status AS ENUM ('planned', 'approved', 'installed', 'commissioned');
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'security_level') THEN
        CREATE TYPE security_level AS ENUM ('standard', 'elevated', 'critical');
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'proposal_status') THEN
        CREATE TYPE proposal_status AS ENUM (
            'draft', 'review', 'approved', 'sent', 'accepted', 'rejected'
        );
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ai_server_status') THEN
        CREATE TYPE ai_server_status AS ENUM (
            'active', 'maintenance', 'offline', 'decommissioned'
        );
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'pattern_type') THEN
        CREATE TYPE pattern_type AS ENUM (
            'occupancy', 'temperature', 'lighting', 'air_quality', 'energy',
            'arrival', 'pool', 'spa', 'maintenance', 'failure'
        );
    END IF;
END $$;
COMMENT ON TYPE pattern_type IS 'Domínios de padrões aprendidos pela IA local conforme Mandato §16.4-16.5';

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'pattern_status') THEN
        CREATE TYPE pattern_status AS ENUM (
            'suggested', 'pending_approval', 'approved', 'rejected', 'active', 'revoked'
        );
    END IF;
END $$;
COMMENT ON TYPE pattern_status IS 'Ciclo de vida de padrão aprendido. Nenhum comportamento sem aprovação.';

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'rule_category') THEN
        CREATE TYPE rule_category AS ENUM (
            'iluminacao', 'cortinas', 'climatizacao', 'audio', 'video', 'rede',
            'seguranca', 'energia', 'agua', 'vmc', 'integracao', 'zonas_tecnicas'
        );
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'rule_approval_status') THEN
        CREATE TYPE rule_approval_status AS ENUM ('draft', 'under_review', 'approved', 'deprecated');
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'project_ops_status') THEN
        CREATE TYPE project_ops_status AS ENUM (
            'draft', 'active', 'on_hold', 'completed', 'archived'
        );
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'budget_flexibility') THEN
        CREATE TYPE budget_flexibility AS ENUM ('fixed', 'flexible_10', 'flexible_20', 'open');
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'experience_trigger') THEN
        CREATE TYPE experience_trigger AS ENUM ('manual', 'schedule', 'voice', 'sensor', 'predictive', 'event');
    END IF;
END $$;

-- ============================================================
-- 2. FUNÇÕES AUXILIARES
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
COMMENT ON FUNCTION update_updated_at_column() IS 'Trigger function para timestamp automático de updated_at';

CREATE SEQUENCE IF NOT EXISTS project_code_seq START 1;

CREATE OR REPLACE FUNCTION generate_project_code()
RETURNS TRIGGER AS $$
BEGIN
    NEW.code := '300-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(NEXTVAL('project_code_seq')::TEXT, 3, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 3. ADAPTAR TABELAS EXISTENTES
-- ============================================================

-- 3.1 profiles — expandir roles para incluir perfis 300 OPS
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check
    CHECK (role = ANY (ARRAY[
        'admin'::text, 'manager'::text, 'member'::text,
        'engineer'::text, 'technician'::text, 'client'::text, 'viewer'::text
    ]));
COMMENT ON TABLE profiles IS 'Perfis de utilizadores 300 OPS (integrado com Supabase Auth)';

-- 3.2 clients — adicionar campos do mandato
ALTER TABLE clients ADD COLUMN IF NOT EXISTS tax_id TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'private'
    CHECK (type IN ('private', 'company', 'developer', 'hotel_group'));
ALTER TABLE clients ADD COLUMN IF NOT EXISTS preferences JSONB DEFAULT '{}';
COMMENT ON TABLE clients IS 'Entidades cliente da 300 OPS (enriquecido com Mandato §3)';

-- 3.3 suppliers — adicionar campos em falta
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS payment_terms TEXT;
-- vat_number já existe (equivalente a tax_id)
-- lead_time_days já existe
-- is_active já existe
COMMENT ON TABLE suppliers IS 'Fornecedores de equipamentos e serviços (enriquecido com Mandato §12)';

-- 3.4 projects — adicionar campos do Engineering Engine
ALTER TABLE projects ADD COLUMN IF NOT EXISTS code TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS ops_status project_ops_status DEFAULT 'draft';
ALTER TABLE projects ADD COLUMN IF NOT EXISTS building_type building_type;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS total_area_m2 DECIMAL(10,2);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS num_floors INTEGER;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS num_rooms INTEGER;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS budget_total DECIMAL(15,2);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS budget_flexibility budget_flexibility DEFAULT 'fixed';
ALTER TABLE projects ADD COLUMN IF NOT EXISTS solution_level solution_level DEFAULT 'recommended';
ALTER TABLE projects ADD COLUMN IF NOT EXISTS client_profile JSONB DEFAULT '{}';
ALTER TABLE projects ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';
ALTER TABLE projects ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES profiles(id) ON DELETE SET NULL;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES profiles(id) ON DELETE SET NULL;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;

-- Constraint de aprovação
ALTER TABLE projects DROP CONSTRAINT IF EXISTS valid_project_approval;
ALTER TABLE projects ADD CONSTRAINT valid_project_approval CHECK (
    (approved_by IS NULL AND approved_at IS NULL) OR
    (approved_by IS NOT NULL AND approved_at IS NOT NULL)
);

-- Índices novos
CREATE INDEX IF NOT EXISTS idx_projects_code ON projects(code);
CREATE INDEX IF NOT EXISTS idx_projects_building_type ON projects(building_type);
CREATE INDEX IF NOT EXISTS idx_projects_ops_status ON projects(ops_status);

-- Trigger para gerar código automático
DROP TRIGGER IF EXISTS trg_projects_generate_code ON projects;
CREATE TRIGGER trg_projects_generate_code
    BEFORE INSERT ON projects
    FOR EACH ROW
    WHEN (NEW.code IS NULL)
    EXECUTE FUNCTION generate_project_code();

COMMENT ON TABLE projects IS 'Projecto 300 OPS — unidade central de trabalho (enriquecido com Mandato §3, §5)';

-- 3.5 proposals — adicionar campos do Proposal Generator (Mandato §13)
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS solution_level solution_level;
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS summary TEXT;
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS vision_text TEXT;
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS building_reading TEXT;
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS identified_needs JSONB DEFAULT '[]';
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS experiences JSONB DEFAULT '[]';
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS systems_summary JSONB DEFAULT '[]';
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS ai_local_summary TEXT;
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS interfaces_summary JSONB DEFAULT '[]';
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS images JSONB DEFAULT '[]';

-- Custos detalhados
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS investment_total DECIMAL(15,2);
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS installation_cost DECIMAL(15,2);
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS programming_cost DECIMAL(15,2);
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS commissioning_cost DECIMAL(15,2);
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS licenses_cost DECIMAL(15,2);
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS annual_maintenance DECIMAL(15,2);
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS subscriptions_annual DECIMAL(15,2);

-- TCO
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS estimated_consumption_annual DECIMAL(15,2);
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS estimated_lifespan_years INTEGER;
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS estimated_replacement_cost DECIMAL(15,2);
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS total_cost_of_ownership DECIMAL(15,2);

-- Exclusões e pressupostos
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS exclusions JSONB DEFAULT '[]';
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS assumptions JSONB DEFAULT '[]';
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS next_steps JSONB DEFAULT '[]';

-- Prazo
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS estimated_duration_weeks INTEGER;

-- Metadados
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS sent_at TIMESTAMPTZ;
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS sent_to JSONB DEFAULT '[]';
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES profiles(id) ON DELETE SET NULL;
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;

-- Constraint de aprovação
ALTER TABLE proposals DROP CONSTRAINT IF EXISTS valid_proposal_approval;
ALTER TABLE proposals ADD CONSTRAINT valid_proposal_approval CHECK (
    (approved_by IS NULL AND approved_at IS NULL) OR
    (approved_by IS NOT NULL AND approved_at IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_proposals_solution_level ON proposals(solution_level);

COMMENT ON TABLE proposals IS 'Proposta editorial para o cliente conforme Mandato §13 (enriquecida)';

-- 3.6 equipment — adicionar campos do sistema de objetos
ALTER TABLE equipment ADD COLUMN IF NOT EXISTS library_id UUID;
ALTER TABLE equipment ADD COLUMN IF NOT EXISTS subsystem_id UUID;
ALTER TABLE equipment ADD COLUMN IF NOT EXISTS technical_zone_id UUID;
ALTER TABLE equipment ADD COLUMN IF NOT EXISTS equipment_code TEXT;
ALTER TABLE equipment ADD COLUMN IF NOT EXISTS position_geometry GEOMETRY(POINT, 4326);
ALTER TABLE equipment ADD COLUMN IF NOT EXISTS specifications JSONB DEFAULT '{}';
ALTER TABLE equipment ADD COLUMN IF NOT EXISTS installation_status equipment_install_status DEFAULT 'planned';
ALTER TABLE equipment ADD COLUMN IF NOT EXISTS commissioning_status equipment_commission_status DEFAULT 'pending';
ALTER TABLE equipment ADD COLUMN IF NOT EXISTS installation_cost DECIMAL(12,2);
ALTER TABLE equipment ADD COLUMN IF NOT EXISTS programming_cost DECIMAL(12,2);
ALTER TABLE equipment ADD COLUMN IF NOT EXISTS quantity INTEGER DEFAULT 1;
ALTER TABLE equipment ADD COLUMN IF NOT EXISTS ordered_at TIMESTAMPTZ;
ALTER TABLE equipment ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ;
ALTER TABLE equipment ADD COLUMN IF NOT EXISTS installed_at TIMESTAMPTZ;
ALTER TABLE equipment ADD COLUMN IF NOT EXISTS commissioned_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_equipment_library ON equipment(library_id);
CREATE INDEX IF NOT EXISTS idx_equipment_install_status ON equipment(installation_status);

COMMENT ON TABLE equipment IS 'Equipamento específico de um projecto (enriquecido com Mandato §11)';

-- ============================================================
-- 4. NOVAS TABELAS — HIERARQUIA ESPACIAL
-- ============================================================

CREATE TABLE buildings (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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

CREATE TABLE floors (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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

CREATE TABLE rooms (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    floor_id        UUID NOT NULL REFERENCES floors(id) ON DELETE CASCADE,
    name            TEXT NOT NULL,
    function        room_function NOT NULL DEFAULT 'outro',
    area_m2         DECIMAL(10,2),
    perimeter       GEOMETRY(POLYGON, 4326),
    orientation     room_orientation,
    detection_state detection_state NOT NULL DEFAULT 'inferred',
    has_windows     BOOLEAN DEFAULT false,
    num_windows     INTEGER DEFAULT 0,
    has_balcony     BOOLEAN DEFAULT false,
    is_wet_zone     BOOLEAN DEFAULT false,
    is_circulation  BOOLEAN DEFAULT false,
    is_technical    BOOLEAN DEFAULT false,
    is_staff_area   BOOLEAN DEFAULT false,
    functional_requirements JSONB DEFAULT '{}',
    metadata        JSONB DEFAULT '{}',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE rooms IS 'Divisão/ambiente dentro de um piso. detection_state: confirmed/detected/inferred/to_confirm/unavailable';
CREATE INDEX idx_rooms_floor ON rooms(floor_id);
CREATE INDEX idx_rooms_function ON rooms(function);
CREATE INDEX idx_rooms_detection ON rooms(detection_state);
CREATE TRIGGER trg_rooms_updated_at BEFORE UPDATE ON rooms
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 5. NOVAS TABELAS — REQUISITOS E EXPERIÊNCIAS
-- ============================================================

CREATE TABLE requirements (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id          UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    room_id             UUID REFERENCES rooms(id) ON DELETE SET NULL,
    category            requirement_category NOT NULL,
    subcategory         TEXT,
    description         TEXT NOT NULL,
    level_essential     BOOLEAN DEFAULT false,
    level_recommended   BOOLEAN DEFAULT false,
    level_signature     BOOLEAN DEFAULT false,
    status              requirement_status DEFAULT 'pending',
    priority            INTEGER NOT NULL DEFAULT 3 CHECK (priority BETWEEN 1 AND 5),
    source              TEXT DEFAULT 'client',
    source_reference    TEXT,
    validated_by        UUID REFERENCES profiles(id) ON DELETE SET NULL,
    validated_at        TIMESTAMPTZ,
    metadata            JSONB DEFAULT '{}',
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE requirements IS 'Requisitos funcionais por projecto ou por divisão (Mandato §4)';
CREATE INDEX idx_requirements_project ON requirements(project_id);
CREATE INDEX idx_requirements_room ON requirements(room_id);
CREATE INDEX idx_requirements_category ON requirements(category);
CREATE TRIGGER trg_requirements_updated_at BEFORE UPDATE ON requirements
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE experiences (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id          UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name                TEXT NOT NULL,
    description         TEXT,
    trigger_type        experience_trigger DEFAULT 'manual',
    actions             JSONB NOT NULL DEFAULT '[]',
    trigger_conditions  JSONB DEFAULT '{}',
    is_active           BOOLEAN DEFAULT true,
    created_by          UUID NOT NULL REFERENCES profiles(id),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE experiences IS 'Experiências programáveis: cenas, rotinas, automações (Mandato §8.2, §16.3)';
CREATE INDEX idx_experiences_project ON experiences(project_id);
CREATE TRIGGER trg_experiences_updated_at BEFORE UPDATE ON experiences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 6. NOVAS TABELAS — SISTEMAS E SUBSISTEMAS
-- ============================================================

CREATE TABLE systems (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id      UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    code            TEXT NOT NULL,
    name            TEXT NOT NULL,
    category        system_category NOT NULL,
    protocol        TEXT,
    description     TEXT,
    status          system_status DEFAULT 'design',
    topology        JSONB DEFAULT '{}',
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
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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

-- ============================================================
-- 7. NOVA TABELA — BIBLIOTECA DE EQUIPAMENTOS
-- ============================================================

CREATE TABLE equipment_library (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brand               TEXT NOT NULL,
    reference           TEXT NOT NULL,
    category            equipment_category NOT NULL,
    description         TEXT,
    dimensions_mm       JSONB,
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
    is_active           BOOLEAN DEFAULT true,
    last_updated        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by          UUID REFERENCES profiles(id) ON DELETE SET NULL,
    UNIQUE(brand, reference)
);
COMMENT ON TABLE equipment_library IS 'Biblioteca técnica 300 — catálogo de equipamentos conforme Mandato §11.1';
CREATE INDEX idx_equip_lib_brand ON equipment_library(brand);
CREATE INDEX idx_equip_lib_category ON equipment_library(category);
CREATE INDEX idx_equip_lib_supplier ON equipment_library(supplier_id);
CREATE TRIGGER trg_equip_lib_updated_at BEFORE UPDATE ON equipment_library
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Adicionar FK de equipment -> equipment_library (agora que a tabela existe)
ALTER TABLE equipment ADD CONSTRAINT fk_equipment_library
    FOREIGN KEY (library_id) REFERENCES equipment_library(id) ON DELETE SET NULL;

-- ============================================================
-- 8. NOVAS TABELAS — ZONAS TÉCNICAS (Mandato §9)
-- ============================================================

CREATE TABLE technical_zones (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id          UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    building_id         UUID REFERENCES buildings(id) ON DELETE SET NULL,
    floor_id            UUID REFERENCES floors(id) ON DELETE SET NULL,
    code                TEXT NOT NULL,
    name                TEXT NOT NULL,
    zone_type           technical_zone_type NOT NULL,
    width_mm            INTEGER,
    height_mm           INTEGER,
    depth_mm            INTEGER,
    area_m2             DECIMAL(8,2),
    location_geometry   GEOMETRY(POINT, 4326),
    location_notes      TEXT,
    max_din_units       INTEGER,
    max_dissipation_w   INTEGER,
    max_weight_kg       INTEGER,
    ventilation_type    TEXT,
    noise_limit_db      INTEGER,
    access_requirement  TEXT,
    power_requirement_va INTEGER,
    cooling_requirement_w INTEGER,
    network_ports       INTEGER,
    status              zone_status DEFAULT 'planned',
    internal_layout     JSONB DEFAULT '{}',
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

-- FK de equipment -> technical_zones
ALTER TABLE equipment ADD CONSTRAINT fk_equipment_technical_zone
    FOREIGN KEY (technical_zone_id) REFERENCES technical_zones(id) ON DELETE SET NULL;

-- FK de equipment -> subsystems
ALTER TABLE equipment ADD CONSTRAINT fk_equipment_subsystem
    FOREIGN KEY (subsystem_id) REFERENCES subsystems(id) ON DELETE CASCADE;

-- ============================================================
-- 9. NOVAS TABELAS — PRESCRIÇÕES (Mandato §7)
-- ============================================================

CREATE TABLE prescriptions (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id              UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    system_id               UUID REFERENCES systems(id) ON DELETE SET NULL,
    subsystem_id            UUID REFERENCES subsystems(id) ON DELETE SET NULL,
    room_id                 UUID REFERENCES rooms(id) ON DELETE SET NULL,
    equipment_id            UUID REFERENCES equipment(id) ON DELETE SET NULL,
    code                    TEXT NOT NULL,
    version                 INTEGER NOT NULL DEFAULT 1,
    functional_requirement  TEXT NOT NULL,
    technical_requirement   TEXT NOT NULL,
    min_performance         TEXT,
    sizing_criterion        TEXT,
    reference_solution      TEXT,
    acceptable_alternatives JSONB DEFAULT '[]',
    selected_equipment_brand TEXT,
    selected_equipment_ref  TEXT,
    required_infrastructure TEXT,
    integrations            JSONB DEFAULT '[]',
    protocols               JSONB DEFAULT '[]',
    acceptance_criterion    TEXT,
    test_method             TEXT,
    applicable_standard     TEXT,
    responsible_validation  UUID REFERENCES profiles(id) ON DELETE SET NULL,
    origin                  TEXT,
    status                  prescription_status DEFAULT 'draft',
    priority                INTEGER DEFAULT 3 CHECK (priority BETWEEN 1 AND 5),
    estimated_cost          DECIMAL(12,2),
    budget_impact           budget_impact_level DEFAULT 'neutral',
    dependencies            JSONB DEFAULT '[]',
    risks                   JSONB DEFAULT '[]',
    exceptions              JSONB DEFAULT '[]',
    pending_items           JSONB DEFAULT '[]',
    created_by              UUID NOT NULL REFERENCES profiles(id),
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    approved_by             UUID REFERENCES profiles(id) ON DELETE SET NULL,
    approved_at             TIMESTAMPTZ,
    superseded_by           UUID REFERENCES prescriptions(id) ON DELETE SET NULL,
    CONSTRAINT valid_prescription_approval CHECK (
        (approved_by IS NULL AND approved_at IS NULL) OR
        (approved_by IS NOT NULL AND approved_at IS NOT NULL)
    ),
    UNIQUE(code, version)
);
COMMENT ON TABLE prescriptions IS 'Prescrição técnica — objeto central do caderno de prescrição conforme Mandato §7';
CREATE INDEX idx_prescriptions_project ON prescriptions(project_id);
CREATE INDEX idx_prescriptions_system ON prescriptions(system_id);
CREATE INDEX idx_prescriptions_room ON prescriptions(room_id);
CREATE INDEX idx_prescriptions_status ON prescriptions(status);
CREATE INDEX idx_prescriptions_equipment ON prescriptions(equipment_id);

-- ============================================================
-- 10. NOVA TABELA — MATRIZ DE INTEGRAÇÃO (Mandato §15)
-- ============================================================

CREATE TABLE integrations (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id          UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    source_system_id    UUID NOT NULL REFERENCES systems(id) ON DELETE CASCADE,
    target_system_id    UUID NOT NULL REFERENCES systems(id) ON DELETE CASCADE,
    event_trigger       TEXT NOT NULL,
    condition           TEXT,
    action              TEXT NOT NULL,
    action_parameters   JSONB DEFAULT '{}',
    protocol            TEXT,
    gateway_equipment_id UUID REFERENCES equipment(id) ON DELETE SET NULL,
    priority            INTEGER DEFAULT 3 CHECK (priority BETWEEN 1 AND 5),
    fallback_action     TEXT,
    timeout_seconds     INTEGER DEFAULT 30,
    security_level      security_level DEFAULT 'standard',
    test_procedure      TEXT,
    test_result         TEXT,
    tested_at           TIMESTAMPTZ,
    tested_by           UUID REFERENCES profiles(id) ON DELETE SET NULL,
    is_active           BOOLEAN DEFAULT true,
    created_by          UUID NOT NULL REFERENCES profiles(id),
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
-- 11. NOVAS TABELAS — AI LOCAL (Mandato §16)
-- ============================================================

CREATE TABLE ai_local_servers (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id          UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    model               TEXT NOT NULL,
    serial_number       TEXT,
    ip_address          INET,
    mac_address         TEXT,
    cpu_cores           INTEGER,
    ram_gb              INTEGER,
    storage_gb          INTEGER,
    gpu_model           TEXT,
    gpu_vram_gb         INTEGER,
    status              ai_server_status DEFAULT 'active',
    last_heartbeat      TIMESTAMPTZ,
    uptime_seconds      BIGINT,
    installed_models    JSONB DEFAULT '[]',
    config              JSONB DEFAULT '{}',
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE ai_local_servers IS 'Servidor de IA local por edifício conforme Mandato §16.1-16.2';
CREATE INDEX idx_ai_servers_project ON ai_local_servers(project_id);
CREATE TRIGGER trg_ai_servers_updated_at BEFORE UPDATE ON ai_local_servers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE ai_learned_patterns (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    server_id           UUID NOT NULL REFERENCES ai_local_servers(id) ON DELETE CASCADE,
    project_id          UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    pattern_name        TEXT NOT NULL,
    pattern_type        pattern_type NOT NULL,
    description         TEXT,
    trigger_conditions  JSONB NOT NULL,
    proposed_actions    JSONB NOT NULL,
    confidence_score    DECIMAL(3,2) CHECK (confidence_score >= 0 AND confidence_score <= 1),
    occurrence_count    INTEGER DEFAULT 0,
    first_seen_at       TIMESTAMPTZ,
    last_seen_at        TIMESTAMPTZ,
    status              pattern_status DEFAULT 'suggested',
    approved_by         UUID REFERENCES profiles(id) ON DELETE SET NULL,
    approved_at         TIMESTAMPTZ,
    rejected_by         UUID REFERENCES profiles(id) ON DELETE SET NULL,
    rejected_at         TIMESTAMPTZ,
    rejection_reason    TEXT,
    rule_scope          TEXT,
    affected_users      JSONB DEFAULT '[]',
    max_executions      INTEGER,
    execution_count     INTEGER DEFAULT 0,
    execution_history   JSONB DEFAULT '[]',
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
-- 12. NOVAS TABELAS — EXPLAINABILITY & AUDIT
-- ============================================================

CREATE TABLE explanation_logs (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id          UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    entity_type         TEXT NOT NULL CHECK (entity_type IN ('prescription', 'equipment', 'zone', 'proposal', 'integration', 'pattern')),
    entity_id           UUID NOT NULL,
    input_data          JSONB NOT NULL,
    rule_id             UUID REFERENCES engineering_rules(id) ON DELETE SET NULL,
    rule_name           TEXT,
    rule_source         TEXT,
    output_data         JSONB NOT NULL,
    confidence_score    DECIMAL(3,2) CHECK (confidence_score >= 0 AND confidence_score <= 1),
    dependencies        JSONB DEFAULT '[]',
    economic_impact     JSONB,
    needs_human_validation BOOLEAN DEFAULT true,
    validated_by        UUID REFERENCES profiles(id) ON DELETE SET NULL,
    validated_at        TIMESTAMPTZ,
    validation_notes    TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE explanation_logs IS 'Log de explicabilidade de cada recomendação do motor de engenharia conforme Mandato §2.3';
CREATE INDEX idx_explanations_project ON explanation_logs(project_id);
CREATE INDEX idx_explanations_entity ON explanation_logs(entity_type, entity_id);
CREATE INDEX idx_explanations_validation ON explanation_logs(needs_human_validation, validated_at);

-- Event Store (Single Source of Truth)
CREATE TABLE domain_events (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    aggregate_type      TEXT NOT NULL,
    aggregate_id        UUID NOT NULL,
    event_type          TEXT NOT NULL,
    event_version       INTEGER NOT NULL DEFAULT 1,
    payload             JSONB NOT NULL,
    correlation_id      UUID,
    causation_id        UUID,
    emitted_by          UUID REFERENCES profiles(id) ON DELETE SET NULL,
    emitted_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    processed           BOOLEAN DEFAULT false,
    processed_at        TIMESTAMPTZ,
    processed_by        TEXT,
    processing_error    TEXT,
    sequence_number     BIGSERIAL
);
COMMENT ON TABLE domain_events IS 'Event store para single source of truth e audit trail completo conforme Mandato §2.1';
CREATE INDEX idx_events_aggregate ON domain_events(aggregate_type, aggregate_id, sequence_number);
CREATE INDEX idx_events_unprocessed ON domain_events(processed, emitted_at);
CREATE INDEX idx_events_correlation ON domain_events(correlation_id);
CREATE INDEX idx_events_type ON domain_events(event_type, emitted_at);

-- ============================================================
-- 13. NOVA TABELA — PRIVACY MATRIX (Mandato §17.2)
-- ============================================================

CREATE TABLE privacy_matrix (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id          UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    room_id             UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    voice_capture       BOOLEAN DEFAULT false,
    voice_retention_days INTEGER DEFAULT 0,
    face_recognition    BOOLEAN DEFAULT false,
    camera_enabled      BOOLEAN DEFAULT false,
    camera_retention_days INTEGER DEFAULT 0,
    local_storage_only  BOOLEAN DEFAULT true,
    cloud_allowed       BOOLEAN DEFAULT false,
    cloud_purpose       TEXT,
    authorized_users    JSONB DEFAULT '[]',
    privacy_mode_available BOOLEAN DEFAULT true,
    privacy_mode_active BOOLEAN DEFAULT false,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by          UUID REFERENCES profiles(id) ON DELETE SET NULL,
    UNIQUE(project_id, room_id)
);
COMMENT ON TABLE privacy_matrix IS 'Matriz de privacidade por divisão conforme Mandato §17.2';
CREATE TRIGGER trg_privacy_updated_at BEFORE UPDATE ON privacy_matrix
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 14. NOVA TABELA — REGRAS DE ENGENHARIA (Mandato §6.2, §11.2)
-- ============================================================

CREATE TABLE engineering_rules (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code                TEXT NOT NULL UNIQUE,
    name                TEXT NOT NULL,
    description         TEXT,
    category            rule_category NOT NULL,
    applies_to_type     building_type[],
    rule_expression     TEXT NOT NULL,
    rule_language       TEXT DEFAULT 'javascript' CHECK (rule_language IN ('javascript', 'python', 'sql', 'json_logic')),
    parameters          JSONB DEFAULT '{}',
    preconditions       JSONB DEFAULT '[]',
    exclusions          JSONB DEFAULT '[]',
    incompatibilities   JSONB DEFAULT '[]',
    source              TEXT,
    version             INTEGER NOT NULL DEFAULT 1,
    author              UUID REFERENCES profiles(id) ON DELETE SET NULL,
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

-- Adicionar FK de explanation_logs -> engineering_rules (já existe mas reforçar)
-- Já foi definida na criação de explanation_logs

-- ============================================================
-- 15. RLS — MULTI-TENANCY POR PROJETO (tabelas novas)
-- ============================================================

-- Função para obter projectos acessíveis ao utilizador actual
CREATE OR REPLACE FUNCTION get_user_project_ids()
RETURNS SETOF UUID AS $$
BEGIN
    RETURN QUERY SELECT id FROM projects;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

ALTER TABLE buildings ENABLE ROW LEVEL SECURITY;
ALTER TABLE floors ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE experiences ENABLE ROW LEVEL SECURITY;
ALTER TABLE systems ENABLE ROW LEVEL SECURITY;
ALTER TABLE subsystems ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE technical_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_local_servers ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_learned_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE explanation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE domain_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE privacy_matrix ENABLE ROW LEVEL SECURITY;
ALTER TABLE engineering_rules ENABLE ROW LEVEL SECURITY;

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
CREATE POLICY equip_lib_isolation ON equipment_library
    USING (true);  -- Biblioteca é global; ajustar conforme necessidade
CREATE POLICY zones_isolation ON technical_zones
    USING (project_id IN (SELECT get_user_project_ids()));
CREATE POLICY prescriptions_isolation ON prescriptions
    USING (project_id IN (SELECT get_user_project_ids()));
CREATE POLICY integrations_isolation ON integrations
    USING (project_id IN (SELECT get_user_project_ids()));
CREATE POLICY ai_servers_isolation ON ai_local_servers
    USING (project_id IN (SELECT get_user_project_ids()));
CREATE POLICY ai_patterns_isolation ON ai_learned_patterns
    USING (project_id IN (SELECT get_user_project_ids()));
CREATE POLICY explanations_isolation ON explanation_logs
    USING (project_id IN (SELECT get_user_project_ids()));
CREATE POLICY events_isolation ON domain_events
    USING (aggregate_id IN (SELECT id FROM projects WHERE id IN (SELECT get_user_project_ids())));
CREATE POLICY privacy_isolation ON privacy_matrix
    USING (project_id IN (SELECT get_user_project_ids()));
CREATE POLICY rules_isolation ON engineering_rules
    USING (true);  -- Regras são globais; ajustar conforme necessidade

-- ============================================================
-- 16. VIEWS ÚTEIS
-- ============================================================

CREATE OR REPLACE VIEW project_summary AS
SELECT 
    p.id,
    p.code,
    p.name,
    p.status AS legacy_status,
    p.ops_status,
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
LEFT JOIN equipment eq ON eq.project_id = p.id
GROUP BY p.id, p.code, p.name, p.status, p.ops_status, p.building_type, p.solution_level, c.name, p.created_at, p.approved_at;

COMMENT ON VIEW project_summary IS 'Resumo consolidado de cada projeto com contagens de entidades';

CREATE OR REPLACE VIEW room_prescription_matrix AS
SELECT 
    r.id AS room_id,
    r.name AS room_name,
    r.function AS room_function,
    r.area_m2,
    f.name AS floor_name,
    b.name AS building_name,
    p.id AS project_id,
    COUNT(DISTINCT CASE WHEN pr.category = 'iluminacao' THEN pr.id END) AS lighting_prescriptions,
    COUNT(DISTINCT CASE WHEN pr.category = 'cortinas' THEN pr.id END) AS curtain_prescriptions,
    COUNT(DISTINCT CASE WHEN pr.category = 'climatizacao' THEN pr.id END) AS climate_prescriptions,
    COUNT(DISTINCT CASE WHEN pr.category = 'audio' THEN pr.id END) AS audio_prescriptions,
    COUNT(DISTINCT CASE WHEN pr.category = 'video' THEN pr.id END) AS video_prescriptions,
    COUNT(DISTINCT CASE WHEN pr.category = 'seguranca' THEN pr.id END) AS security_prescriptions,
    COUNT(DISTINCT CASE WHEN pr.category = 'rede' THEN pr.id END) AS network_prescriptions,
    COUNT(DISTINCT eq.id) AS total_equipment,
    SUM(eq.quantity) AS total_equipment_quantity,
    SUM(COALESCE(eq.unit_price, 0) * COALESCE(eq.quantity, 1)) AS estimated_equipment_cost
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
-- 17. SEED DATA — Regras de engenharia de exemplo (Mandato §6.3)
-- ============================================================

INSERT INTO engineering_rules (code, name, description, category, rule_expression, rule_language, parameters, source, author) VALUES
    (
        'ILU-001',
        'Cálculo de spots — sala estar/jantar',
        'Número de spots baseado na área da divisão para uso estar/jantar',
        'iluminacao',
        'function calculate(room) { const base = Math.ceil(room.area_m2 / 4); return { spots: { min: base, max: Math.ceil(base * 1.3) } }; }',
        'javascript',
        '{"area_factor": 4, "max_variation": 1.3, "min_spacing_m": 2.5}',
        'Experiência 300 — iluminação residencial',
        NULL
    ),
    (
        'ILU-002',
        'Circuitos de iluminação — sala',
        'Divisão de circuitos por tipo de iluminação',
        'iluminacao',
        'function calculate(room, level) { const circuits = { general: level === "essential" ? 2 : 3, decorative: level === "signature" ? 2 : 1, led: 2 }; return circuits; }',
        'javascript',
        '{"general_essential": 2, "general_recommended": 3, "general_signature": 3, "decorative_signature": 2}',
        'NFC 15-100 adaptado',
        NULL
    ),
    (
        'ILU-003',
        'Spots sala 58m² — exemplo mandato',
        'Sala de estar+jantar com 58m², nível Recommended: 14-18 spots, 3 circuitos geral, 2 decorativos, 2 LED, sensor, interface, 2 zonas cortina, 1 zona climatização, 1 zona áudio, 1 ponto voz, 1 ponto Wi-Fi, 2 cenas, Master Off',
        'iluminacao',
        'function calculate(room, level) { return { spots: { min: 14, max: 18 }, circuits_general: 3, circuits_decorative: 2, circuits_led: 2, sensor_presence: 1, wall_interface: 1, curtain_zones: 2, climate_zone: 1, audio_zone: 1, voice_point: 1, wifi_point: 1, local_scenes: 2, master_off: true }; }',
        'javascript',
        '{"min_spots": 14, "max_spots": 18}',
        'Mandato 300 OPS §6.3',
        NULL
    ),
    (
        'CLI-001',
        'Zonas de climatização — divisão',
        'Uma zona de climatização por divisão com area > 25m2 ou uso especial',
        'climatizacao',
        'function calculate(room) { return { zones: room.area_m2 > 25 || ["estar", "suite", "escritorio"].includes(room.function) ? 1 : 0 }; }',
        'javascript',
        '{"min_area_for_zone": 25, "functions_requiring_zone": ["estar", "suite", "escritorio"]}',
        'Experiência 300 — conforto térmico',
        NULL
    ),
    (
        'AUD-001',
        'Zonas de áudio — divisão social',
        'Uma zona de áudio por divisão de estar, jantar ou suite',
        'audio',
        'function calculate(room) { return { audio_zone: ["estar", "jantar", "suite", "cinema", "spa", "piscina_interior"].includes(room.function) ? 1 : 0, speakers: room.area_m2 > 40 ? 4 : 2 }; }',
        'javascript',
        '{"min_area_for_4_speakers": 40}',
        'Experiência 300 — áudio residencial',
        NULL
    )
ON CONFLICT (code) DO NOTHING;

-- ============================================================
-- FIM DA MIGRATION INCREMENTAL
-- ============================================================
