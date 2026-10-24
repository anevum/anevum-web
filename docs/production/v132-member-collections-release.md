# ANEVUM V132 — V131-backed Member Collections candidate

Session: ANEVUM.WEB.RELEASE.2026-10-23.003.V132-COLLECTIONS-CANDIDATE

Status: **Reviewed offline release candidate in progress. Not uploaded, not traffic-shifted.** Follow issue #325 and PR #688.

## Objective
Deploy the owner-approved simpler organization and lists without replacing the live V131 Worker backend, personal accounts, earned Evolution artwork, IREN, Uplink Pilot, or existing assets.

## Exact inputs
- Owner accepted production V131 source: `ad0d3aef473e12c124b003d2c3bb45b79bff520e`.
- Reviewed My Collection UI head: `84c634f5677beaf0ef842281285f7ca537f64fba`, draft PR #688.
- Immutable V131 Worker gateway SHA-256: `1884ff0dd3c8aa3d38711167af0b4552c9b200b3148e72d9ba6d90d23171ef99`.
- Retained V131 complete artifact 12526930761 from GitHub run 40011027824. Contains 395 public assets including exactly 152 earned Evolution files, plus the paired Worker gateway.
- Current Cloudflare public pair should remain at 100%: apex version `44f5971b-4cc9-4e7e-ab6a-1adb6fc5c12e`; controller `b3043430-d957-441d-936a-9928c7d1a15c`. Original rollback retained.

## Scope
Ten exact reviewed UI files: saved-library list/categories, My Collection navigation, compact profile tools, earned-only vault list controls and separate Evolution/Awards destinations. Supporting pure tests/docs are copied unchanged from #688. No Commons #679 React implementation or XP-engine PR #680 is bundled.

Build with verified V131 frontend flags ON (IREN, native Creator Studio pilot, package gallery) and new `VITE_MEMBER_COLLECTION_NAV_REVIEW=true`. This is a build-time UI flag; it never grants XP, awards, access or database capability. The normal build is explicitly tested with flag false.

## Gates
1. Source is descendant of immutable accepted V131, and every copied file has the same git blob hash as PR #688. No other application/Worker/DB changes.
2. Node tests + full TS check + both frontend builds pass.
3. Real compiled 1440/390/320 browser acceptance, guest/disabled capability, earned-only inventory and first-load/IREN root smoke.
4. Overlay reviewed frontend onto retained sealed V131 web assets. Preserve original Worker gateway byte for byte and all 152 earned artworks with identical digests. Keep all old hashed static assets needed by previously served HTML.
5. No-token Wrangler dry-run + sealed manifest, inspect compiled visual evidence.
6. Only after offline gates: fresh Cloudflare GET-only provider version/deployment/settings/route and 26-binding/13-controller binding snapshots, source-bound **inactive** immutable upload with preserved secrets and 0% traffic, no workers.dev/previews/routes, and independent postflight proof.
7. Actual protected candidate authenticated founder/member/guest/role acceptance, physical iPhone Safari and VoiceOver acceptance, no duplicate IREN, private saved-list verification, player/Uplink pilot, and explicit owner go/no-go.
8. Controller stays fixed if exact V131 gateway bytes are preserved. Any backend/version change requires separate review. Only then consider controlled public traffic promotion; retain V131 as instant rollback.

Do **not** treat passing source-only or synthetic browser CI as production authorization. No D1 migrations, XP minting/testing/reset or Creator Studio publishing flags. Failure at any stage leaves production on V131.
