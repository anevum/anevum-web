# ANEVUM

Production source for https://anevum.com.

ANEVUM is Devon Akins's personal home online. The public site is intentionally simple: a single interactive story that explains what Devon is working on now, why it matters to him, and what evidence exists.

## Public experience

The public site is a fixed no-scroll portal with five views:

1. Home
2. Current
3. Proof
4. Ideas
5. Other

Current and Proof are live data products, not mock dashboards. The browser polls a same-origin Cloudflare Worker endpoint every five seconds. That Worker proxies a read-only Supabase Edge Function which queries the canonical private trading event ledger, account snapshots, positions, and orders server-side. Secrets and private database access never reach the browser.

Older project routes redirect into the relevant section of the single public experience.

## Private access

Authentication is not a public feature.

- There is no public login link or account navigation.
- `/private` is the single unlinked entrance for Devon and Brandi.
- Account creation does not grant administrator permissions.
- `/command` remains permission-gated.
- Private routes are excluded from indexing and caching.

## Architecture

- React 19 + TypeScript
- Vite
- Cloudflare Vite plugin
- Cloudflare Workers + Static Assets
- React Router
- Motion for restrained transitions
- Supabase for private identity, canonical trading logs, and a sanitized read-only public telemetry Edge Function
- Cloudflare Worker same-origin proxy for the public telemetry feed
- Railway-hosted trading system behind authenticated private Command routes

## Development

```bash
npm install
npm run dev
```

## Verification

```bash
npm run check
npm run build
npm run preview
```

Pull requests create isolated Cloudflare previews and run route, browser-render, desktop, and mobile screenshot checks before production merge.

## Deployment

`main` is production. Feature work stays on preview branches until reviewed.

```bash
npm run deploy
```

The Transcosmic source archive remains preserved under `site/wiki/archive/transcosmic/`, but it is no longer part of the primary public navigation.
