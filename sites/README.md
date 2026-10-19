# ANEVUM Sites — pilot (2026-10-19)

Session: `ANEVUM.WEB.BUILD.2026-10-19.001.CLIENT-SITES-STUDIO`

An independent, low-overhead local website service operated under ANEVUM. Keep the creative community platform, staff system, member data, and protected Lab untouched.

## Surfaces and boundaries

| Surface | URL | Deployment | Audience |
|---|---|---|---|
| Public studio | https://web.anevum.com/ | Cloudflare Worker `anevum-sites-public-v001` | Public informational site (pilot, noindex) |
| First curated sample | https://web.anevum.com/preview/tobacco-vapor-time | Same public Worker | Public, prominently unofficial |
| Generated samples | https://web.anevum.com/preview/:slug | Same public Worker | Unlisted public, prominently unofficial |
| Owner workbench | https://sites.anevum.com/ | Cloudflare Worker `anevum-sites-workshop-v001` | Founder only; existing Cloudflare Access app |
| Source | `sites/worker.mjs`, `sites/workshop.mjs` | GitHub pilot branch | Reviewed, isolated source |

Existing Cloudflare Access app `ANEVUM Sites Workshop — Owner Only` for `sites.anevum.com` must remain enabled and owner-only. Private Worker additionally validates Cloudflare Access JWT signatures, audience, issuer, expiration, and owner email `devon@anevum.com`, with exact-host routing. **Do not enable workers.dev, loosen the Access app, or put private routes in the public Worker.**

Existing D1 database: `anevum-commission-sites-workshop`. Both Workers bind it as `SITES_DB` in the production environment. The public Worker accesses only the public-preview fields and never exposes `notes` or other internal commission metadata. The private Worker manages `sites` and writes `site_revisions` before edits. Avoid migrating or deleting D1 data without verified backup.

## Deploy and rollback boundaries

1. Keep the website source in this isolated `sites/` directory; branch from the current creator-platform release, **never from retired V5 main**.
2. Confirm no edits to the production apex, creator, member, staff, RHEN, Lab, or payment infrastructure.
3. Upload `sites/worker.mjs` as the module `worker.mjs` for `anevum-sites-public-v001` and `sites/workshop.mjs` as `worker.mjs` for `anevum-sites-workshop-v001`. Bind existing D1 using `{type:"d1",name:"SITES_DB",database_id:"da8daff1-b57b-416d-9c1f-dfd657c29480"}`; use compatibility date 2026-10-19.
4. Attach Worker Domains `web.anevum.com` (public) and `sites.anevum.com` (private) without changing Access rules. Disable the private worker's workers.dev and previews.
5. Smoke checks: anonymous public homepage and sample, generated sample, archived sample 404, public private-notes exclusion, private guest denied, owner login, create/edit/refresh, revision history, mobile and desktop, DNS/TLS and Access enforcement.
6. If rollback is needed, revert **only these two Workers** to their previously saved version or disable their custom domains. Never redeploy the legacy `main` site to `anevum.com`. D1 records remain intact.

**Caveat:** A Cloudflare API success or locally mocked worker test is not an independent browser pass. Check from a signed-out browser and an owner session before accepting client work.

## Existing business concept

The initial `Tobacco Vapor Time` demo uses publicly sourced directory details and is not commissioned or endorsed. The curated marketing presentation is a fixed showcase at `/preview/tobacco-vapor-time`. The workbench's live data-generated draft is `/preview/tobacco-vapor-time?draft=1`. Do not publish restricted product menus, prices, checkout, or age-gated ecommerce in the demo. Confirm hours, address, phone and permissions with management before using it as an official business site.

## Workbench fields and lifecycle

`concept -> pitched -> approved -> live`, with `archived` available from every stage. Status values are editable for now and are **tracking labels, not automatic publication authorizations**. A concept marked live in D1 still displays an ANEVUM unofficial preview disclaimer. Archiving suppresses preview access. Each update records the prior JSON payload. The form includes owner-only notes and starting quote tier. No integrated invoicing, scheduling, payment collection, true deployment of client-owned domains, or client login exists in this pilot.

## Running source tests

From repository root with Node 22+: `node --test sites/tests/worker.test.mjs`

See `sites/OPERATING-MODEL.md` for pricing, sales, legal and delivery scope. 
