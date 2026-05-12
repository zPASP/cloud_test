# PRD — E-commerce SaaS Multi-Tenant

**Versão:** 1.0  
**Data:** Maio/2026  
**Status:** Em definição

---

## 1. Visão Geral

Plataforma SaaS de e-commerce multi-tenant, na qual diversas empresas podem criar suas próprias lojas online (catálogo, carrinho, checkout, gestão de pedidos), com finalização da venda integrada via WhatsApp. O sistema também funciona como PDV (venda de balcão), suporta estoque real e por encomenda, e oferece total customização visual por loja.

### 1.1 Objetivos do Produto

- Permitir que pequenas e médias empresas tenham presença digital sem investimento alto
- Centralizar catálogo, vendas online e vendas presenciais em um único sistema
- Manter o WhatsApp como canal principal de comunicação e finalização
- Oferecer ao superadmin (operador do SaaS) controle total sobre planos, limites e empresas

### 1.2 Personas

| Persona | Descrição | Acesso |
|---------|-----------|--------|
| Superadmin | Operador do SaaS, gerencia todas as empresas | Painel `/superadmin` |
| Admin da Empresa | Dono/gestor de uma empresa, gerencia suas lojas | Painel `/admin` |
| Funcionário/Vendedor | Opera dia a dia (pedidos, estoque, atendimento) | Painel `/admin` (permissões limitadas) |
| Cliente Final | Comprador da loja | Site público da loja |

---

## 2. Arquitetura Multi-Tenant

### 2.1 Hierarquia

```text
Superadmin
└── Empresa (Tenant)
    ├── Plano de Assinatura (limites)
    ├── Domínios (subdomínio.app + domínio próprio opcional)
    └── Lojas (1..N, conforme plano)
        ├── Usuários (admin + funcionários, com RBAC)
        ├── Produtos / Variações / Marcas / Categorias
        ├── Estoque (loja + fornecedor)
        ├── Pedidos
        ├── Clientes
        └── Configurações (branding, pagamentos, frete, mensagens)
```

### 2.2 Estratégia de Isolamento

**Modelo:** Tenant ID em todas as tabelas (`companyId`, `storeId`)  
**Justificativa:** Padrão Shopify/Vercel — baixo custo operacional, escalável, com isolamento garantido por middleware no ORM.

### 2.3 Roteamento por Domínio

- `app.seusistema.com.br` → painel admin/superadmin
- `modasul.seusistema.com.br` → loja pública (subdomínio gratuito)
- `www.modasul.com.br` → loja pública (domínio próprio, configurado por DNS CNAME)

Middleware Next.js detecta o host e identifica a loja correspondente.

---

## 3. Funcionalidades Detalhadas

### 3.1 Catálogo de Produtos

**Modelagem:**
- Produto base (nome, descrição, marca, categoria, imagens)
- Variações (P/M/G, cores, numerações) — cada uma com SKU único e estoque próprio
- Marcas (cadastro próprio)
- Categorias (com hierarquia: pai/filho)
- Tags (busca livre)

**Tipos de Preço:**
- **Visível:** preço normal exibido
- **Sob consulta:** botão "Consultar preço" — abre WhatsApp
- **Aproximado:** mostrado com indicação "a partir de" ou "aproximadamente"

**Tipos de Estoque (uso interno):**
- **Estoque Loja** — disponível imediatamente
- **Estoque Fornecedor** — encomenda, com prazo configurável
- Quando estoque loja = 0 e fornecedor = 0 → automaticamente "sob consulta"

**Imagens:**
- Upload direto (com otimização automática) ou URL externa
- Múltiplas imagens por produto e por variação
- Galeria com zoom no detalhe do produto

### 3.2 Carrinho

- **Não reserva estoque** (reserva só ocorre na finalização do pedido)
- Anônimo: salvo em localStorage / cookie
- Logado: salvo no banco
- **Merge automático** ao fazer login: soma itens do carrinho anônimo + carrinho salvo
- Cliente pode **marcar itens específicos** do carrinho para finalizar parcialmente (deixando o resto pro próximo pedido)

### 3.3 Checkout e Finalização

