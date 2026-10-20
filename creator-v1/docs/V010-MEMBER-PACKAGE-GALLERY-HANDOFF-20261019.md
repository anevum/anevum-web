# ANEVUM Creator Uplink V010 — Member Space and Public Wall Gallery

Session: `ANEVUM.WEB.BUILD.2026-10-19.006.MEMBER-SPACE-PACKAGE-GALLERY`
Parent: V091 Continuance Experience integration, PR #554
Backend dependency: V010 canonical creator-link API, PR #564, based on merged V009.
Status: **DRAFT SOURCE ONLY / UI OFF / NO PRODUCTION DEPLOYMENT**

## Product contract

ANEVUM members make their finished static browser games/apps in external AI coding tools, export a browser-ready `.zip` with root `index.html`, or one standalone `.html`, and use the same canonical ANEVUM member session to upload. Reviewers approve executable releases independently. Only approved releases can appear on a member's public wall.

The member wall is not a second Creator Studio or new account system. We reuse V091's existing `MemberSpaceDashboard` and `Phase1PublicMemberPage` and keep all existing posts, player cards, XP, emblems, community and moderation controls intact. Public project links navigate directly to the existing unified upload route owner `/upload/v3/play/:id`. A React SPA route is not substituted for this Worker-hosted player.

## Implemented opt-in UI

- `web/src/lib/creator-package-gallery-v010.ts`: strict read-only client for `GET /upload/v3/api/v1/packages/mine` and `GET /upload/v3/api/v1/packages/creators/:handle/projects`. The owner request includes the existing same-origin HttpOnly session; public wall requests explicitly omit credentials.
- All data and links are validated. Only exact first-party, versioned cover URLs and playable release URLs are accepted. No arbitrary `https://`/protocol-relative links, script URLs, query-string preview capabilities or invalid UUIDs can be rendered as public play actions.
- `web/src/components/CreatorPackageGallery.tsx` shows real, approved creator PNG covers where available and a clearly institutional record plate otherwise. No fabricated game images, XP, ratings, view counters, purchases or automatic publication.
- Public member `/@handle` world gets an approved-release gallery following the existing wall content. It does **not** show draft projects.
- Own member `/member?tab=creations` gets a private library tab with draft/review status and links to the already implemented author-only private preview. This is not a public wall disclosure.
- Distinct desktop and 320–390px mobile cards with accessible 44px links, responsive cover cropping, reduced-motion, contrast and long-title wrapping.
- Backend unavailable/404 responses do not create fake content; missing public profiles and disabled feature requests remain indistinguishable.
- Opt-in frontend flag `VITE_PACKAGE_CREATOR_GALLERY_V010=true` is **OFF by default**. Do not enable the UI until backend creator identity, review, content safety and isolated runtime are accepted.

## Source and automated evidence

- `creator-v1/test/package-gallery-v010.test.mjs`: URL/path validators, safe public vs private cards, credential omission, owner cookie handling, disabled/private account response, and V091 mount verification.
- Existing `creator-v1-verify.yml` now runs the targeted V010 test alongside the established V091 frontend type/build, original visual and member tests.
- Must inspect exact-head CI before advancing. This draft does not claim authenticated iPhone Safari, actual game ZIP playback or deployed creator-wall integration.

## Security and identity gates remaining

1. **Canonical ownership proof**: this branch now implements a disabled-by-default HMAC-SHA-256 subject proof in the canonical profile issuer (`canonical-auth/package-proof.mjs`). The separate package backend PR #564 requires the same issuer-generated proof for public attribution, so reused handles and coincident profile timestamps cannot transfer published releases. Deploying the proof requires a distinct `CANONICAL_PACKAGE_PROOF_KEY` secret and explicit `CANONICAL_PACKAGE_PROOF_ENABLED=true` on the canonical issuer, plus controlled staging and real account collision tests; neither flag nor secret is configured here.
2. Real creator A / independent reviewer B / anonymous visitor C on controlled staging, with the actual single-sign-on session, private preview, approved gameplay, version replacement, suspension and takedown.
3. Confirm canonical profile changes, deletion and private visibility revoke attribution immediately. No username- or email-based trust fallback.
4. V091 mobile acceptance on iPhone Safari and desktop with real release covers, script/game loading, keyboard, audio unlock, fullscreen and Exit.
5. Release target must be the existing approved V091/production workflow, not a new Worker route. No data migration or public publisher activation based on this UI-only change.

## Dependencies and separation

PR #564 is the backend creator link API and optional handle gallery, kept draft. PR #554 is the ongoing V091 shell. This branch adds only an opt-in read-only UI to V091. Neither PR is merged by this handoff. Targeted TypeScript/build and gallery/proof tests are required, and any inherited V091 CI failures must be tracked independently; no production flag, storage write or route change is authorized.
