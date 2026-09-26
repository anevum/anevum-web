# ANEVUM Web

ANEVUM's public website and private operator interface for RHEN, the active automated market research and execution system.

## Product boundary

### Public — `/`

The public site is an intentionally limited RHEN observability surface. It may show:

- runtime state and telemetry freshness
- active public version identifier
- aggregate scan/event activity
- anonymized event classes
- architecture and methodology
- public release/update notes

It must **not** expose:

- account equity, cash, buying power, or deposits
- open positions or orders
- traded symbols or prices
- individual trade history or P&L
- exact entry/exit rules
- quality scores, thresholds, risk limits, or reproducible strategy parameters
- broker credentials, tokens, or private database records

The browser reads `/api/public/trading/live`, which proxies the sanitized `trading-public-feed` Supabase Edge Function.

CI treats this as a contract and fails if the public response regains blocked trading fields.

### Operator — `/command`

The Command surface contains private operator telemetry. Production access is intended to sit behind Cloudflare Access and is also gated by ANEVUM/Supabase administrator authorization inside the application.

The public footer contains only a low-prominence `OPERATOR` entrance. Search engines are instructed not to index the operator/private routes.

### Private auth — `/private`

Existing application authentication remains available as a secondary gate for Command. It is not part of the public navigation.

## Public data hardening

The historical public trading projection tables remain in the database for continuity, but anonymous and ordinary authenticated Data API roles no longer have direct `SELECT` access. The lockdown applied on September 25, 2026 is recorded in:

`database/lock_down_public_trading_projection.sql`

The only trading data intentionally published to unauthenticated visitors is the sanitized Edge Function payload used by the live demo.

## Stack

- React 19 + TypeScript
- Vite
- Cloudflare Workers / static assets
- Supabase for application data and telemetry
- GitHub Actions verification and production deployment

## Commands

```bash
npm install
npm run check
npm run build
npm run dev
```

## Deployment

Production is deployed from `main` by `.github/workflows/deploy-production.yml`.

Pull requests run `.github/workflows/anevum-verify.yml`, which performs typechecking, a production build, a Cloudflare preview, privacy probes, and desktop/mobile browser captures.
