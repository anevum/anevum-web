# Archived website documents (read-only)

The old pre-Vite static homepage, styles, client-side JavaScript/Supabase code,
headers, sitemap and old static build/serve scripts were removed from the V5
development branch after a source dependency audit. **Do not deploy or restore
that retired auth client.**

The historical Transcosmic wiki snapshot and its documentation remain under
site/wiki/archive/transcosmic/ for reference. Git history preserves the deleted
static source for legitimate historical inspection.

Current production website entrypoints are root index.html, Vite/React in src/,
Cloudflare worker.mjs and the guarded .github/workflows/deploy-production.yml.
Do not recreate a second static website or use the archived code as a runtime.
