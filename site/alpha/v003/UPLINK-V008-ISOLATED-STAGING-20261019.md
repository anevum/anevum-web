# ANEVUM Uplink V008 — Isolated Staging Deployment and Upload Hardening

Session: ANEVUM.WEB.UPDATE.2026-10-19.004.STAGING-ZIP-UPLOAD-GUARDS
Parent: ANEVUM.WEB.UPDATE.2026-10-19.003.STAGING-PUBLISHER-READINESS
PR: https://github.com/anevum/anevum-web/pull/516
Status: **V008 control and V007 runtime deployed on isolated workers.dev staging only. No anevum.com rollout.**

## Source and stages

- Control source SHA `0c3c3ba1e9aa3b65549adff563500050280fd8b7` (the V008 multipart/permissions changes).
- Runtime source SHA `f617d2517e4e8be4cb27cbd2d1a0f12c0fdea4fe` (V007), with a staging-only exact `STAGING_CONTROL_HOST` binding.
- Control host: `anevum-package-alpha-v003-control.devonakins.workers.dev`. Current deployed version `b3a96f61-f007-4382-98f0-21d8c0dd6623`. Previous rollback version `ee625c53-db03-48a0-a8a0-9dd4a43f03d4`.
- Separate runtime host: `anevum-package-alpha-v003-runtime.devonakins.workers.dev`. Current deployed version `42781269-b4a8-4be9-b809-54f11b9519db`. Previous rollback version `b09e7020-9644-47b8-a908-5c9ad2760fc7`.
- Uploads used the Cloudflare Version API to compile all ESM modules with strictly inherited existing bindings. The stage-only runtime binding was explicitly pinned to the known control hostname; no secrets were read, reset or exposed.
- Dedicated stage D1 had all six required package tables, including rights receipts, with zero package project/release records at predeployment inspection. No V008 DB mutation was made.
- Cloudflare route inventory remained 36, with unchanged owners of `anevum.com/upload*`, `anevum.com/play/*`, `anevum.com/*` and `a.anevum.com/*`.

## Improvements

1. Multipart uploads cap **actual received body bytes** at 25 MiB before parsing, rejecting spoofed or absent Content-Length and preventing unbounded formData memory use.
2. The separate workers.dev UI is **public read-only**: upload view clearly says staging preview only. It cannot resolve canonical login sessions, staff queues, private covers or signed private playtest capabilities, even with a supplied Cookie.
3. Missing or unauthorized game/player pages return real HTTP 404 rather than a deceptive HTTP 200 error screen.
4. Runtime adds only the exact staging controller to frame-ancestors, never arbitrary hosts. Canonical production frame origin remains separately allowed.
5. Public executable publishing is still **OFF** by default. No unrelated accounts, XP, legacy V002 projects, creator assets or production routes were touched.

## Actual live staging HTTP smoke

- `GET /api/v1/packages/health` -> JSON ok=true, schemaReady=true, storage=true, runnerConfigured=true, uploadReady=true, publicPublishingEnabled=false, runtimeLiveVerified=false.
- Runtime `GET /__anevum_runtime_health_v1` -> JSON ok=true, independentOrigin=true, cookieless=true, storage=true, schemaReady=true.
- Controller `GET /upload/v3` -> Continuance UI, explicitly states staging interface preview only.
- Controller `GET /packages` -> empty release archive with no invented creations.
- Controller `GET /api/v1/packages/me`, `/staff/packages`, and unauthorized `/play/v3/:id?preview=1` -> HTTP 404.
- Nonexistent runtime release -> HTTP 404. No real member/game/media was uploaded or executed.

## Verification

Exact V008 pre-document CI run: https://github.com/anevum/anevum-web/actions/runs/39350358468
36/36 synthetic Node SQLite/R2/security tests passed; browser-generated HTML in actual Chromium passed 320px, 390px and 1440px viewport checks including artwork, upload UX and reviewer confirmation.
These checks do not prove an authenticated Cloudflare uploader journey, iPhone Safari playback or independent executable-code acceptance.

## Release gates still required

1. Reviewed integration inside existing canonical unified creation/V091 owner. Do NOT repoint overlapping Cloudflare route patterns.
2. Real A creator, independent B reviewer, anonymous C guest, and immutable version replacement across the actual package runtime using rights-cleared assets.
3. Real mobile Safari/desktop execution, CSP/header/resource tests, reports/takedowns, age/privacy protections and staged restore drill.
4. Independently approve public executable handling before enabling the publishing flag; use guarded workflow and preserve rollback versions.
5. No game engine or native editor work until the existing ZIP/HTML publishing experience is complete.

Staging deployment is not production launch authorization.
