# ANEVUM Web

ANEVUM's public studio website and protected Command interface.

ANEVUM is currently an independent software studio run by Devon Akins. The public website presents the studio, its products, Field Notes, and founder background without treating internal RHEN modules as separate companies or top-level commercial products.

## Open source

The code and documentation in this repository are licensed under the [Apache License 2.0](LICENSE). ANEVUM names, subsystem names, logos, marks, icons, and product branding are not licensed as trademarks. Security-sensitive findings should be reported privately rather than opened as public issues.

This repository is intentionally the public web surface. Private credentials, broker secrets, authenticated operator data, and non-public execution state do not belong here.

## Public information architecture

- `/` — live ANEVUM home
- `/products` — canonical public product registry
- `/feed` — releases, Field Notes, public-safe runtime events, and research decisions
- `/field-notes` — public build / research journal
- `/about` — ANEVUM and founder context
- `/resume` — professional résumé
- `/products/rhen` — RHEN product hub
- `/products/rhen/evidence` — RHEN public-safe evidence
- `/products/rhen/architecture` — RHEN architecture and authority boundaries
- `/products/rhen/releases` — RHEN release history
- `/command` — protected operator surface
- `/command/public` — operator view of the public projection / truth boundary

Legacy public URLs such as `/live`, `/research`, `/architecture`, and `/releases` redirect to their canonical product-scoped routes.

RHEN is the current flagship R&D system. IREN, GRAEN, VELUM, and NOSTRA remain named internal RHEN responsibilities rather than top-level ANEVUM products. Future software can be added beside RHEN without restructuring the company around the trading system.

## RHEN public evidence boundary

RHEN public performance remains governed by `PUBLIC-PERFORMANCE-v1`. Public views may show sanitized runtime state, active public version information, aggregate activity, normalized percentage performance and drawdown, aggregate trade statistics, architecture, methodology, research state, and release history.

Public views must **not** expose:

- raw account equity, cash, buying power, deposits, or withdrawals
- open positions or orders
- traded symbols, prices, quantities, or fills
- individual trade history or dollar P&L
- exact entry/exit rules
- quality scores, thresholds, risk limits, or reproducible strategy parameters
- broker credentials, tokens, or private database records

Live results remain separate from replay, backtest, development, and research evidence. CI continues to enforce the public/private data contract.

## Operator — `/command`

Command remains the protected operational interface. It contains private operator telemetry and controls. Cloudflare Access protects private routes and the Worker verifies the signed Access assertion before forwarding private requests.

The public header contains a deliberately low-prominence Command entrance. Search engines are instructed not to index protected routes. Command includes a Public workspace that exposes the health and provenance of the same sanitized projection used by the public site.

## Stack

- React 19 + TypeScript
- Vite
- Cloudflare Workers / static assets
- Cloudflare Access for Command identity
- Railway compute for RHEN
- GitHub Actions verification and production deployment

## Commands

```bash
npm install
npm run check
npm run build
npm run dev
```

## Deployment

Production deploys from `main` through `.github/workflows/deploy-production.yml`.

Pull requests run `.github/workflows/anevum-verify.yml`, including typechecking, a production build, a Cloudflare preview, privacy probes, and desktop/mobile browser captures.
