# ANEVUM Creator V1

Session: `ANEVUM.WEB.BUILD.2026-10-11.003.CREATOR-V1-ARCHIVE-CUTOVER`

## Current staged member development (Oct 11, 2026)

- `next.anevum.com` uses the **separate** `anevum-creator-v1-staging` D1, not production. The original shared preview/production note below was release-0.1.0 history and is superseded.
- `next.anevum.com/join` now serves the accessible mobile-oriented creator sign-in/profile experience through a **separate** staging Worker. It accurately reports registration closed until the Resend sending credential and final external security acceptance exist.
- `next.anevum.com/api/v1/member/*` is a narrowly scoped staging authentication route backed only by the staging D1, a secret HMAC pepper and a staging Turnstile widget.
- Staging migration `0003_member_identity_staging` was applied to the isolated D1. The custom identity module has 16 passing in-memory tests; it is not an independently audited production login system.
- `studio.next.anevum.com` stays the owner-only editorial and publishing app; regular member sessions never grant staff access.
- Details: [member identity staging README](auth/README.md). Do not treat these routes as permission to open public registration or expose production data.

## Current release

`anevum.com` now serves the new cinematic ANEVUM creator platform through Worker `anevum-creator-v1`. The deployed build is **0.1.0, a read-only foundation for V1**, not the completed community launch. `next.anevum.com` serves the same tested artifact through a separately deployable preview Worker.

The frontend reads actual community D1 data. There are currently zero published projects and zero published creators; no sample members, ratings or XP are presented as real. Loading, no-results, unpublished-project and service-failure states are distinct.

Live capabilities: catalogue search, category filtering, cursor pagination, public project detail, accurate public counts, and feature availability. Accounts, project submission, moderation writes, voting, XP and community discussion are explicitly unavailable until implemented.

The approved artwork, angular gold mark, orange/violet/blue palette and responsive navigation are retained. Category illustrations are labeled concept art, not invented live applications.

## Runtime boundaries

- `wrangler.jsonc`: production `anevum-creator-v1`, `anevum.com/*`.
- `wrangler.preview.jsonc`: preview `anevum-community-preview`, `next.anevum.com`.
- Both currently have only the `COMMUNITY_DB` binding. They do not have legacy membership data, broker credentials, a Railway upstream or administrative APIs.
- The two databases were subsequently separated: production stays read-only on its existing community D1; preview and member identity are now bound only to their own staging D1. See the staged development section above.
- CSP permits same-origin scripts/styles/data only; no inline executable code, third-party script or hosted user code. The site remains noindex while development is incomplete.
- Browser-opened external project links are HTTPS-filtered, not safety certifications. No server fetches or executes user-submitted projects.

## Legacy preservation

The old source remains on the existing archive branches. The retained V5 Worker and databases were not deleted. `backstage.anevum.com/*` now passes through `anevum-legacy-archive`: owner Access plus signed JWT validation, an allowlist of historical public pages/assets, no forwarded credentials, and no member/admin/trading APIs.

The Backstage custom domain still identifies the retained V5 Worker as its origin; the more-specific gateway route deliberately runs in front of it. Do not remove that route without reviewing the access boundary.

The legacy production membership database has an encrypted R2 snapshot, verified by decryption and an isolated D1 restore with record comparison. The temporary restore database was deleted. This is NOT a complete off-provider backup of every historical system. See `RELEASE-0.1.0.md` and `ops/RECOVERY.md`.

Legacy production, beta and member-staging generated Workers URLs and preview URLs are disabled, with previous exposure settings preserved privately. The old production deployment workflow was replaced by an explicit refusal on `main` and this branch; its original remains on the archive branch. RHEN trading, Railway services, and existing database contents were not modified.

## Build and tests

Node.js 22+ and Python 3 with its standard SQLite module are required. No npm package installation is needed for this build/test suite:

```sh
cd creator-v1
npm test
node --check dist/worker.mjs
```

The build reads `../community-preview/worker.js` as the approved-art reference and separates its art/style from the former fictional data. `site/client.mjs` supplies the new real-data interface. `site/generated.mjs` and `dist/` are generated and ignored.

There are 34 Node tests: 24 catalogue/site checks backed by a disposable local SQLite fixture, and 10 signed-JWT/archive-boundary checks. Fixtures never reach Cloudflare. The added Creator V1 Verify workflow runs these tests without deployment permissions or secrets.

Additional local in-memory Chromium testing covered 28 responsive layouts and search, injection handling, mobile keyboard navigation, outage and retry behavior. Independent Cloudflare Browser Rendering checks verified the live preview, main-domain mobile homepage, and unauthenticated Backstage Access challenge. A real owner-authenticated archive browser session has not yet been tested.

## Release process

Build and test first. Deploy the reviewed artifact to the preview Worker only, verify against real services, then deploy that exact artifact to production. Do not run the archived V5 deployment flow. No automatic public deployment has been added. Source remains on `build/anevum-v1-foundation-20261011` pending permanent repository extraction.

## Next implementation objective

Build real member registration, sign-in/recovery and creator-owned profiles against the community data model. Then add draft submission and moderator review. Votes and XP must use server-authoritative, deduplicated records after account and abuse controls are in place. Do not redesign the approved identity or reactivate the RHEN roadmap.
