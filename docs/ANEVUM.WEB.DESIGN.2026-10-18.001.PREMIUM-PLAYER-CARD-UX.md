# ANEVUM V078 — Premium Player Card UX

Session: `ANEVUM.WEB.DESIGN.2026-10-18.001.PREMIUM-PLAYER-CARD-UX`  
Date: 2026-10-18  
Branch: `design/player-card-premium-v078-20261018`  
Parent implementation: V077 `patch/evolution-player-card-illustrations-v077-20261018`

## Approved visual direction

The founder identified two transcosmic ANEVUM player-card concept boards as the preferred UX reference: midnight/navy glass, luminous collectible art, portrait with accented halo, clear name and handle, earned level, progress, distinct earned badges, compact variants, and a large 3D pop-out collectible inspector. They are **design references, not functional mockups or accepted catalogue definitions**.

The concept boards contain invented sample names, some altered level labels, example people/statuses, and false engagement counts. None are allowed to become source-of-truth website data.

### Locked invariants

- **Evolution of Everything:** 30 original canonical specimen identities, XP thresholds, and entitlement logic. V077 provides the separate stable, frontal 2D card art. Keep actual V059/V076 native 3D geometry and stage for the earned collectible viewer.
- **Earned only:** current canonical D1 progression checks protect art/media. Public profile visibility and `showStats` preference control whether current level and XP are displayed. All unreached level names and images stay out of normal UI.
- **Badge and distinctions:** at most three selected/latest server-earned badges, independently verified medals/ribbons, optional constellation identity and supporter appearance.
- **No dummy profiles, online indicators, invented follower counts, fake achievements, manually awarded XP, mock media or synthetic stats in production.**
- **Single identity component:** `CompactMemberIdentity` / `PlayerCard` remains the common source for creator credits, forums, threads, member cards, project cards, directory and public profile.

## Implementation

- `creator-v1/web/src/components/player-card-premium-v078.css`: navy optical glass system, restrained accent and aura, bright earned media, portrait halo, award presentation, capped responsive artwork, featured current-level visual.
- `CompactMemberIdentity.tsx`: premium featured composition (real avatar / handle / server-approved level illustration / authentic recognition). Optional XP display requires *matching* verified level and internally consistent numeric bounds; hides completely when not provided. This uses only the existing card component; no new independent identity system.
- `Phase1PublicMemberPage.tsx`: passes existing visible server `space.stats` to featured identity. Absence of stats means absence of progress/art.
- `PlayerCardStudio.tsx` and studio stylesheet: live featured, compact and inline previews of the same owner's current saved recognition and profile. All previews are non-navigating; all badge selections are still verified and saved through existing APIs.
- `RewardInspector.tsx` and earned-rewards stylesheet: the full native earned 3D model is given a wider framed pop-up with compact desktop side controls and mobile bottom controls, without replacing rotation, pause, zoom, reset, scene loading, authorization or accessibility.
- No modifications to model geometry, XP routes, member database, authentication provider bindings, homepage, staff/admin, deployed Cloudflare versions, redirects or production routes.

## QA

- `creator-v1/test/player-card-premium-v078.test.mjs`: verifies real identity bindings, valid progress, shared contexts, native inspector and responsive/reduced-motion CSS.
- `creator-v1/test/player-card-v078-live-react-browser.mjs`: loads the actual production-built React public member page from a loopback HTTP server with **explicitly isolated, test-only data**; checks desktop and phone screenshots, earned level 4 media delivery and strict SVG CSP, current XP math, hidden-statistics and private-profile access, no unreached asset requests.
- `.github/workflows/player-card-v078-premium-qa.yml`: runs repository unit tests, TypeScript check, Vite production build, real React visual QA and client bundle leakage guard; exports desktop/phone screenshot artifact.
- Original V077 auth and Level 4 art regression tests remain in scope.

## Release hold

As of 2026-10-18 the public apex Worker is operating under incident `ANEVUM.OPS.INCIDENT.2026-10-18.001`, with a homepage fallback used to shield a crashing feed. **No deployment of V078 or V077 should replace that recovery version** until the incident owner reconciles production source/configuration, validates current live homepage behavior and independently verifies bindings, then promotes via a guarded versioned Worker/asset transaction with rollback.

**Separate creative acceptance:** even after V078 UX tests pass, V077 plate art is dimensional SVG, *not the photorealistic imagery in the concept references*. Do not describe the visual artwork overhaul as fully complete until high-resolution level imagery itself is artistically approved. Prevent a gallery of unearned specimen images in public UI.
