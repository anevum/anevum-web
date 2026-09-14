# ANEVUM Nextgen

This branch is the active replacement build for the ANEVUM digital ecosystem.

- Public production remains unchanged during development.
- `main` remains the preserved legacy/rollback reference until cutover.
- `nextgen` is the active development branch.
- Canonical fictional content must be sourced from the live ANEVUM Canon Wiki and pass publication gates before public release.
- The replacement frontend keeps the existing ANEVUM Supabase projects; no replacement backend is created as part of this branch.

Current phase: shared shell and route foundation, followed by concept-art convergence and preview deployment.

## Deployment verification — 2026-09-14

- GitHub repository: `anevum/anevum-web`
- Active branch: `nextgen`
- `nextgen` is ahead of `main` and not behind it.
- Cloudflare Worker target: `anevum-web-nextgen`
- Build command: `npm run build`
- Non-production upload command: `npx wrangler versions upload`
- Static assets directory: `./dist`
- SPA fallback is handled by Wrangler `assets.not_found_handling = "single-page-application"`.
- Workers.dev and version preview URLs are enabled in `wrangler.jsonc`.
- The obsolete `public/_redirects` fallback was removed because it conflicted with Workers asset routing.

This section is intentionally committed to trigger a clean branch rebuild and confirm GitHub → Cloudflare synchronization without touching `main`, production DNS, `anevum.com`, Supabase, or the existing GPT Site.
