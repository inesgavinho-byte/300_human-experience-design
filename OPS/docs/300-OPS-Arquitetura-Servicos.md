# 300 OPS — Arquitetura de Serviços
## Engineering Engine · Prescriptions Generator · Intelligence Layer

**Versão:** 1.0  
**Data:** 2026-07-28

---

## Índice

1. [Princípios Arquiteturais](#1-princípios-arquiteturais)
2. [Diagrama de Serviços](#2-diagrama-de-serviços)
3. [Serviços Core](#3-serviços-core)
4. [Serviços de Suporte](#4-serviços-de-suporte)
5. [API Gateway & Comunicação](#5-api-gateway--comunicação)
6. [Eventos de Domínio](#6-eventos-de-domínio)
7. [Pipelines de Dados](#7-pipelines-de-dados)
8. [Fluxos de Negócio](#8-fluxos-de-negócio)
9. [Observabilidade](#9-observabilidade)
10. [Decisões de Design](#10-decisões-de-design)

---

## 1. Princípios Arquiteturais

| Princípio | Implementação |
|-----------|--------------|
| **Bounded Contexts** | Cada serviço tem um domínio bem definido; partilha apenas contratos, não implementação |
| **Event Sourcing** | Estado derivado de eventos imutáveis; permite replay, audit, time-travel |
| **CQRS** | Commands (escrita) separados de Queries (leitura); modelos otimizados por operação |
| **Async First** | Serviços comunicam preferencialmente por eventos; chamadas síncronas apenas para queries |
| **Idempotência** | Todos os consumers de eventos são idempotentes; duplicação de eventos é segura |
| **Graceful Degradation** | Falha num serviço não propaga cascata; fallbacks definidos por integração |

---

## 2. Diagrama de Serviços

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                              CLIENTES / CONSUMIDORES                                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────────────┐  │
│  │ Web App  │  │  Mobile  │  │ Tablets  │  │  Voice   │  │  API Partners        │  │
│  │ Next.js  │  │  PWA     │  │  Wall    │  │  Local   │  │  (KNX/DALI/Cloud)    │  │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘  └──────────┬───────────┘  │
│       │             │             │             │                  │              │
│       └─────────────┴─────────────┴─────────────┘                  │              │
│                          │                                         │              │
└──────────────────────────┼─────────────────────────────────────────┼──────────────┘
                           │                                         │
                           ▼                                         ▼
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                              API GATEWAY (Traefik)                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐ │
│  │   Auth       │  │   Rate       │  │   Request    │  │   WebSocket Hub          │ │
│  │   (JWT/OAuth)│  │   Limiting   │  │   Router     │  │   (Real-time updates)    │ │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────────────────┘ │
│       │                  │                  │                  │                   │
│       └──────────────────┴──────────────────┴──────────────────┘                   │
└─────────────────────────────────────────────────────────────────────────────────────┘
                                    │
        ┌───────────────────────────┼───────────────────────────┐
        ▼                           ▼                           ▼
┌───────────────┐          ┌───────────────┐          ┌───────────────┐
│   SYNC LAYER  │          │  ASYNC LAYER  │          │   EDGE LAYER  │
│  (REST/GraphQL)│         │  (Event Bus)  │          │  (Site Local) │
└───────┬───────┘          └───────┬───────┘          └───────┬───────┘
        │                          │                          │
        ▼                          ▼                          ▼
```

### 2.1 Serviços Core

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                              CORE DOMAIN SERVICES                                    │
│                                                                                      │
│  ┌───────────────┐    ┌───────────────┐    ┌───────────────┐    ┌───────────────┐  │
│  │   PROJECT     │◄──►│  ENGINEERING  │◄──►│  PRESCRIPTION │◄──►│  PROCUREMENT  │  │
│  │   SERVICE     │    │    ENGINE     │    │   SERVICE     │    │   SERVICE     │  │
│  │               │    │               │    │               │    │               │  │
│  │ · CRUD        │    │ · Rule Engine │    │ · Generate    │    │ · Catalog     │  │
│  │ · Buildings   │    │ · Sizing      │    │ · Validate    │    │ · Pricing     │  │
│  │ · Documents   │    │ · Topology    │    │ · Version     │    │ · Suppliers   │  │
│  │ · Requirements│    │ · Prescribe   │    │ · Approve     │    │ · Value Eng.  │  │
│  │ · Experiences │    │ · Zones       │    │ · Export      │    │ · Orders      │  │
│  └───────┬───────┘    └───────┬───────┘    └───────┬───────┘    └───────┬───────┘  │
│          │                    │                    │                    │          │
│          └────────────────────┴────────────────────┴────────────────────┘          │
│                               │                                                    │
│                               ▼                                                    │
│                    ┌─────────────────────┐                                         │
│                    │   EVENT BUS (PG+Redis)                                       │
│                    │   · domain_events table                                       │
│                    │   · Redis Streams for real-time                               │
│                    └─────────────────────┘                                         │
│                                                                                      │
│  ┌───────────────┐    ┌───────────────┐    ┌───────────────┐    ┌───────────────┐  │
│  │  DOCUMENT     │    │   PROPOSAL    │    │ COMMISSIONING │    │ MAINTENANCE   │  │
│  │   SERVICE     │    │   GENERATOR   │    │   SERVICE     │    │   SERVICE     │  │
│  │               │    │               │    │               │    │               │  │
│  │ · PDF Gen     │    │ · Templates   │    │ · Checklists  │    │ · Scheduling  │  │
│  │ · DWG Export  │    │ · 3 Options   │    │ · Tests       │    │ · Tickets     │  │
│  │ · Images      │    │ · TCO         │    │ · Reports     │    │ · Alerts      │  │
│  │ · Specs       │    │ · Editorial   │    │ · Sign-offs   │    │ · History     │  │
│  └───────────────┘    └───────────────┘    └───────────────┘    └───────────────┘  │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Serviços de Inteligência

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                              INTELLIGENCE LAYER                                      │
│                                                                                      │
│  ┌───────────────┐    ┌───────────────┐    ┌───────────────┐    ┌───────────────┐  │
│  │   NLP/VOICE   │    │   PATTERN     │    │  PREDICTIVE   │    │  DIGITAL TWIN │  │
│  │   SERVICE     │    │   LEARNING    │    │    ENGINE     │    │   SERVICE     │  │
│  │               │    │               │    │               │    │               │  │
│  │ · Whisper     │    │ · Detect      │    │ · Arrival     │    │ · State Sync  │  │
│  │ · Piper TTS   │    │ · Suggest     │    │ · Occupancy   │    │ · Simulation  │  │
│  │ · Intent      │    │ · Learn       │    │ · Temperature │    │ · Anomaly     │  │
│  │ · NL→Action   │    │ · Approve     │    │ · Energy      │    │ · Forecast    │  │
│  └───────────────┘    └───────────────┘    └───────────────┘    └───────────────┘  │
│                                                                                      │
│  ┌───────────────┐    ┌───────────────┐    ┌───────────────┐                       │
│  │   LLM LOCAL   │    │  EMBEDDINGS   │    │   RAG/RETRIEVAL                    │  │
│  │   (Ollama)    │    │  (pgvector)   │    │  (LangChain)                       │  │
│  │               │    │               │    │                                    │  │
│  │ · Llama 3     │    │ · semantic    │    │ · Biblioteca 300                  │  │
│  │ · Mistral     │    │   search      │    │ · Regras                          │  │
│  │ · Function    │    │ · similar     │    │ · Equipamentos                    │  │
│  │   calling     │    │   items       │    │ · Prescrições                     │  │
│  └───────────────┘    └───────────────┘    └───────────────┘                       │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Serviços Core

### 3.1 Project Service

**Responsabilidade:** Gestão do ciclo de vida do projeto, hierarquia espacial, documentos de entrada.

```typescript
// Domain
interface Project {
  id: UUID;
  code: string;           // "300-2026-001"
  name: string;
  clientId: UUID;
  buildingType: BuildingType;
  status: ProjectOpsStatus;
  solutionLevel: SolutionLevel;
  totalAreaM2: number;
  budgetTotal: Decimal;
  clientProfile: ClientProfile;    // JSONB
  metadata: Record<string, any>;
  version: number;
  approvedBy?: UUID;
  approvedAt?: DateTime;
}

// API
POST   /api/v1/projects              → CreateProject
GET    /api/v1/projects/:id          → GetProject
PATCH  /api/v1/projects/:id          → UpdateProject
POST   /api/v1/projects/:id/approve  → ApproveProject
GET    /api/v1/projects/:id/summary  → GetProjectSummary (view)

POST   /api/v1/projects/:id/buildings     → AddBuilding
POST   /api/v1/projects/:id/floors        → AddFloor
POST   /api/v1/projects/:id/rooms         → AddRoom
POST   /api/v1/projects/:id/documents     → UploadDocument
POST   /api/v1/projects/:id/requirements  → AddRequirement
POST   /api/v1/projects/:id/experiences   → AddExperience
```

**Eventos emitidos:**
```
ProjectCreated       → { projectId, code, name, clientId, buildingType }
BuildingAdded        → { projectId, buildingId, name, perimeter }
RoomDetected         → { projectId, floorId, roomId, name, areaM2, detectionMethod, confidence }
RoomConfirmed        → { projectId, roomId, confirmedBy }
RequirementAdded     → { projectId, roomId, requirementId, category, description }
ExperienceCreated    → { projectId, experienceId, name, triggerType }
DocumentUploaded     → { projectId, documentId, type, url }
ProjectApproved      → { projectId, approvedBy, approvedAt, version }
```

**Dependências:** Nenhuma (serviço raiz).

---

### 3.2 Engineering Engine

**Responsabilidade:** Motor de regras de engenharia — converte requisitos em prescrições, dimensiona equipamentos, gera zonas técnicas.

```typescript
// Domain
interface RuleExecution {
  ruleId: UUID;
  ruleCode: string;       // "ILU-001"
  inputs: JSON;           // { room: { areaM2: 58, function: "estar" } }
  outputs: JSON;          // { spots: { min: 14, max: 18 } }
  confidence: number;     // 0.94
  executionTimeMs: number;
}

interface PrescriptionRequest {
  projectId: UUID;
  roomId: UUID;
  requirements: Requirement[];
  solutionLevel: SolutionLevel;
}

// API
POST   /api/v1/engine/evaluate          → EvaluateRules (para uma divisão)
POST   /api/v1/engine/prescribe         → GeneratePrescriptions (para um projeto)
POST   /api/v1/engine/zones             → GenerateTechnicalZones
POST   /api/v1/engine/value-engineer    → ProposeCostReductions
GET    /api/v1/engine/rules              → ListRules
POST   /api/v1/engine/rules/:id/test    → TestRule

// Internal
POST   /api/v1/engine/_events           → Event consumer (reage a RequirementAdded, RoomConfirmed)
```

**Eventos emitidos:**
```
RuleEvaluated        → { projectId, ruleId, ruleCode, inputs, outputs, confidence }
PrescriptionGenerated → { projectId, prescriptionId, roomId, systemId, code, version }
PrescriptionUpdated   → { projectId, prescriptionId, previousVersion, newVersion }
TechnicalZoneGenerated → { projectId, zoneId, zoneType, dimensions, capacity }
ValueEngineeringProposed → { projectId, proposalId, savings, impact }
```

**Dependências:** Project Service (leitura), Equipment Library (leitura).

---

### 3.3 Prescription Service

**Responsabilidade:** Ciclo de vida das prescrições — criação, revisão, aprovação, versioning, exportação.

```typescript
// Domain
interface Prescription {
  id: UUID;
  code: string;                    // "P-ILU-001-R1"
  version: number;
  projectId: UUID;
  roomId?: UUID;
  systemId?: UUID;
  functionalRequirement: string;
  technicalRequirement: string;
  referenceSolution: string;
  status: PrescriptionStatus;      // draft → review → approved → superseded
  estimatedCost: Decimal;
  budgetImpact: BudgetImpactLevel;
  approvedBy?: UUID;
  approvedAt?: DateTime;
  supersededBy?: UUID;
}

// API
POST   /api/v1/prescriptions              → CreatePrescription
GET    /api/v1/prescriptions/:id          → GetPrescription
PATCH  /api/v1/prescriptions/:id          → UpdatePrescription
POST   /api/v1/prescriptions/:id/review   → SubmitForReview
POST   /api/v1/prescriptions/:id/approve  → ApprovePrescription
POST   /api/v1/prescriptions/:id/reject   → RejectPrescription
POST   /api/v1/prescriptions/:id/supersede → SupersedePrescription
GET    /api/v1/prescriptions/:id/export   → ExportPrescription (PDF/JSON)
GET    /api/v1/projects/:id/prescriptions → ListProjectPrescriptions
```

**Eventos emitidos:**
```
PrescriptionCreated    → { projectId, prescriptionId, code, version, roomId }
PrescriptionSubmitted  → { projectId, prescriptionId, submittedBy }
PrescriptionApproved   → { projectId, prescriptionId, version, approvedBy }
PrescriptionRejected   → { projectId, prescriptionId, rejectedBy, reason }
PrescriptionSuperseded → { projectId, prescriptionId, newVersion, supersededBy }
```

**Dependências:** Project Service, Engineering Engine.

---

### 3.4 Procurement Service

**Responsabilidade:** Catálogo de equipamentos, preços, fornecedores, value engineering, encomendas.

```typescript
// Domain
interface EquipmentLibraryItem {
  id: UUID;
  brand: string;
  reference: string;
  category: EquipmentCategory;
  netPrice: Decimal;
  supplierId: UUID;
  leadTimeDays: number;
  isActive: boolean;
}

interface ValueEngineeringProposal {
  id: UUID;
  projectId: UUID;
  originalItemId: UUID;
  proposedItemId: UUID;
  savings: Decimal;
  technicalImpact: ImpactLevel;
  aestheticImpact: ImpactLevel;
  experienceImpact: ImpactLevel;
  maintenanceImpact: ImpactLevel;
  risk: RiskLevel;
}

// API
GET    /api/v1/equipment-library          → SearchEquipment
GET    /api/v1/equipment-library/:id      → GetEquipmentDetails
POST   /api/v1/equipment-library          → AddEquipment (admin)
PATCH  /api/v1/equipment-library/:id      → UpdateEquipment (admin)

GET    /api/v1/suppliers                  → ListSuppliers
GET    /api/v1/suppliers/:id              → GetSupplier

POST   /api/v1/projects/:id/value-engineer → ProposeAlternatives
GET    /api/v1/projects/:id/procurement    → GetProcurementStatus
POST   /api/v1/projects/:id/orders         → CreateOrder
```

**Eventos emitidos:**
```
EquipmentAdded       → { equipmentId, brand, reference, category, netPrice }
EquipmentPriceUpdated → { equipmentId, oldPrice, newPrice, validUntil }
ValueEngineeringProposed → { projectId, proposalId, savings, impact }
OrderCreated         → { projectId, orderId, supplierId, items, total }
```

---

### 3.5 Document Service

**Responsabilidade:** Geração de documentos — propostas, cadernos de prescrição, cadernos de encargos, desenhos.

```typescript
// API
POST   /api/v1/documents/generate/proposal        → GenerateProposalDocument
POST   /api/v1/documents/generate/prescription   → GeneratePrescriptionBook
POST   /api/v1/documents/generate/specs          → GenerateSpecifications
POST   /api/v1/documents/generate/dwg            → GenerateDWGExport
POST   /api/v1/documents/generate/commissioning  → GenerateCommissioningPlan

GET    /api/v1/documents/:id/download            → DownloadDocument
GET    /api/v1/documents/:id/preview             → PreviewDocument
```

**Templates:**
- Proposta Editorial (3 opções: Essential/Recommended/Signature)
- Caderno de Prescrição (capítulos parametrizados por sistema)
- Caderno de Encargos (âmbito, responsabilidades, critérios de aceitação)
- Plano de Commissioning (checklists, testes, formação)
- Desenhos de Zonas Técnicas (plantas, alçados, cortes)

**Eventos emitidos:**
```
DocumentGenerated    → { projectId, documentId, type, url, generatedBy }
DocumentExported     → { projectId, documentId, format, url }
```

---

### 3.6 Integration Service

**Responsabilidade:** Matriz de integração sistema-a-sistema, protocolos, gateways, fallbacks.

```typescript
// Domain
interface Integration {
  id: UUID;
  projectId: UUID;
  sourceSystemId: UUID;
  targetSystemId: UUID;
  eventTrigger: string;       // "CO2 > 900 ppm"
  condition: string;          // "durante 5 minutos"
  action: string;             // "Boost local VMC"
  protocol: string;           // "KNX"
  gatewayId: UUID;
  fallbackAction: string;     // "Se gateway falhar..."
  timeoutSeconds: number;
  securityLevel: SecurityLevel;
  isActive: boolean;
}

// API
POST   /api/v1/integrations              → CreateIntegration
GET    /api/v1/projects/:id/integrations → ListIntegrations
PATCH  /api/v1/integrations/:id          → UpdateIntegration
POST   /api/v1/integrations/:id/test     → TestIntegration
GET    /api/v1/integrations/:id/log      → GetIntegrationLog
```

**Eventos emitidos:**
```
IntegrationCreated   → { projectId, integrationId, sourceSystem, targetSystem }
IntegrationTested    → { integrationId, result, testedBy }
IntegrationTriggered → { integrationId, trigger, action, timestamp }
IntegrationFailed    → { integrationId, error, fallbackActivated }
```

---

## 4. Serviços de Inteligência

### 4.1 NLP/Voice Service

**Responsabilidade:** Processamento de linguagem natural e controlo por voz.

```typescript
// API
POST   /api/v1/nlp/parse          → ParseNaturalLanguage
// Input:  "Prepara a casa para jantar"
// Output: { intent: "activate_scene", scene: "jantar", room: "all" }

POST   /api/v1/voice/transcribe   → TranscribeAudio (Whisper)
POST   /api/v1/voice/synthesize   → SynthesizeSpeech (Piper)

// WebSocket para streaming em tempo real
WS     /ws/voice                 → VoiceStream
```

**Eventos emitidos:**
```
VoiceCommandParsed   → { projectId, sessionId, transcript, intent, confidence }
SceneActivated       → { projectId, sceneId, triggeredBy: "voice" }
```

### 4.2 Pattern Learning Service

**Responsabilidade:** Deteção de padrões de uso, proposta de automações, gestão de aprovações.

```typescript
// API
GET    /api/v1/projects/:id/patterns          → ListPatterns
GET    /api/v1/projects/:id/patterns/:id      → GetPattern
POST   /api/v1/projects/:id/patterns/:id/approve → ApprovePattern
POST   /api/v1/projects/:id/patterns/:id/reject  → RejectPattern
DELETE /api/v1/projects/:id/patterns/:id      → RevokePattern

// Internal (consumes time-series data)
POST   /api/v1/patterns/_ingest              → IngestSensorData
```

**Regra de ouro:** Nenhum padrão aprovado sem:
- aprovação humana explícita
- regra escrita
- âmbito definido
- utilizadores autorizados
- limite de execuções
- histórico completo
- reversão automática

**Eventos emitidos:**
```
PatternDetected      → { projectId, patternId, type, confidence, description }
PatternSuggested     → { projectId, patternId, proposedActions, requiresApproval }
PatternApproved      → { projectId, patternId, approvedBy, ruleScope }
PatternExecuted      → { projectId, patternId, actions, timestamp }
PatternRevoked       → { projectId, patternId, revokedBy, reason }
```

### 4.3 Predictive Engine

**Responsabilidade:** Previsão de chegadas, ocupação, temperatura, consumos, falhas.

```typescript
// API
GET    /api/v1/projects/:id/predictions/arrival     → PredictArrival
GET    /api/v1/projects/:id/predictions/occupancy   → PredictOccupancy
GET    /api/v1/projects/:id/predictions/temperature → PredictTemperature
GET    /api/v1/projects/:id/predictions/energy      → PredictEnergyConsumption
GET    /api/v1/projects/:id/predictions/maintenance → PredictMaintenanceNeeds
```

**Modelos:**
- Time series forecasting (InfluxDB + Prophet/ARIMA)
- Anomaly detection (isolation forest)
- Pattern matching (recurrent neural networks locais)

---

## 5. API Gateway & Comunicação

### 5.1 Padrões de Comunicação

| Padrão | Quando usar | Exemplo |
|--------|------------|---------|
| **Síncrono (REST)** | Queries, leituras, validações rápidas | `GET /projects/:id`, `GET /prescriptions/:id` |
| **Síncrono (gRPC)** | Comunicação interna serviço-a-serviço | Engineering Engine → Equipment Library |
| **Assíncrono (Eventos)** | Escrita, processamento longo, notificações | `ProjectCreated`, `PrescriptionGenerated` |
| **WebSocket** | Real-time, streaming, voz | Dashboard live, voice interface |
| **Webhook** | Integração com sistemas externos | Notificações para KNX gateway |

### 5.2 Headers Obrigatórios

```
X-Request-ID:         <uuid>           // Rastreabilidade única por request
X-Correlation-ID:     <uuid>           // Rastreabilidade cross-service
X-User-ID:            <uuid>           // ID do utilizador autenticado
X-Project-Context:    <uuid>           // Contexto de projeto (multi-tenant)
X-Event-Version:      1                // Versioning de eventos
X-Idempotency-Key:    <uuid>           // Chave para deduplicação
```

### 5.3 Resposta Padronizada

```json
{
  "data": { ... },
  "meta": {
    "version": "1.0",
    "request_id": "uuid",
    "timestamp": "2026-07-28T20:00:00Z",
    "confidence": 0.94,
    "needs_validation": true,
    "processing_time_ms": 145
  },
  "links": {
    "self": "/api/v1/prescriptions/abc123",
    "related": {
      "equipment": "/api/v1/equipment?prescription_id=abc123",
      "explanation": "/api/v1/explanations?entity_id=abc123",
      "approve": "/api/v1/prescriptions/abc123/approve"
    }
  }
}
```

---

## 6. Eventos de Domínio

### 6.1 Event Store Schema

```sql
-- domain_events (já criado na migration)
CREATE TABLE domain_events (
    id              UUID PRIMARY KEY,
    aggregate_type  TEXT NOT NULL,     -- "project", "prescription", "equipment"
    aggregate_id    UUID NOT NULL,     -- ID do aggregate
    event_type      TEXT NOT NULL,     -- "ProjectCreated", "PrescriptionApproved"
    event_version   INTEGER DEFAULT 1,
    payload         JSONB NOT NULL,
    correlation_id  UUID,              -- Para rastrear transações cross-service
    causation_id    UUID,              -- ID do evento que causou este
    emitted_by      UUID,
    emitted_at      TIMESTAMPTZ DEFAULT NOW(),
    processed       BOOLEAN DEFAULT false,
    processed_at    TIMESTAMPTZ,
    processed_by    TEXT,
    sequence_number BIGSERIAL          -- Ordem global garantida
);
```

### 6.2 Categorias de Eventos

#### Project Lifecycle
```
ProjectCreated → ProjectUpdated → ProjectApproved → ProjectCompleted → ProjectArchived
```

#### Spatial Detection
```
BuildingAdded → FloorAdded → RoomDetected → RoomConfirmed
```

#### Requirements → Prescriptions
```
RequirementAdded → RuleEvaluated → PrescriptionGenerated → PrescriptionSubmitted → PrescriptionApproved
```

#### Procurement
```
EquipmentAdded → PriceUpdated → ValueEngineeringProposed → OrderCreated → OrderDelivered
```

#### AI/Intelligence
```
SensorDataIngested → PatternDetected → PatternSuggested → PatternApproved → PatternExecuted
```

#### Integration
```
IntegrationCreated → IntegrationTested → IntegrationTriggered → IntegrationSucceeded|Failed
```

### 6.3 Event Consumers

| Consumer | Eventos consumidos | Ação |
|----------|-------------------|------|
| **Engineering Engine** | `RequirementAdded`, `RoomConfirmed`, `ProjectApproved` | Avalia regras, gera prescrições |
| **Prescription Service** | `PrescriptionGenerated` | Cria versão, notifica revisores |
| **Document Service** | `PrescriptionApproved`, `ProjectApproved` | Gera documentos atualizados |
| **Procurement Service** | `PrescriptionApproved` | Atualiza mapa de quantidades, preços |
| **Integration Service** | `SystemCreated`, `EquipmentInstalled` | Regista integrações possíveis |
| **AI Services** | `SensorDataIngested`, `SceneActivated` | Aprende padrões, faz previsões |
| **Digital Twin** | Todos os eventos de estado | Mantém réplica virtual atualizada |
| **Notification Service** | `PrescriptionSubmitted`, `PatternSuggested` | Envia notificações para aprovação |

---

## 7. Pipelines de Dados

### 7.1 Ingestão de Documentos

```
Upload (PDF/DWG/IFC/Image)
    │
    ▼
┌─────────────────┐
│ Document Parser │  ← Marker (PDF), Docling (estruturado), IFCParse (IFC)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ AI Vision       │  ← Detecção de divisões, janelas, portas, orientação
│ (Local/Cloud)   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Human Review    │  ← Estado: detected → confirmed / to_confirm
│ Queue           │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Domain Events   │  → RoomDetected, RoomConfirmed
└─────────────────┘
```

### 7.2 Pipeline de Prescrição

```
RequirementAdded / RoomConfirmed
    │
    ▼
┌─────────────────┐
│ Rule Engine     │  ← Avalia regras aplicáveis (area, function, level)
│ (JS/Python DSL) │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Equipment Match │  ← Biblioteca 300: match por compatibilidade, preço, lead time
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Explanation Log │  ← Regista inputs, regra, confiança, impacto económico
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Prescription    │  ← Gera prescrição com 22 campos
│ Generation      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Human Review    │  ← Estado: draft → review → approved
│ Workflow        │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Cascade Update  │  → Atualiza orçamento, quantidades, documentos, digital twin
└─────────────────┘
```

### 7.3 Pipeline de IA Local

```
Sensor Data Stream (MQTT/KNX/Local)
    │
    ▼
┌─────────────────┐
│ Ingestion       │  ← InfluxDB para time series
│ (InfluxDB)      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Pattern Detect  │  ← Deteta padrões: ocupação, temperatura, consumo
│ (Local ML)      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Suggest Action  │  ← Propõe automação com confiança
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Human Approval  │  ← NOTIFICAÇÃO obrigatória; nenhuma ação sem aprovação
│ (Mandato §16.4) │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Execute / Store │  ← Executa se aprovado; regista no audit log
└─────────────────┘
```

### 7.4 Pipeline de Documentos

```
PrescriptionApproved / ProjectApproved
    │
    ▼
┌─────────────────┐
│ Template Engine │  ← Seleciona template por tipo de documento
│ (Pandoc/Weasy)  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Data Hydration  │  ← Preenche template com dados do projeto
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Image Gen       │  ← Gera imagens fotorealistas (técnica/comercial)
│ (Stable Diffusion)│
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ PDF Assembly    │  ← Compila capítulos, índice, anexos
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Versioning      │  ← Guarda versão, gera hash, regista audit
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Delivery        │  → Download link, email, notificação
└─────────────────┘
```

---

## 8. Fluxos de Negócio

### 8.1 Fluxo: Novo Projeto → Proposta Aprovada

```
[Cliente] Ficheiros da obra ──► [Project Service] Upload
                                        │
                                        ▼
                              [AI Vision] Detecção automática
                                        │
                                        ▼
                              [Human Review] Confirma/ajusta divisões
                                        │
                                        ▼
                              [Project Service] RoomConfirmed
                                        │
                                        ▼
                              [Requirements] Coleta de requisitos
                                        │
                                        ▼
                              [Engineering Engine] Gera prescrições
                                        │
                                        ▼
                              [Prescription Service] Revisão + aprovação
                                        │
                                        ▼
                              [Procurement Service] Match equipamentos + preços
                                        │
                                        ▼
                              [Document Service] Gera proposta (3 opções)
                                        │
                                        ▼
                              [Human Approval] Revisão técnica final
                                        │
                                        ▼
                              [Document Service] Emissão para cliente
```

**Tempo estimado:** 2-5 dias (dependendo da complexidade e velocidade de aprovações).

### 8.2 Fluxo: Comando de Voz → Execução

```
[Utilizador] "Prepara a casa para jantar"
                    │
                    ▼
          [NLP/Voice Service] Transcrição + parsing
                    │
                    ▼
          [Intent Recognition] intent: "activate_scene", scene: "jantar"
                    │
                    ▼
          [Integration Service] Resolve acções:
                    │   - Iluminação: cena "jantar" na sala
                    │   - Cortinas: fechar na sala
                    │   - Climatização: 21°C na sala
                    │   - Áudio: playlist "jantar" suave
                    │
                    ▼
          [Security Check] Ações são não-críticas → executa
                    │
                    ▼
          [KNX/DALI Gateway] Envia comandos
                    │
                    ▼
          [Digital Twin] Atualiza estado virtual
                    │
                    ▼
          [Audit Log] Regista execução
```

### 8.3 Fluxo: Padrão Aprendido → Aprovação

```
[AI Local] Deteta padrão: "luzes da sala acendem às 19h de segunda a sexta"
                    │
                    ▼
          [Pattern Learning] Cria proposta de automação
                    │
                    ▼
          [Notification Service] Notifica utilizador:
                    │   "Detectei um padrão: acender luzes às 19h.
                    │    Quer criar uma cena automática?"
                    │
                    ▼
          [Utilizador] Aprova com modificações
                    │
                    ▼
          [Pattern Learning] Cria regra com scope definido:
                    │   - Dias: segunda a sexta
                    │   - Horário: 19:00
                    │   - Divisões: sala
                    │   - Ação: cena "noite"
                    │   - Máximo execuções: ilimitado
                    │   - Auto-revert: não
                    │
                    ▼
          [Engineering Rules] Persiste regra aprovada
                    │
                    ▼
          [Digital Twin] Atualiza modelo comportamental
```

---

## 9. Observabilidade

### 9.1 Stack

| Componente | Ferramenta | Dados |
|-----------|-----------|-------|
| **Métricas** | Prometheus | Latência, throughput, erros, saturação (4 golden signals) |
| **Logs** | Loki | Logs estruturados (JSON) de todos os serviços |
| **Traces** | Tempo (OpenTelemetry) | Distributed tracing cross-service |
| **Dashboards** | Grafana | Dashboards operacionais e de negócio |
| **Alerting** | AlertManager | PagerDuty/Slack para critical, email para warning |

### 9.2 Dashboards

**Operacional:**
- Latência P50/P95/P99 por endpoint
- Taxa de erro por serviço
- Queue depth (BullMQ, Temporal)
- Database connection pool
- Cache hit ratio (Redis)

**Negócio:**
- Projetos por estado (funnel)
- Tempo médio de prescrição (detecção → aprovação)
- Taxa de aprovação de propostas
- Número de padrões aprendidos por projeto
- Custos de IA local (GPU, energia)

### 9.3 Alertas

| Condição | Severidade | Ação |
|----------|-----------|------|
| Latência API > 2s por 5min | Warning | Notificar canal #ops |
| Taxa de erro > 5% por 2min | Critical | PagerDuty on-call |
| AI server offline > 1min | Critical | Notificar técnico local + #ops |
| Prescription pending review > 48h | Warning | Email ao revisor |
| Domain events backlog > 1000 | Warning | Escalar workers |
| Database connections > 80% | Critical | Escalar instância |

---

## 10. Decisões de Design

### 10.1 Porque PostgreSQL para Event Store?

| Alternativa | Pros | Cons | Decisão |
|-------------|------|------|---------|
| **PostgreSQL** | ACID, já na stack, JSONB, pgvector | Escrita sequencial | ✅ Escolhido — event volume previsível (< 1M/dia) |
| Kafka | Alto throughput, partitions | Infra extra, complexidade | ❌ Não — overkill para volume atual |
| NATS | Leve, embedded | Menos durabilidade garantida | ❌ Não — precisamos de persistência |

**Nota:** Migrar para Kafka/NATS se volume exceder 10M eventos/dia.

### 10.2 Porque Temporal.io para Workflows?

| Caso de uso | Solução | Porquê |
|-------------|---------|--------|
| Aprovação de prescrições | Temporal | Workflow longo com timers, retry, compensação |
| Geração de documentos | Temporal | Pipeline com múltiplos steps, fallbacks |
| Commissioning | Temporal | Checklist sequencial, timeouts, assinaturas |

### 10.3 Porque Ollama em vez de API cloud?

| Requisito | Ollama | OpenAI/Anthropic |
|-----------|--------|------------------|
| **Soberania digital** | ✅ Total | ❌ Dependente |
| **Latência** | ✅ < 50ms local | ❌ ~500ms |
| **Privacidade** | ✅ Dados nunca saem | ❌ Envia para cloud |
| **Custo** | ✅ Capex fixo | ❌ Pay-per-token |
| **Qualidade** | ⚠️ Boa, melhorando | ✅ Excelente |

**Decisão:** Ollama como default; fallback para cloud apenas com consentimento explícito do cliente.

### 10.4 Porque NestJS?

| Framework | Modularidade | DDD | DI | Ecosistema | Decisão |
|-----------|-------------|-----|----|-----------|---------|
| **NestJS** | ✅ Excelente | ✅ Nativo | ✅ Built-in | ✅ Maduro | ✅ Escolhido |
| Express | ⚠️ Manual | ❌ | ⚠️ External | ✅ Grande | ❌ Muito boilerplate |
| Fastify | ⚠️ Manual | ❌ | ⚠️ External | ✅ Crescendo | ❌ Menos estrutura |
| Django | ✅ Good | ❌ | ✅ | ✅ Python | ❌ Sincrono por default |

---

## Apêndice A: Mapeamento de Endpoints por Fase

### Fase 1: Core Domain (Semanas 5-10)
```
POST /api/v1/projects
GET  /api/v1/projects/:id
POST /api/v1/projects/:id/buildings
POST /api/v1/projects/:id/floors
POST /api/v1/projects/:id/rooms
POST /api/v1/projects/:id/documents
POST /api/v1/projects/:id/requirements
```

### Fase 2: Engineering Engine (Semanas 11-18)
```
POST /api/v1/engine/evaluate
POST /api/v1/engine/prescribe
GET  /api/v1/engine/rules
POST /api/v1/prescriptions
POST /api/v1/prescriptions/:id/approve
```

### Fase 3: Equipment & Proposal (Semanas 19-26)
```
GET  /api/v1/equipment-library
POST /api/v1/projects/:id/value-engineer
POST /api/v1/proposals
POST /api/v1/documents/generate/proposal
```

### Fase 4: Intelligence (Semanas 27-34)
```
POST /api/v1/nlp/parse
POST /api/v1/voice/transcribe
WS   /ws/voice
GET  /api/v1/projects/:id/patterns
POST /api/v1/projects/:id/patterns/:id/approve
```

### Fase 5: Integration (Semanas 35-44)
```
POST /api/v1/integrations
POST /api/v1/integrations/:id/test
POST /api/v1/commissioning/plans
POST /api/v1/commissioning/checklists/:id/complete
```

---

*Documento gerado a partir do Mandato 300 OPS e Plano de Implementação Técnico.*
