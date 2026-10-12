# ANEVUM — Approved Cinematic Identity

**Session:** `ANEVUM.WEB.BUILD.2026-10-11.001.CREATOR-PLATFORM-SEPARATION`  
**Owner approval:** “Oh that’s nice let’s do exactly that,” referring to the cinematic, orange/violet/blue multi-page creator platform concept generated 2026-10-11.  
**Status:** VISUAL DIRECTION APPROVED; this does not approve a public-domain cutover, real member onboarding, fake platform activity, new purchases, or changes to V5/RHEN.

## Locked visual direction

- Deep charcoal/near-black canvas and compact dark navigation.
- Original angular A mark with a warm gold/orange illumination and white ANEVUM wordmark.
- Strong orange primary buttons and active menu indicators, restrained violet/blue atmospheric accents.
- Cinematic illustration-led hero using the approved floating-city/creator concept.
- Artwork-led software cards: apps, tools, games, templates, automations.
- Distinct project detail pages, creator profiles, curated creator rankings and event/jam features.
- Compact mobile header, action controls and bottom navigation.
- Illustrated collectible emblems, visible levels/progression and community voting as the future product model.

Do not restart a generic flat dashboard, a traditional SaaS landing page, the rejected mint/lime color scheme or the earlier steel/amber prototype. The owner selected the *overall concept*, not the exact displayed fictional projects or numbers.

## Image and marks

The approved composite from the user conversation is the canonical visual reference. Cropped WebP imagery inside the 2026-10-11 Worker is **temporary art** extracted from the approved image and preserved in source-controlled Worker code. Do not reintroduce baked sample statistics or use full composite screenshots as an unclickable overlay.

The initial vector A mark is implemented in the preview. Final brand files must have light/dark/monochrome/favicon variants, tested for recognizability at 16–32px. Routine controls should retain a coherent icon vocabulary; collectible emblems should be recognizable objects, not the same icon with merely different borders.

## Experience requirements

The site should reward real discovery, meaningful feedback, creative contribution, completed projects and useful collaborations. Do not introduce purchased XP, paid vote weight, fake social proof, misleading urgency, punitive streak loss, or a voting system that deletes beginners' work automatically. Levels, moderation authority, paid support and project popularity remain separate.

## Current implementation

`next.anevum.com` serves the approved cinematic visual *prototype* as a separate Cloudflare Worker `anevum-community-preview`. The deployed source is `community-preview/worker.js` on `build/anevum-creator-platform-20261011`. The UI includes functional preview routing, filters/search, demo local voting, follows, bookmarks, draft form, and responsive views. All fictional data is prominently labeled. No real accounts, XP, project publishing, creator uploads, reviews, hosted apps or server-backed votes are deployed. Community D1 schema exists but is deliberately unbound.

Preserve `anevum.com` pointing at V5 until Backstage auth, migration, recovery, and explicit launch acceptance pass.
