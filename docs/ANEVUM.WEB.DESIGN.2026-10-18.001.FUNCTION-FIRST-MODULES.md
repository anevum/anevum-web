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
