# ANEVUM Web

ANEVUM's operating website and private Command interface. RHEN v3 is the single top-level ANEVUM system and production runtime. Execution, control, research, replay, forecasting, Core/Store, research-worker, and Command/API responsibilities remain isolated as internal modules rather than independent products or Railway application services.

## Open source

The code and documentation in this repository are licensed under the [Apache License 2.0](LICENSE). You may use, modify, and redistribute them under that license.

ANEVUM's names, subsystem names, logos, marks, icons, and product branding are not licensed as trademarks. Forks and derivative projects should use their own branding and must not imply endorsement or official ANEVUM status. See [TRADEMARKS.md](TRADEMARKS.md).

Security-sensitive findings should be reported privately rather than opened as public issues. See [SECURITY.md](SECURITY.md).

This repository is intentionally the public web surface. Private credentials, broker secrets, authenticated operator data, and non-public execution state do not belong here. Other ANEVUM repositories may remain private or use different licensing until separately reviewed.

## Product boundary

### Public — `/`

The public site presents ANEVUM as the operating company and RHEN v3 as its unified runtime. Public pages expose an intentionally limited observability and evidence surface; legacy subsystem names may remain in compatibility data during cutover but are not independent top-level products. It may show:

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

The browser reads `/api/public/trading/live`. During the rebuild this returns HTTP 503 with `OFFLINE_BY_DESIGN`. The Railway-native public-feed replacement exists, but public telemetry must remain offline until separately authorized.

CI treats this as a contract and fails if the public response regains blocked trading fields.

### Operator — `/command`

Command shares the public site's single-viewport visual system: the animated universe background remains fixed, the outer document never scrolls, and dense private content scrolls inside the central workspace. The Performance route consumes the same `PUBLIC-PERFORMANCE-v1` feed as the public Performance page, so the public and private normalized record cannot drift into separate copies.

The Command surface contains private operator telemetry. Cloudflare Access protects only `anevum.com/command*` and `anevum.com/api/command*`. The Worker verifies the signed Access assertion, issuer, audience, expiry and exact owner email before forwarding private requests to Railway. The current owner allowlist is `devon@anevum.com`. Browser Supabase sessions are not used.

The public header contains a low-prominence Command entrance. Search engines are instructed not to index the operator/private routes.

### Private auth — `/private`

Legacy `/private` and `/rhenlink` routes enter `/command`. Identity and logout use Cloudflare Access.

## Public data hardening

The historical public trading projection tables remain in the database for continuity, but anonymous and ordinary authenticated Data API roles no longer have direct `SELECT` access. The lockdown applied on September 25, 2026 is recorded in:

`database/lock_down_public_trading_projection.sql`

The SQL files above record historical lockdowns; they are not active runtime dependencies. RHEN v3 Core uses bounded SQLite storage on the RHEN persistent volume for operational state and evidence. Historical PostgreSQL artifacts may remain during cutover, but PostgreSQL is no longer the target operational dependency for RHEN v3. Public telemetry remains sanitized; no raw account data is published.

## Stack

- React 19 + TypeScript
- Vite
- Cloudflare Workers / static assets
- Cloudflare Access for private Command identity
- Railway compute with RHEN Core on bounded SQLite storage
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

## Foundation v2 verification and archive

See [current verification](docs/FOUNDATION_V2_STATE.md). `site/` and `native/iren-ios/` retain historical clients and are excluded from the production Vite entrypoint. Native release/build workflows are retired because that client still uses removed authentication and mobile APIs. Historical research, release packets and founder experience are preserved.
