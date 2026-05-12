# Arquitetura do Sistema

## Visão
- Monorepo com `apps/web` (Next.js) e `prisma` para modelagem de dados.
- Isolamento multi-tenant por `companyId` e `storeId` em entidades de negócio.
- Estratégia inicial: backend integrado no Next.js (evolutivo para serviços separados).

## Camadas
- **Controller/API**: entrada HTTP, autenticação/autorização, validação.
- **Service**: regras de negócio (checkout, reserva de estoque, fila de atendimento).
- **Repository**: acesso a dados via Prisma.

## Jobs assíncronos
- Redis + BullMQ para envio WhatsApp e notificações.

## Segurança
- Sessão/JWT com rotação de refresh token.
- Headers de segurança e rate limiting por IP e por tenant.
