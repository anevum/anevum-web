# ANEVUM Web

ANEVUM's operating website and private Command interface. RHEN is the current flagship autonomous market research, execution, evidence, and learning system; the site architecture is intentionally broader than RHEN so ANEVUM can add future systems, agents, infrastructure, releases, and business lines without another structural redesign.

## Product boundary

### Public — `/`

The public site presents ANEVUM as the operating company and RHEN as its current flagship. RHEN-specific pages remain an intentionally limited observability and evidence surface. It may show:

- runtime state and telemetry freshness
- active public version identifier and version history
- aggregate scan/event activity
- anonymized event classes
- normalized live percentage performance and drawdown
- aggregate live trade count, wins/losses, win rate, and sample duration
- architecture, methodology, research state, and public release/update notes

The public performance contract is `PUBLIC-PERFORMANCE-v1`. Percentages are computed server-side from RHEN's durable broker-derived ledger. Live results are separated from shadow, replay, backtest, and development evidence. If external deposits or withdrawals are detected, normalized return and the public curve fail closed until a correct flow-adjusted methodology can be applied.

It must **not** expose:

- raw account equity, cash, buying power, deposits, or withdrawals
- open positions or orders
- traded symbols, prices, quantities, or fills
- individual trade history or dollar P&L
- exact entry/exit rules
- quality scores, thresholds, risk limits, or reproducible strategy parameters
- broker credentials, tokens, or private database records

The browser reads `/api/public/trading/live`, which proxies the sanitized `trading-public-feed` Supabase Edge Function.

CI treats this as a contract and fails if the public response regains blocked trading fields.

### Operator — `/command`

Command shares the public site's single-viewport visual system: the animated universe background remains fixed, the outer document never scrolls, and dense private content scrolls inside the central workspace. The Performance route consumes the same `PUBLIC-PERFORMANCE-v1` feed as the public Performance page, so the public and private normalized record cannot drift into separate copies.

The Command surface contains private operator telemetry. Production access is intended to sit behind Cloudflare Access and is also gated by ANEVUM/Supabase administrator authorization inside the application.

The public footer contains only a low-prominence `OPERATOR` entrance. Search engines are instructed not to index the operator/private routes.

### Private auth — `/private`

Existing application authentication remains available as a secondary gate for Command. It is not part of the public navigation.

## Public data hardening

The historical public trading projection tables remain in the database for continuity, but anonymous and ordinary authenticated Data API roles no longer have direct `SELECT` access. The lockdown applied on September 25, 2026 is recorded in:

`database/lock_down_public_trading_projection.sql`

The only trading data intentionally published to unauthenticated visitors is the sanitized Edge Function payload used by the public RHEN surfaces. Raw projection tables remain inaccessible to browser roles. The function returns normalized percentages/counts and a downsampled normalized curve, not dollar balances or trade-level execution detail.

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
