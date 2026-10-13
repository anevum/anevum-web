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


## Path-isolated authenticated staging integration

Do not replace the existing `next.anevum.com` root preview. Instead mount the compiled React site at `https://next.anevum.com/creator/` using a **separate** Worker named `anevum-creator-v1-react-staging` and the narrow route `next.anevum.com/creator/*`. This leaves `/api/v1/member/*` under the existing `anevum-member-auth-staging` Worker and `next.anevum.com` root under the old `anevum-community-preview` Worker. Do not change `anevum.com/*`.

Build with `npm run build:creator-v1-web:staging` from the repository root. This creates `creator-v1/dist/react-staging` with Vite base `/creator/`. The new Worker strips `/creator` on asset requests and serves public catalogue GET endpoints at `/creator/api/v1/*` using **only the existing staging D1**. Authenticated member requests remain same-origin `/api/v1/member/*`, never proxied or duplicated. The Member Worker owns cookies, CSRF checks, rates, project revision and staff review. A non-staging hostname fails closed. The routes are scoped in `creator-v1/wrangler.react-staging-path.jsonc`.

Only release this staging Worker after a separate exact-head approval and Cloudflare route inventory verification, with the account token scoped to Workers and routes for the zone. No owner member credentials or staged private database export is necessary for deployment. Verify anonymous requests first, then complete member A / staff / anonymous / member B with invited human testers. This branch does not authorize production promotion or replacing the original staging homepage.


For manual staging release boundaries and exact-SHA procedure see ../ops/REACT-STAGING-RELEASE.md.