**Fluxo:**
1. Cliente monta carrinho (sem login)
2. Clica em "Finalizar"
3. Identifica-se (login ou criar conta)
4. Seleciona/cadastra endereço (cliente pode ter múltiplos)
5. Escolhe forma de pagamento (entre as ativadas pelo admin)
6. Confirma pedido
7. Sistema:
   - Reserva estoque
   - Gera número de pedido
   - Envia mensagem ao WhatsApp configurado da loja com **apenas: número do pedido, qtd de itens, valor total** (sem detalhar itens)
   - Notifica o vendedor responsável pela fila (ver §3.6)

**Pagamento Parcial:**
- Suporte nativo a múltiplos pagamentos por pedido (ex: 50% sinal + 50% retirada)
- Cada pagamento tem status próprio (pendente, pago, cancelado)
- **Apenas admin/vendedor pode marcar pagamento como concluído** (cliente nunca)

**Frete:**
- Não é calculado no checkout do MVP
- Vendedor combina via WhatsApp e adiciona valor como linha separada no pedido
- Estrutura preparada para integração futura com Correios/Melhor Envio

**Cupons de Desconto:**
- Admin define cupons (% ou valor fixo)
- Admin define desconto máximo permitido (teto global)
- Vendedor pode aplicar desconto manual, respeitando o teto

### 3.4 PDV (Venda de Balcão)

- Mesma engine de carrinho/pedido
- Vendedor inicia "Novo pedido balcão"
- Adiciona produtos, cadastra/seleciona cliente (opcional)
- Finaliza com pagamento na hora ou parcelado
- Pedido entra no mesmo fluxo de status

### 3.5 Status de Pedido e Logística

**Estados padrão (editáveis pelo admin):**

```text
1. Aguardando pagamento
2. Pagamento confirmado
3. Em separação (origem)
4. Aguardando transportadora
5. Em trânsito (com código de rastreio + link transportadora)
6. Recebido no centro de distribuição local
7. Em separação (destino)
8. Saiu para entrega
9. Entregue
   (alternativos: Cancelado, Devolvido, Aguardando retirada)
```

- Admin pode **adicionar/remover/renomear** status
- Cada status pode ter:
  - Mensagem de template (editável) enviada via WhatsApp
  - Ações automáticas (ex: dar baixa no estoque)
- **Acompanhamento público** por número de pedido (cliente vê histórico)
- **Cancelamento:**
  - Cliente pode cancelar até status "Pagamento confirmado"
  - Após isso, precisa abrir solicitação (admin aprova/recusa)
- **Edição:** mesma regra do cancelamento

### 3.6 Fila de Atendimento

- Pedido novo → entra em fila
- Vendedor "puxa" pedido (atribui a si)
- Notificação WhatsApp ao vendedor quando novo pedido entra
- Dashboard mostra: minha fila, fila geral, pedidos sem vendedor
- Métricas: tempo médio de atendimento por vendedor

### 3.7 Integração WhatsApp

**API:** Não oficial (Evolution API / WPPConnect / Baileys)  
**Justificativa do cliente:** WhatsApp dedicado e descartável por loja; risco controlado.

**Eventos disparados:**
- Novo pedido → vendedor da fila
- Mudança de status → cliente (template editável)
- Confirmação de pagamento → cliente
- Solicitação de cancelamento → admin/vendedor

**Templates:**
- Editáveis por loja, por status
- Suportam variáveis: `{nome_cliente}`, `{numero_pedido}`, `{valor}`, `{codigo_rastreio}`, `{link_rastreio}`, etc.

**Resiliência:**
- Fila assíncrona (BullMQ + Redis)
- Retry com backoff exponencial
- Logs de mensagens enviadas/falhadas
- Fallback: notificar admin se a API estiver fora por > X minutos

### 3.8 Pagamentos

**Gateways suportados (configuráveis):**
- Mercado Pago
- Stripe
- PagSeguro
- Asaas
- Pix manual (chave configurada, sem integração — cliente envia comprovante)
- Dinheiro / Cartão maquininha (somente PDV)

Admin ativa quais gateways quer usar. Cliente escolhe no checkout entre os ativos.

**Reembolso:**
- Estrutura para reembolso total/parcial
- Taxa de cancelamento configurável (admin define %)
- Por padrão: 0%

**Nota Fiscal:**
- Não implementada no MVP
- Estrutura no banco preparada (campos NFe, integração com Nuvem Fiscal/Focus NFe/eNotas pronta para ativar)

### 3.9 Clientes

- Cadastro: nome, email, CPF (opcional), telefone, senha
- Múltiplos endereços
- Histórico de pedidos
- Carrinho persistente
- Lista de desejos (wishlist)
- Solicitação de exclusão LGPD (marca flag no banco, admin processa)

