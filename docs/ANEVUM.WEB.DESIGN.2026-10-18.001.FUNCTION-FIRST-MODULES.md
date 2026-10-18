# ANEVUM / V073 — Function-first modules, no decorative content filler

**Session:** `ANEVUM.WEB.DESIGN.2026-10-18.001.FUNCTION-FIRST-MODULES`  
**Date:** 2026-10-18  
**Parent source:** `patch/player-recognition-catalog-v069-20261017-018` (V069 player recognition)  
**Review branch:** `design/function-first-modules-v073-20261018-001`  
**Status:** Source-only visual/interaction review. Not a deployed ANEVUM release.

## Problem

The prior public homepage led with a large cinematic transmission hero, followed by four oversized illustrated genre cards, then four glossy status cards. A visitor had to move past presentation before discovering useful work, people and activity. Artwork could falsely communicate that a catalogue was populated even when no approved projects existed. The approach also multiplied moving and glowing visual layers without improving tasks.

The design goal is **distinctive, handcrafted interaction rather than interchangeable AI-looking illustrations**. The Continuance Institute atmosphere, ANEVUM Orbit identity, Evolution specimens, earned levels, and universal player-card direction remain part of the platform. They do not need to occupy every module or block a visitor's next action.

## Implemented

### First contact: four useful doors

The homepage now leads directly with one responsive, keyboard-accessible module navigator. Four real entries remain:

- **Play** — filtered approved games, an actual released game preview when present, and interactive learning.
- **Discover** — latest approved public work and a short path to apps, art and open source.
- **Connect** — verified creators, genuine reviewed conversations where the backend enables them, public reading when posting is gated.
- **Create** — canonical `/studio` access; private drafts and reviewed public publication remain distinct. An ordinary visitor is never falsely promised publishing access.

The chosen module shows one strong description, one truthful record/availability panel and one direct action. No image, canvas, autoplay, fake score, fake audience, sample creator, or decorative 3D model is emitted from this navigator.

### Current activity: one focused workbench

The old four competing `av8-module` cards are now selected one at a time through a separate accessible workbench: **New work / Conversations / People / Index health**. Each reuses the existing public API reads and independently approved records; no member privilege, publish setting or backend route changes.

The older orbit decoration inside Index health is removed. Styling is flat, readable, responsive, and purpose-specific, while preserving the site's type and dark transcosmic palette. Keyboard arrow keys, Home/End, visible focus, reduced-motion and forced-color rules are included.

### Files touched

- `creator-v1/web/src/pages/CinematicLandingPage.tsx`: remove hero from first-contact render; connect approved records to the four doors.
- `creator-v1/web/src/components/WorldGatewayDeck.tsx`: redesign as real module navigation.
- `creator-v1/web/src/components/LiveSignalHero.tsx`: retain historical exported hero but replace live four-card index assembly; no change to existing public data adapters.
- `creator-v1/web/src/module-experience-v073.css`: scoped appearance, 320–1440 responsive priorities, keyboard focus, contrast, reduced motion.
- `creator-v1/web/src/main.tsx`: import scoped stylesheet after historical styles.
- `creator-v1/test/module-experience-v073.test.mjs`: module-source and access truth contracts.
- `creator-v1/test/cinematic-depth-v011.test.mjs`: new public hierarchy.
- `creator-v1/test/capture-community-hub-v007.mjs` and `creator-v1/test/capture-sitewide-v012.mjs`: revise historical visual acceptance to assert useful working modules rather than removed image carousels.
- `creator-v1/package.json`: wire targeted contract into `npm test`.

## Preserved boundaries

1. Public projects/creators are sourced only from existing approved public API results. Error, empty and loading states cannot fabricate network activity or proof.
2. The existing public community feature flag controls conversation availability; there are no changed moderation privileges or simulated public comments.
3. Studio stays under existing canonical authentication and publication controls. No publishing permission is unlocked.
4. No Cloudflare route, Worker, D1 schema, Resend secret, runtime entitlement, player XP/badge ledger, real upload, financial or staff authority change is in this patch.
5. No production deployment, creator content publication or database mutation is authorized by a passing visual review.

## Acceptance gates

