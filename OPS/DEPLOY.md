# 🚀 Deploy Netlify — 300 OPS

## Visão geral

O repositório contém **dois sites** no Netlify, partilhando o mesmo repo:

| Site | Caminho | Tipo | URL |
|------|---------|------|-----|
| **300 HXD** | `/` (raiz) | Site estático | `https://300.pt` (domínio próprio) |
| **300 OPS** | `OPS/frontend/` | Next.js (static export) | `https://ops-300.netlify.app` (novo) |

## 1. Site existente (300 HXD)

Já está em produção. O `netlify.toml` na raiz está configurado como site estático.

**Não alterar** — o site principal continua a funcionar normalmente.

## 2. Novo site — 300 OPS Plataforma

### Passo a passo no Netlify:

1. Vai a [netlify.com](https://netlify.com) → **Add new site** → **Import an existing project**
2. Seleciona o repo: `inesgavinho-byte/300_human-experience-design`
3. Em **Build settings**, configura:
   - **Base directory:** `OPS/frontend`
   - **Build command:** `npm install && npm run build`
   - **Publish directory:** `dist`
4. Clica **Deploy site**

O Netlify vai gerar um URL tipo:
```
https://ops-300.netlify.app
```

### Estrutura de rotas (Next.js)

| Rota | Descrição |
|------|-----------|
| `/` | Dashboard de projetos |
| `/projects` | Lista de projetos |
| `/projects/[id]` | Detalhe de projeto |
| `/proposals` | Propostas |
| `/proposals/[id]` | Detalhe de proposta |
| `/equipment` | Catálogo de equipamentos |
| `/rules` | Rule Engine |
| `/ai` | Intelligence Layer |

Todas as páginas são **pré-renderizadas estaticamente** (`output: 'export'`).

### Variáveis de ambiente (se necessário)

No dashboard do Netlify → **Site settings** → **Environment variables**:

```
NEXT_PUBLIC_SUPABASE_URL=https://iiiicrfhqwsltswmfvld.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<sua-anon-key>
```

### Domínio personalizado (opcional)

Para usar um subdomínio próprio tipo `ops.300.pt`:

1. No Netlify → **Domain settings** → **Add custom domain**
2. Adiciona: `ops.300.pt`
3. Na tua gestão de DNS, cria um registo **CNAME**:
   ```
   ops.300.pt → ops-300.netlify.app
   ```

---

## Notas técnicas

- O frontend usa **Next.js 16** com **static export** (`output: 'export'`)
- O build gera ficheiros HTML estáticos na pasta `dist/`
- Não usa SSR — todo o conteúdo é gerado no build time
- O `netlify.toml` em `OPS/frontend/` configura headers de segurança e SPA fallback