### 3.10 Painel Superadmin

- CRUD de Empresas
- Planos de assinatura customizáveis (limites: nº lojas, nº usuários, GMV, recursos habilitados)
- Modelo de cobrança por empresa (assinatura fixa, % por transação, ou híbrido)
- Configuração de domínio próprio
- Visão geral: GMV, empresas ativas, churn, MRR
- Logs de auditoria (quem fez o quê)
- Suporte: pode "logar como" uma empresa para diagnóstico

### 3.11 Painel Admin da Empresa

- Dashboard (vendas, ticket médio, top produtos, estoque crítico)
- Gestão de lojas (se plano permitir múltiplas)
- Produtos, marcas, categorias
- Pedidos (com filtros avançados, fila, atribuição)
- Clientes
- Funcionários e permissões (RBAC granular)
- Cupons e promoções
- Configurações de branding (logo, cores, banners, popups)
- Templates de mensagens WhatsApp
- Páginas estáticas (Sobre, FAQ, Trocas)
- Configurações de pagamento, frete, LGPD
- Relatórios (exportação CSV/Excel)
- Domínio próprio (admin pode configurar também)

### 3.12 Painel Vendedor

- Versão simplificada do admin
- Foco em pedidos: fila, meus pedidos, novo pedido balcão
- Sem acesso a configurações sensíveis (pagamentos, planos, funcionários)
- Métricas pessoais de performance

### 3.13 Customização Visual (Branding)

- Logo, favicon, cores primária/secundária/acento
- Tema claro/escuro (toggle nativo para o cliente final)
- Banners da home (carrossel, com agendamento)
- Popup promocional (com regras: aparecer X vezes, em qual página)
- Páginas estáticas com editor rico (Sobre, FAQ, Trocas e Devoluções, Política de Privacidade, Termos)
- Links de redes sociais
- Customização de menu (categorias destacadas)

### 3.14 LGPD

- Política de privacidade e termos padrão pré-prontos
- Editáveis por empresa
- Banner de cookies (aceitar/recusar/configurar)
- Endpoint de "solicitação de exclusão" — marca flag no banco para admin processar
- Logs de consentimento
- Exportação de dados pessoais sob demanda (direito de portabilidade)

### 3.15 PWA

- Instalável em iOS/Android
- Funciona offline (catálogo em cache)
- Push notifications (avisar status de pedido, promoções)
- Mobile-first em todo o design
- Performance: Lighthouse > 90 em todas as métricas

---

## 4. Stack Tecnológica

| Camada | Tecnologia | Justificativa |
|--------|-----------|---------------|
| Frontend | Next.js 15 + React 19 + TypeScript | SSR/ISR para SEO, mobile-first, ecossistema maduro |
| UI | Tailwind CSS + shadcn/ui | Customização total, temas, performance |
| Estado | Zustand + TanStack Query | Leve, robusto, cache automático |
| Backend | Next.js API Routes (ou NestJS) | A definir conforme escolha |
| ORM | Prisma | Type-safe, migrations, multi-tenant friendly |
| Banco | PostgreSQL 16+ | Robusto, JSON nativo, full-text search |
| Cache/Fila | Redis + BullMQ | Sessões, jobs assíncronos, rate limit |
| Auth | Auth.js (NextAuth v5) | OAuth, JWT, magic links, extensível |
| Hash | Argon2id | Mais seguro que bcrypt |
| Imagens | Cloudinary ou Backblaze B2 + Sharp | Otimização automática, CDN |
| Email | Resend ou AWS SES | Transacional confiável |
| WhatsApp | Evolution API (auto-hospedada) | Custo zero, controle total |
| Pagamentos | Mercado Pago + Stripe + Pix manual | Cobertura nacional + internacional |
| Infra | Hostinger VPS KVM + Docker + Nginx + PM2 | Custo-benefício, controle total |
| CI/CD | GitHub Actions | Padrão de mercado, gratuito |
| Monitoring | Sentry + Uptime Kuma | Erros + uptime |

---

## 5. Princípios de Desenvolvimento

### 5.1 Clean Code
- Arquitetura em camadas (Controllers / Services / Repositories)
- Inversão de dependências (testes fáceis)
- DTOs para entrada/saída (validação com Zod)
- Sem lógica de negócio em controllers
- Funções pequenas, propósito único
- Nomes descritivos (português ou inglês, consistente)

