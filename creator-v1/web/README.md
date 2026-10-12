# ANEVUM Creator V1 component frontend

This directory is the replacement presentation architecture for Creator V1. It exists so the public product can be built directly from reusable components rather than extracting a giant HTML/CSS string from `community-preview/worker.js` and layering overrides onto it.

## Architecture

- React 19 + TypeScript components
- Vite 8 build, output to `creator-v1/dist/web`
- same-origin `/api/v1/*` requests to the existing `creator-v1/api/worker.mjs`
- Cloudflare Worker asset binding for the SPA shell
- existing Creator V1 D1 public-catalogue contract; no duplicate database
- Orbital Underground design tokens and mark implemented directly in components

`creator-v1/wrangler.react-preview.jsonc` is intentionally a Workers preview configuration with no `anevum.com` route. It uses the existing isolated Creator V1 staging D1 database. Production cutover requires a separately approved release change after visual, functional, identity, privacy and recovery acceptance.

## Development

From the repository root:

```sh
npm install --ignore-scripts --no-audit --no-fund
npm run check:creator-v1-web
npm run build:creator-v1-web
```

The old `creator-v1/site/` generator is retained during migration for comparison and rollback. New visible work should be implemented here rather than adding more CSS overrides to the extracted legacy preview.
