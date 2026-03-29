# Lil API - The API Integration Master Agent

<div align="center">
  <img src="https://storage.googleapis.com/msgsndr/qQnxRHDtyx0uydPd5sRl/media/67eb83c5e519ed689430646b.jpeg" alt="RJ Business Solutions" width="100" />

  **Built by RJ Business Solutions**

  ![TypeScript](https://img.shields.io/badge/TypeScript-5.8+-3178C6?style=flat-square&logo=typescript&logoColor=white)
  ![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)
  ![Cloudflare](https://img.shields.io/badge/Cloudflare-Workers-F38020?style=flat-square)
  ![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)
</div>

---

## Overview

**Lil API** is an autonomous API intelligence engine that takes ANY API and ships a complete, production-hardened, branded, monetized full-stack application. It reads the spec, understands the backend, wires the frontend, debugs itself, and deploys.

### What It Does

- **Parses any API** — OpenAPI 3.x, GraphQL, Postman, cURL, plain English
- **Detects auth automatically** — OAuth 2.0 (PKCE, CC), JWT, API Keys, HMAC, mTLS
- **Generates full stack** — TypeScript types, API client, Hono backend, Next.js frontend
- **Deploys automatically** — Cloudflare Workers + Pages, live URL in minutes
- **Debugs itself** — 500+ error patterns, root cause analysis, auto-fix

### The 6 UI States

Every component handles all 6 states:
- **Loading** — Skeleton matching exact content shape
- **Success** — Data beautifully presented
- **Empty** — Zero-state with clear CTA
- **Error** — Human-readable message + retry
- **Offline** — Detected via Network API
- **Stale** — Soft indicator for old data

---

## Architecture

```
[lil-api]
├── apps/
│   ├── web/          # Next.js 16 frontend
│   └── worker/       # Cloudflare Workers + Hono
├── packages/
│   ├── mcp/          # MCP server with all tools
│   ├── types/        # Shared TypeScript types
│   └── utils/        # Shared utilities
└── turbo.json        # Turborepo config
```

### Tech Stack

| Component | Technology |
|-----------|------------|
| Frontend | Next.js 16, React 19, TypeScript 5.8+, Tailwind CSS 4 |
| Backend | Cloudflare Workers, Hono 4, TypeScript |
| MCP | Cloudflare Agents SDK, Zod |
| Auth | OAuth 2.0, JWT, API Keys |
| Database | D1, KV, Durable Objects, R2 |
| Deployment | Cloudflare Workers + Pages |

---

## Quick Start

```bash
# Clone
git clone https://github.com/rjbizsolution23-wq/lil-api.git
cd lil-api

# Install
pnpm install

# Develop
cd apps/web && pnpm dev
cd apps/worker && pnpm dev

# Deploy
cd apps/web && wrangler pages deploy
cd apps/worker && wrangler deploy
```

---

## MCP Tools

### API Discovery
- `fetch_openapi_spec` — Parse OpenAPI 3.x from URL or raw
- `introspect_graphql` — GraphQL introspection query
- `detect_auth_scheme` — Auto-detect auth pattern

### Code Generation
- `generate_typescript_types` — Full type system
- `generate_api_client` — Typed HTTP client with retry
- `generate_hono_routes` — Cloudflare Workers routes

### Debug
- `analyze_error` — Root cause + fix
- `validate_request` — Pre-flight validation
- `trace_api_call` — Full request/response trace

---

## API Protocols Supported

| Protocol | Support |
|----------|----------|
| REST/HTTP | ✅ Full |
| GraphQL | ✅ Full (queries, mutations, subscriptions) |
| WebSockets | ✅ Full |
| gRPC | ✅ Full |
| Server-Sent Events | ✅ Full |
| Webhooks | ✅ Full (inbound + outbound) |
| JSON-RPC 2.0 | ✅ Full |

---

## Auth Patterns Supported

| Pattern | Support |
|---------|----------|
| OAuth 2.0 (PKCE) | ✅ |
| OAuth 2.0 (Client Credentials) | ✅ |
| JWT (RS256) | ✅ |
| API Keys (header/query) | ✅ |
| Basic Auth | ✅ |
| HMAC Signatures | ✅ |
| mTLS | ✅ |

---

## Database Layers

| Layer | Technology | Use Case |
|-------|------------|----------|
| Tier 1 | Supabase PostgreSQL | Source of truth, ACID |
| Tier 2 | Cloudflare D1 | Edge cache, simple queries |
| Tier 3 | Cloudflare KV | Sessions, rate limits |
| Tier 4 | Durable Objects | WebSocket state, real-time |
| Tier 5 | Upstash Redis | Pub/sub, distributed locks |
| Tier 6 | Cloudflare R2 | Binary storage |

---

## Built-in Backend Patterns

- ✅ Rate limiting (3-layer: IP, user, endpoint)
- ✅ Retry with exponential backoff
- ✅ Idempotency keys
- ✅ Circuit breakers
- ✅ Background job queues
- ✅ Webhook handling (verified + idempotent)
- ✅ Response caching

---

## Testing

```bash
# Run all tests
pnpm test

# Unit tests
pnpm --filter web test:unit

# Integration tests
pnpm --filter worker test:integration

# E2E tests
pnpm test:e2e
```

---

## Deployment

### Frontend (Cloudflare Pages)
```bash
cd apps/web
wrangler pages project create lil-api
wrangler pages deploy out
```

### Backend (Cloudflare Workers)
```bash
cd apps/worker
wrangler deploy
```

---

## Environment Variables

### Worker (.dev.vars)
```
OPENAI_API_KEY=sk-xxx
STRIPE_SECRET_KEY=sk_xxx
DATABASE_URL=postgresql://...
```

### Web (.env.local)
```
NEXT_PUBLIC_API_URL=https://lil-api-worker.xxx.workers.dev
```

---

## License

MIT © RJ Business Solutions

---

## Built by

**RJ Business Solutions**
📍 1342 NM 333, Tijeras, New Mexico 87059
🌐 https://rjbusinesssolutions.org
🐦 @ricksolutions1
