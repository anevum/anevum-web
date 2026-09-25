# ANEVUM

Production source for https://anevum.com.

ANEVUM is Devon Akins's personal home online. The public site is intentionally simple: a single interactive story that explains what Devon is working on now, why it matters to him, and what evidence exists.

## Public experience

The public site is a scroll-snap presentation rather than a conventional multi-page portal.

1. What ANEVUM is
2. What Devon is working on now
3. How the current system works
4. The evidence
5. What he is thinking about
6. Other projects currently in limbo

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
- Supabase for private identity and sanitized public telemetry
- Railway-hosted trading system behind authenticated Worker proxy routes

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
