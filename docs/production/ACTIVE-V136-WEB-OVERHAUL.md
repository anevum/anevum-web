# ACTIVE — ANEVUM PARITY V136 unified website overhaul
Session: `ANEVUM.WEB.UPDATE.2026-10-25.001.SITEWIDE-OVERHAUL-SYNCHRONIZATION`
Updated: 2026-10-25
**Current owner workstream: PR #735 — Concept Convergence II.**
**Sitewide contributions: PR #737 / V136.018–.021; divergent source branch, not yet incorporated into #735.**
Status: DRAFT ENGINEERING; **NOT released, owner-approved, or deployed**.

## Read this first
This is the active handoff for the October 24–25 sitewide overhaul. It supersedes earlier
*priority* assumptions that more decorative art, speculative procedural scenery, new
model detail, or theoretical platform redesign should precede the actual usable UI.
Do not delete existing useful Studio, WebGL, auth, member, and publishing work to
re-implement it. Prior V136 concept boards remain the visual acceptance target.

The active design priority is an exceptionally polished, cinematic, dimensional,
AAA-game-inspired **functional Continuance Institute interface** with real navigation,
data, creation tools, profiles, responsive/TV/controller behavior, and verified
interactions. Do not simulate fictional creators, activity, achievements, files,
social proof, or published work to make it look busy.

## LOCKED PRODUCT RULES
1. **Remove ANEVUM-owned AI-generated decorative artwork and filler from live UI.**
   Do not remove genuine user uploads or approved first-party modeled 3D geometry.
   The V136 arrival uses native HTML/CSS optics and the existing real Three.js
   renderer. Historical promotional bitmaps retained in Git history do not belong
   in live public bundles; audit additional legacy paths before claiming total
   sitewide retirement.
2. **Creator thumbnail FIRST; native type default SECOND.**
   If an already reviewed public API supplies the canonical uploaded cover, use
   the genuine creator thumbnail. For absent, rejected, or broken covers, use one
   deterministic hand-authored category SVG from
   `creator-v1/web/public/assets/default-thumbnails/` through the shared
   `ProjectThumbnail` component. Never show an invented user screenshot.
   Do not use a general SVG fallback in place of an available valid upload.
3. **Keep the media boundary honest.** The approved browser package API exposes
   public cover URLs; the older public Project DTO does not. Legacy project cards
   use type defaults until a separately designed ownership/review/storage/API
   change. Do not infer media from private uploads or expose unapproved URLs.
4. **Identity is real.** Uploaded avatar/banner first; a broken avatar becomes
   the existing native OrbitalMark; a broken/missing banner reveals the
   native CSS cover. Preserve original image storage, crop/editor functions,
   server-side public/private visibility, verified badges and earned XP only.
5. **Public space navigation is functional.** The public profile anchors link
   to real wall, biography, earned recognition, and approved package gallery
   only when the gallery is enabled. Community and Discovery use actual
   moderated/published APIs, real creator channels and actual category data.
6. **Concept fidelity with product function.** Reconcile the V136 homepage,
   Discovery, Community, public/private member spaces and Creator Studio
   with the approved October 24 visual boards, including high-definition
   spatial panels, practical typography, focus affordances, responsive layouts,
   reduced-motion and eventual gamepad input. The working Studio editor, file
   glyphs, Monaco, live local preview, hierarchy, diagnostics and source
   operations must remain fully usable; no full restart or decorative art pass.
7. **Keep release gates closed.** Do not change account auth, permission, D1,
   moderation, uploads, payments, private media, or publishing privileges as an
   accidental part of this design pass. `VITE_PARITY_V136_HORIZON_QA` and
   `VITE_PARITY_V136_SHARED_SCENE_QA` remain release-forbidden.
   Strict V132 and PARITY source allowlists may reject broad unreleased UI
   integration, which is NOT an invitation to weaken them. No merging into
   main/production, traffic activation, or visual signoff without explicit
   release review and owner acceptance.

## IMPLEMENTED IN CURRENT DRAFT (verify exact head before claiming green)
- V136.017: homepage concept convergence, one shared WebGL context, reusable
  responsive Wayfinder, private Creator Studio file operations/Monaco/preview.
- V136.018: removed generated hero/category/poster paths, 25 promotional
  raster files in the explicit retired groups, optional raster visual kit,
  native arrival and shared native category index.
- V136.019: ten 1600x900 hand-authored SVG type defaults, verified
  uploaded-package cover precedence and a shared fallback component.
- V136.020: legacy screenshot harness updated from deleted poster imagery
  to the native arrival/real WebGL; compiled Community test now expects no
  decorative hero picture and verified type default cards.
