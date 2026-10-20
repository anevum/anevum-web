# ANEVUM Sites — pilot (2026-10-19)

Session: `ANEVUM.WEB.BUILD.2026-10-19.001.CLIENT-SITES-STUDIO`

An independent, low-overhead local website service operated under ANEVUM. Keep the creative community platform, staff system, member data, and protected Lab untouched.

## Surfaces and boundaries

| Surface | URL | Deployment | Audience |
|---|---|---|---|
| Public studio | https://web.anevum.com/ | Cloudflare Worker `anevum-sites-public-v001` | Public studio, indexable homepage; uncommissioned previews are noindex |
| Private Smokebreak study | https://sites.anevum.com/preview/smokebreak-st-cloud | Workshop Worker (owner-verified) | Founder only, never exposed by the public Worker |
| First curated sample | https://web.anevum.com/preview/tobacco-vapor-time | Same public Worker | Public, prominently unofficial |
| Generated samples | https://web.anevum.com/preview/:slug | Same public Worker | Unlisted public, prominently unofficial |
| Owner workbench | https://sites.anevum.com/ | Cloudflare Worker `anevum-sites-workshop-v001` | Founder only; existing Cloudflare Access app |
| Source | `sites/worker.mjs`, `sites/studio-v2.mjs`, `sites/workshop.mjs`, `sites/smokebreak-concept.mjs` | GitHub pilot branch plus V003 stacked branch | Reviewed, isolated source |

Existing Cloudflare Access app `ANEVUM Sites Workshop — Owner Only` for `sites.anevum.com` must remain enabled and owner-only. Private Worker additionally validates Cloudflare Access JWT signatures, audience, issuer, expiration, and owner email `devon@anevum.com`, with exact-host routing. **Do not enable workers.dev, loosen the Access app, or put private routes in the public Worker.**

Existing D1 database: `anevum-commission-sites-workshop`. Both Workers bind it as `SITES_DB` in the production environment. The public Worker stores consented inquiries using the existing protected D1 backend and reads only the sanitized public-preview fields; it never exposes `notes` or other internal commission metadata. The private Worker manages `sites` and writes `site_revisions` before edits. Avoid migrating or deleting D1 data without verified backup.

## Deploy and rollback boundaries

1. Keep the website source in this isolated `sites/` directory; branch from the current creator-platform release, **never from retired V5 main**.
2. Confirm no edits to the production apex, creator, member, staff, RHEN, Lab, or payment infrastructure.
3. The V004 candidate introduces local ES module imports. **Do not upload only `worker.mjs` or `workshop.mjs` as standalone source.** Bundle imports with Wrangler, first via `npx wrangler deploy --dry-run --config sites/wrangler.jsonc` and `npx wrangler deploy --dry-run --config sites/wrangler.workshop.jsonc`. After exact-source CI, isolated domain and security checks, deploy only the approved two named scripts. Preserve existing D1 binding `SITES_DB` (`da8daff1-b57b-416d-9c1f-dfd657c29480`), existing secrets, custom domains, existing Access app, workers.dev=false and compatibility date; inspect actual planned bindings before upload.
4. Attach Worker Domains `web.anevum.com` (public) and `sites.anevum.com` (private) without changing Access rules. Disable the private worker's workers.dev and previews.
5. Smoke checks: anonymous public homepage and sample, V004 CSS/JS (including scene switches and consented native inquiry form), generated sample, archived sample 404, public Smokebreak path 404, public private-notes exclusion, private guest denied, owner authenticated Smokebreak study, create/edit/refresh, revision history, 320/390/1440px mobile/desktop, DNS/TLS, reduced motion and Access enforcement.
6. If rollback is needed, revert **only these two Workers** to their previously saved version or disable their custom domains. Never redeploy the legacy `main` site to `anevum.com`. D1 records remain intact.

**Caveat:** A Cloudflare API success or locally mocked worker test is not an independent browser pass. Check from a signed-out browser and an owner session before accepting client work.

## V004 public redesign (October 20, 2026)

Session `ANEVUM.WEB.BUILD.2026-10-20.001.WEB-STOREFRONT-SMOKEBREAK-PREVIEW`, stacked on PR #547. The public Worker uses `studio-v2.mjs` (an extension and connection of the existing unconnected V002 visual system on `feature/sites-public-storefront-v002-20261019`). This provides a new responsive landing page with three labeled fictional interactive design studies, mobile navigation, clearly scoped prices, a real uncommissioned Tobacco Vapor Time link, service/process/FAQ sections and a contact form connected to the existing consent-based `POST /api/inquiries` D1 intake. Existing `/privacy`, `/thanks`, `/inquiries` owner review, anti-abuse guard and inquiry-to-site conversion remain intact; this revision does not add a second data pipeline or payment handling. The live Tobacco showcase `/preview/tobacco-vapor-time` still redirects to `https://preview.anevum.com/tobacco-vapor-time/` when its D1 record remains active; the `?draft=1` route stays generated and separate. The public homepage remains indexable, while unofficial generated previews are noindex.

The private Workshop serves the static `smokebreak-concept.mjs` study **after** signed JWT verification and Cloudflare Access. Its direct link is visible only in the owner workbench header. The public Worker explicitly returns 404 for `/preview/smokebreak-st-cloud` even if a D1 record with that slug is accidentally created. No business-owner approval or commissioned status is implied; business identity, storefront, phone and operating hours require confirmation. No tobacco-product catalogs, promotions, checkout or underage appeals.

### Deployment state

Source implementation and GitHub tests are distinct from a production deployment. A merged PR and passing CI are not an owner-authenticated iPhone QA. Do not claim the new site or private preview is live until the two isolated Workers have actually been deployed, smoke-tested, and the owner-gated route accessed by a signed-in founder session.

## Existing business concept

The initial `Tobacco Vapor Time` demo uses publicly sourced directory details and is not commissioned or endorsed. The curated marketing presentation redirects from `/preview/tobacco-vapor-time` to `https://preview.anevum.com/tobacco-vapor-time/`, preserving the newer independently maintained showcase. The workbench's live data-generated draft is `/preview/tobacco-vapor-time?draft=1`. Do not publish restricted product menus, prices, checkout, or age-gated ecommerce in the demo. Confirm hours, address, phone and permissions with management before using it as an official business site.

## Workbench fields and lifecycle

`concept -> pitched -> approved -> live`, with `archived` available from every stage. Status values are editable for now and are **tracking labels, not automatic publication authorizations**. A concept marked live in D1 still displays an ANEVUM unofficial preview disclaimer. Archiving suppresses preview access. Each update records the prior JSON payload. The form includes owner-only notes and starting quote tier. No integrated invoicing, scheduling, payment collection, true deployment of client-owned domains, or client login exists in this pilot.

## Running source tests

From repository root with Node 22+: `node --test sites/sites-contract.test.mjs sites/tests/worker.test.mjs`. GitHub CI also checks live worker routing and Access boundaries.

See `sites/OPERATING-MODEL.md` for pricing, sales, legal and delivery scope. 