### 5.2 Segurança (OWASP Top 10)
- HTTPS obrigatório (HSTS)
- Headers de segurança (Helmet, CSP, X-Frame-Options)
- Rate limiting por IP/usuário
- Argon2id para senhas
- JWT com refresh token rotation
- Validação rigorosa de input (Zod)
- Sanitização contra XSS
- Queries parametrizadas (Prisma já faz)
- CSRF tokens em formulários
- Logs sem dados sensíveis
- Secrets em variáveis de ambiente (nunca no Git)
- Backups diários do banco (criptografados)
- Auditoria de ações sensíveis
- Isolamento multi-tenant garantido por middleware

### 5.3 Testes
- Unitários: Vitest (services, utils)
- Integração: Vitest + supertest (APIs)
- E2E: Playwright (fluxos críticos de compra)
- Cobertura mínima: 70% em código de negócio
- CI roda testes em todo PR

### 5.4 Qualidade
- ESLint + Prettier (formatação automática)
- Husky + lint-staged (pre-commit)
- Conventional Commits
- Code review obrigatório em PRs
- TypeScript strict mode

### 5.5 Performance
- ISR para páginas de catálogo
- Otimização de imagens (Next/Image + AVIF/WebP)
- Lazy loading
- Database indexing estratégico
- Cache em Redis para queries frequentes
- Bundle splitting agressivo

### 5.6 Observabilidade
- Logs estruturados (JSON, com correlation ID)
- Métricas (Prometheus-compatible)
- Tracing distribuído (OpenTelemetry)
- Alertas em erros críticos

---

## 6. Roadmap em Fases

### Fase 0 — Setup (1 semana)
- Repositório, CI/CD, ambientes (dev/staging/prod)
- Docker Compose
- Schema inicial Prisma
- Estrutura de pastas e padrões de código
- Documentação técnica inicial

### Fase 1 — MVP (6-8 semanas)
- Cadastro de empresa, loja, admin
- Cadastro de produtos com variações
- Catálogo público (busca, filtros, detalhes)
- Carrinho persistente + merge no login
- Checkout completo
- Pedidos com status e fila
- Painel admin básico
- Painel vendedor básico
- Integração WhatsApp (notificação de novo pedido + status)
- LGPD básica (políticas, cookies, exclusão)
- Tema claro/escuro
- Mobile-first / PWA básico
- Deploy em produção

### Fase 2 — Crescimento (4-6 semanas)
- Painel superadmin completo
- Multi-lojas por empresa
- Planos de assinatura
- Domínio próprio
- Pagamentos online (Mercado Pago, Stripe)
- Pagamento parcial
- Cupons e promoções avançadas
- Relatórios e exportação
- Customização visual avançada (banners, popups)

### Fase 3 — Maturidade (contínuo)
- App nativo (se necessário, com React Native)
- Integração frete (Correios/Melhor Envio)
- Emissão de NFe
- Programa de fidelidade
- Reviews/avaliações
- Marketplace (várias lojas no mesmo carrinho)
- IA: recomendação de produtos, busca semântica

---

## 7. Riscos e Mitigações

| Risco | Impacto | Mitigação |
|-------|---------|-----------|
| Banimento WhatsApp não oficial | Alto | Número descartável; trocar é trivial; fallback email |
| Escala do banco multi-tenant | Médio | Índices, read replicas, particionamento futuro |
| Custo Hostinger ao crescer | Médio | Estrutura Docker permite migrar para outro provider |
| Vazamento de dados | Alto | Isolamento por middleware, auditoria, criptografia |
| Compliance LGPD | Alto | Implementação desde o início, não como retrofit |
| Concorrência (Shopify, Loja Integrada, Nuvemshop) | Alto | Diferencial: WhatsApp first, PDV integrado, multi-loja, preço justo |

---

## 8. Métricas de Sucesso

- Tempo do primeiro pedido (onboarding < 30 min)
- Taxa de conversão do checkout > 60%
- Lighthouse Performance > 90
- Uptime > 99.5%
- MRR crescente mês a mês
- NPS > 50

---

## 9. Próximos Passos

1. Confirmar arquitetura backend (Next.js full-stack vs Next.js + NestJS)
2. Modelagem completa do banco de dados (Prisma schema)
3. Wireframes das telas principais
4. Setup do repositório e ambiente
5. Início do desenvolvimento da Fase 0
