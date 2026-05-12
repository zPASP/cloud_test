# Arquitetura do Sistema (Versão Final Base)

## Stack implementada na base
- Next.js 15 (app router) em `apps/web`
- Prisma para modelagem transacional multi-tenant
- PostgreSQL + Redis via Docker Compose
- CI inicial via GitHub Actions

## Multi-tenancy
- Isolamento por `companyId` e `storeId`.
- Domínios personalizados modelados em `DomainMapping`.
- Relações explícitas por loja para catálogo, clientes, pedidos e conteúdo.

## Módulos de domínio modelados
1. **Identidade e organização**: Company, Plan, CompanyPlan, Store, User, UserStore.
2. **Catálogo**: Category, Brand, Product, ProductVariant, ProductImage, ProductTag.
3. **Cliente e carrinho**: Customer, CustomerAddress, Cart, CartItem, WishlistItem.
4. **Comercial**: Coupon, Order, OrderItem, OrderPayment, OrderStatusHistory.
5. **Atendimento e logística**: QueueAssignment, TrackingEvent.
6. **WhatsApp**: MessageTemplate, MessageLog.
7. **CMS/branding/LGPD**: Banner, StaticPage, CookieConsent.
8. **Auditoria**: AuditLog.

## APIs iniciais criadas
- `GET /api/health`
- `GET/POST /api/orders`
- `GET /api/products`
- `POST /api/checkout`
- `GET /api/admin`

> Esses endpoints estão como placeholders para permitir evolução incremental por serviço/caso de uso.