- V136.021: public profile section index and identity layout; native
  avatar/banner error handling without changing the media APIs.
- V136.021 QA: loopback browser fixture permits exactly the ten reviewed
  static default SVG paths; no wildcard media access.
The separate Open Signal PR #736 is a sibling: it is **not** implicitly
included and requires its own branch reconciliation and acceptance later.

## NEXT WORK, IN ORDER
1. Confirm the consolidated exact-head source tests and browser screenshots,
   especially Community 1440/390/320, the native 3D handoff, homepage 1920
   and Studio 1440/390/320, keyboard/touch behavior, contrast and no overflow.
   Fix real failures without replacing them with watered-down assertions.
2. Inventory remaining active image references across all deployed/public
   variants, historical style layers, unused asset packs and preview workers.
   Remove only identified ANEVUM decorative generated images; retain authored
   geometry/materials, actual uploads, legitimate preview content, earned media.
3. Continue **functional** Discovery category browsing, filtering, display
   density, cards and creator identity presentation; actual Community feeds,
   member directories and public/private personalized profile panels.
4. Improve Creator Studio UI fidelity using the approved reference boards,
   including editor layout, viewport, file explorer, real icons and navigation;
   preserve actual source transformations and security sandbox.
5. Do real screenshot/art direction review at desktop/tablet/320–390 phone,
   reduced motion, and then physical Safari/Xbox only when available. Do not
   claim final AAA visual parity, device frame rate, or production approval
   from synthetic loopback fixtures.

## DEFINITIONS AND SOURCE-OF-TRUTH
- **Design authority:** approved Oct 24 V136 boards referenced in PR #714,
  and the V136.017 concept convergence notes.
- **Active implementation:** #735 owns the latest baseline; #737 remains a divergent
  sitewide contribution. The reviewed draft assembly is on
  `integrate/unified-continuity-20261025-001`, with #736 Open Signal included
  explicitly. No source branch, history, main or production merge occurred.
- **UI and category media:** `creator-v1/web/src/parity/sitewide-interface-v136.css`,
  `creator-v1/web/src/components/ProjectThumbnail.tsx`,
  `creator-v1/web/src/lib/project-thumbnails.ts`.
- **Community/profile:** `creator-v1/web/src/pages/CommunityPage.tsx`,
  `creator-v1/web/src/pages/Phase1PublicMemberPage.tsx`,
  `creator-v1/web/src/components/MemberSpaceDashboard.tsx`,
  `creator-v1/web/src/components/MemberPortrait.tsx`.
- **Studio/WebGL:** `creator-v1/web/src/parity/StudioSpatialWorkspaceV136.tsx`,
  `creator-v1/web/src/parity/CinematicArrivalV136.tsx`.
- **Evidence:** `creator-v1/test/parity-v136-integrated-overhaul.test.mjs`,
  `creator-v1/test/parity-v136-thumbnails.test.mjs`,
  `creator-v1/test/parity-v136-member-world.test.mjs`,
  `creator-v1/test/parity-v136-full-browser.mjs`.
- **Detailed history:** `docs/production/parity-v136-concept-convergence-20261024.md`,
  `docs/production/parity-v136018-sitewide-visual-retirement-20261025.md`,
  `docs/production/parity-v136019-creator-thumbnail-fallback-20261025.md`.

For every next UI development checkpoint: update this active document, the
main draft PR body, and test/screenshot evidence; distinguish *implemented*,
*QA verified*, *pending*, and *production released*. Keep draft until accepted.

## Unified continuity correction — 2026-10-25
Coordination authority: `ANEVUM.ANEVUM.PACKAGE.2026-10-25.001.UNIFIED-WORKSTREAM-CONTINUITY`.
Read [the public-safe continuity index](ANEVUM-MASTER-CONTINUITY.md) before continuing.
The previous statements that #737 was already consolidated into #735 were
contradicted by current commit ancestry. The draft integration ports inspected
#737 changes onto #735 `988b7447`, preserving newer Community/Boards behavior,
and adds the six-file #736 delta from `d449d5a6`. Shared ProjectThumbnail replaces
all remaining deleted CategoryCover callers. Profile anchors, uploaded media
fallbacks and release restrictions remain. This is NOT released.
Local typecheck, default/full frontend builds and 113 targeted tests passed.
Browser acceptance is pending CI: no local Chromium is installed, its download
failed, and Work native browser cannot reach loopback. Live native-browser
observations are of the deployed V136 homepage/Discover, not this candidate.
