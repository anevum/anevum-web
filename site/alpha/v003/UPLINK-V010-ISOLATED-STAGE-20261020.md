# ANEVUM Creator Uplink V010 — Isolated Staging Migration and Controller Rollout

Session: `ANEVUM.WEB.UPDATE.2026-10-20.001.V010-CREATOR-ATTRIBUTION-STAGE`  
PR: https://github.com/anevum/anevum-web/pull/564  
Status: isolated staging deployed, **PUBLIC EXECUTABLE PUBLISHING AND PUBLIC CREATOR GALLERY OFF**. Not merged to alpha or main; no production route changed.

## Exact operations performed October 20, 2026

1. Read-only Cloudflare inspection confirmed dedicated package D1 `anevum-package-alpha-v003-staging` had the original six package tables, zero projects/releases/files/rights records, and a valid Time Travel backup bookmark. This is **not** ANEVUM's canonical member database.
2. Source migration `site/alpha/v003/migrations/0003_canonical_creator_links.sql` was tested using in-memory Node SQLite (migration, rollback, uniqueness, idempotence). CI passed at source `9e5c9f346e49dded510222eb75e3c0b5a25df0b5`: https://github.com/anevum/anevum-web/actions/runs/39410025539 (66/66 tests, plus staging probe).
3. Created table `anevum_package_creator_links` and handle index **only** in isolated package staging D1. After write, verified exactly seven package tables, zero creator links and columns `owner_id, handle, profile_created_at, creator_proof, verified_at`. Existing accounts, XP, canonical member profiles and project records unchanged.
4. Cloudflare `Version Upload` compiled exact source `9e5c9f346e49dded510222eb75e3c0b5a25df0b5` of package controller with **strictly inherited** AUTH/DB/MEDIA/secret bindings and an explicit plain-text `PACKAGE_CREATOR_GALLERY_ENABLED=false`. Inactive candidate version `db278858-d2ba-41a2-ae6a-ec0ca39cc1f0` was checked against prior deployed version and stage DB table count.
5. Deployed candidate `db278858-d2ba-41a2-ae6a-ec0ca39cc1f0` at 100% on the **isolated staging Worker** `anevum-package-alpha-v003-control` ONLY. Immediate rollback version `b3a96f61-f007-4382-98f0-21d8c0dd6623`; deployment ID `96064d1c-a597-4e5e-b258-f51c6c8c4b1c`. The separate code-execution runtime remained unchanged at `42781269-b4a8-4be9-b809-54f11b9519db`.
6. External HTTP verification confirmed stage controller health has `schemaReady=true`, `storage=true`, `runnerConfigured=true`, `uploadReady=true`, `publicPublishingEnabled=false`, `runtimeLiveVerified=false`. Staging `/upload/v3` clearly remains preview-only and does not accept member authentication or actual uploads; public catalogue is empty; guessed creator gallery returns 404; isolated runtime health is OK and cookieless.
7. Read-only binding audit shows package controller's AUTH internal service targets `anevum-apex-prelaunch-gateway`, whose active Worker is in canonical apex mode (`ANEVUM_CANONICAL_APEX_ENABLED=true`, `ANEVUM_CANONICAL_STAGE_ENABLED=true`, schema approved). This supports the architectural choice of `https://anevum.com/api/v1/member/...` within service binding; it does **not** constitute a successful real signed-in A/B/C upload. Canonical issuer proof HMAC source is in the V091 companion draft PR #567, not yet deployed, and its new secret/flag are not provisioned.

## CI and ownership controls

- Backend unit/security/DB migration suites: 66/66 passed at `9e5c...`.
- Backend owner/private/public gallery contract requires verified canonical account ID and its issuer-generated HMAC over account ID/handle/profile creation time. A recycled handle and matching timestamp are insufficient.
- The UI is separately under V091 draft PR #567 and remains hidden by `VITE_PACKAGE_CREATOR_GALLERY_V010` OFF. Focused frontend gallery/proof suite 10/10 passed; the wider V091 verify job has an unrelated pre-existing staff session transport failure and is **not** treated as green.
- No changes were made to `anevum.com/upload*`, `anevum.com/play/*`, current unified-route owner, main/site Workers, actual users, player cards, XP, permission grants, published projects or live D1.

## Uncompleted release gates

1. Safely integrate the canonical proof issuer from V091 and provision a **new distinct** canonical HMAC secret on a controlled stage. Do not reuse Better Auth session secret, read back plaintext secret, or enable it in production based on this draft.
2. Verify real member A upload of rights-cleared ZIP + real cover, independent reviewer B playtest/review, guest C public game (after separate code-execution safety acceptance), update v2 preservation, suspension/removal and revoke all asset URLs.
3. Verify host header, authenticated cookie, CSRF and canonical account identity through the actual Cloudflare service binding, not synthetic session fixtures.
4. Verify iPhone Safari touch, 320/390px layout, audio, fullscreen exit and mobile file picking in an actual live browser.
5. Address existing V091 staff-session CI failure independently; finish approved deployment route integration into current member space and public wall without duplicating identity or published projects. This must remain gated by `PACKAGE_CREATOR_GALLERY_ENABLED` OFF, `PACKAGE_PUBLIC_PUBLISH_ENABLED` OFF, `PACKAGE_CANONICAL_BRIDGE_ENABLED` false and `PACKAGE_IDENTITY_BRIDGE_VERIFIED` false until acceptance.
6. Preserve the captured stage Time Travel bookmark and prior Worker version as rollback references. In-memory SQL rollback rehearsal is not equivalent to a real staging database restore drill; that remains an operational acceptance step.

**This stage rollout is infrastructure preparation, not a public upload launch or authorization to publish code.**
