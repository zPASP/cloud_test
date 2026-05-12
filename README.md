# cloud_test

Projeto base do SaaS de e-commerce multi-tenant (WhatsApp-first).

## Estrutura
- `apps/web`: aplicação Next.js
- `prisma`: schema inicial do banco
- `docs`: documentação funcional, técnica e operacional

## Documentação
- PRD: `docs/PRD-ecommerce-saas-multitenant.md`
- Arquitetura: `docs/architecture/system-design.md`
- Backlog inicial: `docs/product/backlog-inicial.md`
- Runbook: `docs/ops/runbook.md`

## Setup rápido
```bash
docker compose up -d
npm install
npm run dev
```
