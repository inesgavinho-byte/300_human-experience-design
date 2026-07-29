# 300 OPS — Engineering Engine · Prescriptions Generator · Intelligence Layer

Sistema operativo de engenharia, proposta, execução e operação de edifícios inteligentes.

## Estrutura

```
OPS/
├── docs/                           # Documentação
│   ├── 300-OPS-Plano-Implementacao.md
│   └── 300-OPS-Arquitetura-Servicos.md
│
├── backend/                        # NestJS API
│   ├── prisma/schema.prisma        # Schema completo Supabase/PostgreSQL
│   └── src/modules/                # 15 módulos de serviço
│
├── frontend/                       # Next.js 15 Dashboard
│   ├── src/app/(dashboard)/        # Páginas: Projects, Equipment, Rules, AI
│   └── src/components/             # Componentes shadcn/ui
│
├── rule-engine/                    # Motor de regras de engenharia
│   ├── src/rules/built-in/         # 5 regras de exemplo
│   └── src/engine.ts               # Core RuleEngine
│
├── openapi/                        # Especificação OpenAPI 3.1
│   └── 300-ops-api.yaml            # 78 endpoints, 161 schemas
│
├── migrations/                     # SQL migrations Supabase
│   ├── 00001_initial_schema.sql
│   └── 00002_incremental_v2.sql
│
└── app/ops300/                     # Aplicação React existente
    ├── src/pages/                  # 25+ páginas (Dashboard, Projects, etc.)
    └── supabase/                   # Edge Functions + Migrations
```

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Backend | NestJS 10 + Prisma + PostgreSQL + PostGIS |
| Frontend | Next.js 15 + TypeScript + Tailwind CSS + shadcn/ui |
| Database | Supabase (PostgreSQL 17 + PostGIS + RLS) |
| Rule Engine | TypeScript + Vitest |
| Documentos | OpenAPI 3.1 + Swagger |
| IA Local | Ollama (Llama 3 / Mistral) + Whisper + Piper TTS |

## Base de Dados

**Projeto Supabase:** `300-ops-platform` (ref: `iiiicrfhqwsltswmfvld`)

| Tabelas | 50+ (28 originais + 22 novas) |
| Enums | 24 tipos customizados |
| Regras de seed | 5 regras de engenharia (ILU-001/002/003, CLI-001, AUD-001) |
| RLS | Ativo em todas as tabelas |
| PostGIS | Ativo |

## Como executar

### Backend
```bash
cd backend
cp .env.example .env  # Preencher credenciais Supabase
npm install
npx prisma generate
npm run start:dev
# Swagger: http://localhost:3000/api/docs
```

### Frontend
```bash
cd frontend
npm install
npm run dev
# http://localhost:3001
```

### Rule Engine
```bash
cd rule-engine
npm install
npm test              # 19/19 tests passando
npx tsx src/cli.ts list-rules
npx tsx src/cli.ts evaluate --rule ILU-001 --room-area 58 --room-function estar --level recommended
```

## Estado

| Componente | Estado |
|-----------|--------|
| Plano de Implementação | ✅ Completo |
| Arquitetura de Serviços | ✅ Completo |
| OpenAPI 3.1 | ✅ 78 endpoints |
| Backend NestJS | ✅ Build OK |
| Frontend Next.js | ✅ Build OK |
| Rule Engine | ✅ 19/19 tests OK |
| Base de Dados | ✅ 50 tabelas |

---

*Documentação baseada no Mandato 300 OPS — 2026-07-28*
