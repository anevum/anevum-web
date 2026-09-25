# ANEVUM

Production source for https://anevum.com.

ANEVUM is Devon Akins's personal working archive: a home for active systems, experiments, software, markets, writing, research, and the record of what gets built.

## Architecture

- React 19 + TypeScript
- Vite
- Cloudflare Vite plugin
- Cloudflare Workers + Static Assets
- React Router
- Supabase for RHENLINK identity and public sanitized telemetry
- Railway-hosted trading system behind authenticated Worker proxy routes

The public site and private Command console share one codebase while remaining visually and functionally distinct.

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

## Deployment

`main` is production. Pull requests use isolated Cloudflare Worker Previews.

```bash
npm run deploy
```

Do not deploy feature branches to the production custom domain.

## Information states

- **ACTIVE** — current source of truth
- **FUTURE** — defined but not active
- **ARCHIVE** — preserved history, not current direction

Earlier Transcosmic/publishing material is preserved under `site/wiki/archive/transcosmic/` and surfaced publicly at `/wiki/archive/transcosmic`.
