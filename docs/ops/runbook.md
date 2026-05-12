# Runbook Operacional (Inicial)

## Subir ambiente local
1. `docker compose up -d`
2. Configurar `.env` com `DATABASE_URL`
3. `npm install`
4. `npm run dev`

## Incidentes comuns
- Banco indisponível: verificar container `postgres`.
- Redis indisponível: verificar container `redis`.
- Falha WhatsApp API: acionar fallback e alerta para admin.
