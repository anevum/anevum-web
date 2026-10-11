# ANEVUM Creator Platform — preview

**Canonical session:** `ANEVUM.WEB.BUILD.2026-10-11.001.CREATOR-PLATFORM-SEPARATION`

**Platform vision:** a creator-first, community-owned place for AI-assisted software projects, where small useful tools, games, experiments, automations and full applications can be made, published, tried, reviewed, and improved together. Existing V5 / RHEN operations are **not** the public creator platform.

## Preview now

- **Public preview hostname:** [next.anevum.com](https://next.anevum.com/) (Cloudflare custom Worker domain created).
- **Worker name:** `anevum-community-preview`, source in [worker.js](worker.js).
- **Production public domain:** `anevum.com` is **unchanged** and still serves existing V5.
- **Protected V5 hostname:** `backstage.anevum.com` is attached to the old V5 Worker, but private Command and Studio have **not** passed hostname/auth migration acceptance.
- **Preview database:** `anevum-community-preview` (isolated Cloudflare D1). Schema in [migrations/0001_initial_creator_platform.sql](migrations/0001_initial_creator_platform.sql). Schema applied and verified. **The current prototype Worker has no database binding yet.**
- **Temporary source location:** this feature branch in `anevum-web`. Independent `anevum/creator-platform` repository has not yet been created.

## What's working in the design prototype

- Distinct mobile-responsive homepage and compact icon-driven navigation.
- Authentic RHEN and ANEVUM Field Notes seed cards, search and category filters.
- Browser-local project draft form and link validation, draft deletion.
- Preview-only: `robots.txt`, response `noindex`, `/health` and default-deny unknown routes.
- D1 tables for future creator profiles, projects, versions, favorites, reviews, abuse reports and moderator event records.

No real member registration, upload, publishing, reviews, hosted demos, or authentication yet. Project drafts exist only in the browser's own `localStorage` and are not shared.

## Security invariants

The community preview uses **no V5 data, no brokerage keys, no Railway services, and no order-execution path**. User-uploaded executable code must never be proxied to the public or private application origins. Prefer external HTTPS demos until a separate and audited sandbox service exists. Keep all public community data in distinct storage.

## Deployment workflow

This is a source-controlled Cloudflare classic Worker. Until the new repository and a reviewed CI deploy workflow exist, deployments are intentional/manual; do not allow this branch to automatically deploy `anevum.com` and do not merge the preview to `main` merely to release it.

If editing the Worker source, validate JavaScript syntax and run browser smoke tests. After uploading an isolated preview version, check `next.anevum.com`, `/health`, unexpected paths, and confirm the original `anevum.com/*` route remains bound to `anevum-web-nextgen`.

## Implementation gates

1. Prove Backstage Cloudflare Access with allowed/denied identities and V5 session, cookie, OAuth and signed audience compatibility.
2. Create separate `anevum/creator-platform` repository (connector lacks the create-repository action) and move preview there, preserve independent CI.
3. Bind dedicated community D1 in an isolated Worker release; implement read-only published directory then secure auth and creator-owned submissions with moderation.
4. Launch invitation-only testing on `next`, then obtain explicit owner authorization for the reviewed `anevum.com` cutover.
5. Preserve one-click rollback to original V5 route and encrypted backup of V5 data.

See [product charter](../docs/creator-platform/PRODUCT-CHARTER.md) and [backstage migration](../docs/creator-platform/BACKSTAGE-MIGRATION.md).
