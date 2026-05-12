# cloud_test

Base de implementação do SaaS de e-commerce multi-tenant (WhatsApp-first), alinhada ao PRD.

## Estrutura
- `apps/web`: aplicação Next.js (site + APIs)
- `prisma`: schema completo de domínio
- `docs`: documentação funcional, técnica e operacional

## Endpoints já disponíveis (placeholders)
- `GET /api/health`
- `GET/POST /api/orders`
- `GET /api/products`
- `POST /api/checkout`
- `GET /api/admin`

## Documentação
- PRD: `docs/PRD-ecommerce-saas-multitenant.md`
- Arquitetura: `docs/architecture/system-design.md`
- Backlog final por ondas: `docs/product/backlog-inicial.md`
- Runbook: `docs/ops/runbook.md`

## Setup rápido
```bash
docker compose up -d
npm install
npm run dev
```
