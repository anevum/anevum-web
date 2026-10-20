# ANEVUM Creator Uplink V009 — Canonical Unified Route Bridge

Session: `ANEVUM.WEB.BUILD.2026-10-19.005.CANONICAL-PACKAGE-NAMESPACE`
Parent: V008 isolated staging; PR https://github.com/anevum/anevum-web/pull/516
Status: **V009 source and Cloudflare compile-only candidate. NOT DEPLOYED / NOT AUTHORIZED FOR PUBLIC ZIP UPLOAD.**

## Locked purpose

Connect finished browser-build ZIP/HTML publishing through the EXISTING ANEVUM `anevum.com/upload*` route owner, with existing canonical accounts and one high-definition Continuance interface. Do not create another public studio, replace `/upload`, move `/play/*`, build a game engine, or claim any new game/creator identity before authorization.

## Verified current ownership

- Original unified Worker `anevum-unified-creation-routes-v002` owns `anevum.com/upload*` and `anevum.com/play/*`, with its original `DB` and `UPSTREAM` Cloudflare bindings. Active production version: `3cef3fe8-bb67-4edf-a7f6-9b5ccecb3b7a`, 100%.
- The actual deployed V002 `index.mjs` was recovered read-only and pinned as `site/alpha/v003/unified-creation-v002-pinned-snapshot.mjs` for lossless parity testing. This file was not extracted from or written to a member database.
- The existing V091 site still has Creator Studio `/studio`, public project `/projects/:id`, `MemberSpaceDashboard` and user profiles. Its private Studio ZIP attachments are *quarantine records*, not executable published ZIPs. Do not confuse or silently migrate them.
- The control and runtime staging Workers from V008 remain on their isolated D1/R2 and their separate workers.dev hostnames. No production route was moved.

## Implemented source

- `unified-creation-bridge-v009.mjs` intercepts ONLY `/upload/v3` and its explicit nested paths. Internal API, project player, staff review and cover URLs are rewritten under the existing upload subtree, not registered as new top-level public routes.
- Route map: `/upload/v3` -> package uploader, `/upload/v3/library` -> package catalogue, `/upload/v3/help` -> format guide, `/upload/v3/review` -> existing independent package review queue, `/upload/v3/play/:uuid` -> isolated package-player shell, `/upload/v3/api/v1/packages/*` -> package API.
- `unified-creation-owner-v009.mjs` decorates a selected exact existing V002 Worker and returns UNRELATED route requests unmodified. Package errors cannot redirect a request into the older alpha handler.
- `unified-creation-candidate-v009.mjs` imports that decorator and the pinned existing live owner. This candidate is source-controlled and independently CI tested.
- The bridge preserves the canonical member Cookie only across the private Cloudflare `PACKAGE_CONTROL` Worker-to-Worker service binding. It drops spoofable Authorization and identity/role headers; no browser-to-workers.dev proxy or new cookie issuer is created.
- Strict origin/fetch-metadata checks apply to POSTs. Backend remains authoritative for member verification, CSRF, pilot/role checks, rights receipts, reviewer independence and all executable status transitions.
- Backend CSP and isolated executable origin are preserved while internal links and cover URLs are adapted to the existing namespace. Backend redirects and malformed responses fail closed, without disclosing stage Worker locations.

## Default-OFF Cloudflare compile-only evidence

- Compiled exact source commit `9a4a37fa2c9fa6e5e98eb0a0ca5107cc56cf1e14` via Cloudflare Worker **Version Upload**, creating inactive version `777b160b-fb88-4ee0-9441-feaebd4508b6` of `anevum-unified-creation-routes-v002`.
- Candidate bindings: inherited `DB` and `UPSTREAM`; one internal `PACKAGE_CONTROL` service binding to `anevum-package-alpha-v003-control`; and TWO plain-text guards `PACKAGE_CANONICAL_BRIDGE_ENABLED=false`, `PACKAGE_IDENTITY_BRIDGE_VERIFIED=false`.
- Cloudflare read-after-upload verified this candidate exists, has those exact bindings and annotations, while the ACTIVE production deployment still serves old V002 version `3cef3fe8-bb67-4edf-a7f6-9b5ccecb3b7a` at 100%. No deployment action was called.
- No new Cloudflare route was created; no live Worker traffic, member data, uploaded assets, XP, published games or staff permissions were changed.

## Automated evidence

- Exact source verification before this documentation change: https://github.com/anevum/anevum-web/actions/runs/39352196893
- Node/SQLite/R2 security + owner parity + package-controller namespace E2E: **57/57 passed**.
- Chromium V005/V006 interface tests passed on 320, 390 and 1440 px, including native file selection, project cover and mobile action layout.
- Original deployed V002 `/upload`, `/play/:id`, published play redirects, `/alpha`, old alpha API POSTs and unmatched public paths were compared byte-for-byte to the wrapped V009 candidate using synthetic upstream data.
- Auth integration test calls the actual package controller through the bridge using synthetic canonical verified creator and separate reviewer identities. It verifies unauthorized requests and forged identity headers cannot grant access. It is NOT real production credential acceptance.

## Remaining release gates

1. Canonical authentication: with consented real member A and independent staff B in a controlled stage, prove `AUTH` service binding resolves the active canonical session and cannot import unrelated/revoked identities. Do not make the boolean `PACKAGE_IDENTITY_BRIDGE_VERIFIED` true based solely on synthetic tests.
2. Execution and moderation: actual safe rights-cleared ZIP → immutable private preview → staff independent review → publish → anonymous C execution → update v2 without disrupting v1; prove suspend/deletion/takedown, network/CSP, MIME/range, and storage cleanup.
3. Real iPhone Safari and Android/desktop: keyboard/touch, file picker, restart, portrait/landscape, audio unlock and fullscreen exit.
4. Canonical identity and project discoverability: approved package releases must link to the verified member's existing wall and player card and to a single approved `/projects/:id` record, not appear as a second unrelated user/database identity. This requires a reviewed cross-store/publication contract; do not invent a mapping using usernames or email.
5. V091 quality: preserve the high-definition Continuance shell and IREN and test the mixed site navigation, creator cards and accessibility on the actual app, not only separate synthetic HTML.
6. Release: review currently active production V002 and stage versions, backup/rollback and abuse controls; then explicitly authorize the separate guarded deployment. NEVER set both flags to true or enable `PACKAGE_PUBLIC_PUBLISH_ENABLED` from this draft alone.

**V009 improves architecture and safety but does not yet mean the ZIP uploader is available to signed-in creators at anevum.com.**