- `npm run check:creator-v1-web` and both public / staging builds.
- `cd creator-v1 && npm run test:modules`, existing V009/V011 integration and Creator V1 suite.
- Synthetic/offline browser checks at **1440, 1024, 390 and 320 px**, including first viewport visibility, no horizontal overflow, Play/Connect/Create route switching, real approved-record previews, keyboard navigation and one active status panel.
- Visual review of actual rendered screenshots, including long strings, honest empty/error states, focus state and mobile safe-area behavior.
- Manual Safari iPhone, keyboard and assistive technology acceptance before considering a promoted release.
- Current V069 production source/deployment/bindings must be reconciled before any proposal to merge or release. V070/V071 publication and safety features are separately gated.

## Deliberately out of scope

Sitewide restructuring of Creator Studio, the full Community and every user-owned profile; retiring all atmospheric assets in other experiences; rewriting Evolution level specimens; new community data, AI media generation or app functionality; turning off authentic creator artworks when there are real rights-cleared works to show.

**Design principle:** Every repeated module should answer “What is this, what is available right now, and what can I do next?” before asking the visitor to admire how it looks.

## Continuation / V073.2 — actual screenshot review and Discover correction

Visual inspection of the original passed V073 browser captures at 1440, 1024, 390 and 320 px revealed that first-contact modules are legible, but the linked **Discover** destination still inherited a tall cosmic illustration, cramped mobile search, oversized duplicated category side directory and repetitive generic category illustrations for every project. Passing layout tests alone did not make that destination usable.

This iteration therefore:

- Keeps the original immersive `PortalHeading` behind the explicit `immersive` prop for legacy experimental use, but the canonical `/discover` route now starts with a compact text introduction and a visible full-width search.
- Uses one category filter strip instead of category filters **plus** an almost identical sidebar directory. Counts are from the existing read-only `readCategories` API, not fabricated metrics.
- Moves the honest creator-declared free filter into the same search surface, retaining URL-driven `q`, `category`, `free` and cursor reset behavior.
- Provides an editorial project-card presentation only in the canonical Discover view, with real project title, summary, category, creator handle and actual project route. There is no inferred/generated cover when no rights-cleared project image exists; older default project-card presentation remains available elsewhere.
- Replaces the repeated empty-state graphic and implied future releases with a neutral empty result; distinguishes empty results from unavailable network data.
- Adds scoped responsive styling for readable 320-px search controls, a scrollable visibly hinted mobile category strip, and one-column mobile project records.
- Extends source-level and synthetic browser QA with no duplicated directory/artwork, 44-ish px controls, verified URL category/search roundtrips, and no horizontal document overflow at the four reference widths.

**Important:** Source changes are still a draft, not published. New browser evidence must be visually inspected rather than inferred solely from a green CI result. No public product content or moderation review settings changed.

## Continuation / V074 — existing level icons protected, unstable miniature engine retired

**User-approved locked design:** all 30 existing Evolution of Everything level icon designs, materials, high-resolution PNG/WebP exports, chapter names and XP thresholds remain unchanged. The instruction to avoid generic AI artwork **does not apply** to this established Evolution collection. Original level 04 artwork also remains unchanged, pending any separately authorized artistic revision.

The cross-site inline `LevelEmblem` presentation used to start a shared V062 WebGL miniature renderer that overlaid moving models on player cards and level galleries. This could let models escape their allocated cards, cover other elements or make the underlying poster invisible. This presentation is explicitly retired.

- `LevelEmblem.tsx` now displays the original optical image exports directly, with original 128px compact, 256px preview and 1024px poster fallbacks in a size-appropriate order. No runtime canvas, miniature shader import, fake earned state or arbitrary substitute image is introduced.
- `level-icon-preservation-v074.css` keeps the art contained within profile, player card, forum and level-gallery sockets; no rotating/tilting inline WebGL or drifting models. Image resolution, alpha transparency and faithful material presentation remain. Existing lighting and subtle card hover are acceptable when contained.
- `/evolution/` remains the dedicated native 3D animated collection. The standalone V062 mini runtime remains in source for archive experiments and shader regression tests, but it is **not mounted through the shared `LevelEmblem`**.
- `level-artwork-preservation-v074.test.mjs` checks the precise 30 sets of canonical image assets, unchanged archive links, static inline API, responsive containment, and absence of WebGL registration in the shared component.
- The V012 browser check now requires all 30 image hosts, an actual decoded high-resolution first specimen, no inline mini canvas, correct native artwork label, no animated drift, and icon containment at 320/390/1024/1440 pixels.

**Must not change:** original meshes, icons, preview/poster assets, XP/level state, badge and medal recognition, award permissions or the standalone full-resolution 3D archive.

**Release status:** review-only source candidate. Do not confuse passing synthetic browser QA with actual production deployment or iPhone Safari signoff.

