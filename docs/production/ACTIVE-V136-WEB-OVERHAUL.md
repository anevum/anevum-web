# ACTIVE — ANEVUM PARITY V136 unified website overhaul
Session: `ANEVUM.WEB.UPDATE.2026-10-25.001.SITEWIDE-OVERHAUL-SYNCHRONIZATION`
Updated: 2026-10-25
**Owner development baseline: draft PR #735 — Concept Convergence II, head `888bf4cc` after #748 integration.**
**Current bounded continuation: V136.028 — public browse return paths, truthful project identity and Commons typography, stacked on draft #750.**
**Sitewide integration: PR #738 was merged into the #735 development branch, preserving selected changes from PR #737 and #736. Those historical PRs need no blind re-import.**
Status: V136.025 and owner-approved V136.026 are **IMPLEMENTED / VERIFIED DEVELOPMENT**, merged into #735. V136.027 remains **ACTIVE DRAFT / NOT released**. The sealed V136.024 controlled candidate in #741 is a separate release lane; consult provider receipts for actual traffic.

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
The Open Signal #736 source changes were explicitly reconciled in the unified
#738 integration; the sibling PR itself was not implicitly merged or released.
Do not duplicate those components on the current #735/#745 development baseline.

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
- **Active implementation:** #735 at `888bf4cc` owns the development baseline
  after reviewed #738/#741/#745/#748 integration. #750 Commons at `2bf7504c`
  and stacked V136.028 remain draft review work. #737/#736 are historical;
  their selected changes were reconciled through #738. Do not re-import them.
  #741 sealed release source `4dfaed54` remains a separate release lane.
  Development integration is not production promotion.
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

The a6837404 integration passed complete Node 22 regression (1,753/1,753) and
Creator V1 compiled captures. Full V136 screenshot review then caught Boards
Back-navigation leaving Games selected after the URL reset. A direct URL-owned
selection correction is in the next checkpoint; strict assertions remain.
Public UI/Boards/Open Signal checks run before GPU stress, with all old groups
retained. Release source guards remain closed; source-only draft #738.

## V136.023 — UI density and console clearance (draft)
Scoped session: `ANEVUM.WEB.UPDATE.2026-10-25.003.UI-DENSITY-AND-CONSOLE-CLEARANCE`.
Continues verified #738 `ba18a065` without modifying #735/#737/#736.
Removes the 220–330px former poster reservation above mobile arrival text;
retains native optics and actual inspect/route controls. Embedded public member
activity/forum panels use the existing Institute typography/materials. Normal
desktop console has a reserved left gutter; private source authoring retains
its full editor width. Phone/tablet focus and deep links reserve dock clearance.
Strict compiled checks cover heading/action placement, actual panel styles,
real console/content rectangles and focused mobile sharing controls.
No source, API, auth, account, WebGL architecture, permission, publication or
provider changes; no release allowlist changes. Local compiler/contracts pass;
exact-head CI and screenshot comparison remain required before acceptance.

V136.023 follow-up: `d9f0f300` passed Creator V1 verification, source editor,
mobile arrival and Commons checks. A Boards test raced the React commit after
the correct URL was set; the captured rendered DOM showed Games selected.
People/Games checks now wait for rendered selection and retain exact assertions.
All Back-navigation and remaining acceptance groups stay enabled; rerun at head.
Screenshot review additionally found the inspection status crossing the small
first-contact label on phones. The inspection control moves up, with a compiled
rectangle-clearance assertion; its existing 44px target is retained.

## V136.024 — integration and controlled production rollout
Scoped session: `ANEVUM.WEB.RELEASE.2026-10-25.004.CONTROLLED-UI-ROLLOUT`.
Owner now authorizes merging and controlled deployment. #738 reviewed head
`34ab7886` merged into this owning development branch at `b63109b4`, preserving
the verified tree and original rollback references. Main remains unchanged.
Prepare the existing sealed frontend-only V136 package on
`release/parity-v136-unified-ui-20261025-004`; require exact release-mode CI,
inactive upload receipts, backend/binding/route invariance and native-browser
verification before broad promotion. No experimental QA geometry/video flags,
private uploader/publication changes, financial operations or data migrations.
The next UI development slice remains creator-directory search/card/empty-state
convergence; keep ongoing development separate from the immutable release head.

## V136.025 — Creator Directory functional convergence (verified and merged to development)
Session: `ANEVUM.WEB.UPDATE.2026-10-25.005.CREATOR-DISCOVERY-CONVERGENCE`
Owner PR: [#745](https://github.com/anevum/anevum-web/pull/745)
Continuation branch: `build/parity-v136-creator-directory-20261025-025`
Development parent #735: `20161bae20e7f369d4d7edfadcb4316ecccac3cf`.

Implemented: real server-approved `readCreators` channel cards; URL-owned query,
cursor and Grid/List mode; Back/Forward restoration; new-search cursor reset;
honest per-page counts, empty/end-of-cursor and load/error states; accessible
native search and responsive 1440/390/320 layouts; zero invented published
creators and no generated filler thumbnails. Actual uploaded creator media,
profiles, approval/privacy and canonical backend behavior stay unchanged.
The short "Search creators..." placeholder avoids 320px phone truncation;
the search still has its explicit full accessible label.

**Verified prior stable source** `8e4fbc66`: 1,761/1,761 complete Creator V1
regression tests PASS; full six-viewport V136 compiled browser
[run 40211155640](https://github.com/anevum/anevum-web/actions/runs/40211155640)
PASS, 48 recorded browser checks including actual directory geometry at 1440
(3 tracks), 390 and 320 (1 track), zero JS exceptions and zero forbidden
network activity. Independent focused browser
[run 40212833188](https://github.com/anevum/anevum-web/actions/runs/40212833188)
PASS with [12 screenshots and JSON acceptance](https://github.com/anevum/anevum-web/actions/runs/40212833188/artifacts/12606154516):
real React/Vite UI, two labelled **synthetic loopback-only** test channels,
Grid/List, paging, URL history, searches, no results and no published creators,
without horizontal overflow. These records are not deployed production content.

**Current refinement**: search copy and guest XP copy now state
"30 CURRENT LEVELS" rather than suggesting a permanent product cap; existing
auth/progression runtime does clamp at 30 today whereas the locked longer-term
#337 product decision is uncapped with a first 60-artifact series. This
change does **not** implement uncapped progression or alter the XP ledger,
thresholds, awards or rate. #337 owns the backend/data reconciliation.
The focused browser's source receipt now pins the checked-out exact head
instead of GitHub's synthetic pull-request merge SHA.

Owner verified the V136.025 concept-phase directory after nine exact-head
functional and safety workflows passed on `fafa1d643c755cbbd2722f2391428f32a297e4bc`.
PR #745 merged **only** into the #735 development branch at
`9e1a82d250e0b5a2eca0f1555e3110cdba7c6dae`. Public release and physical
Safari/Xbox and signed-in A/reviewer/guest/B acceptance remain separate gates.

**Release isolation**: V136.024 immutable candidate #741, recorded V58/V59
traffic, provider settings, Stripe retirement draft #739 and main are untouched.
Targeted release source allowlist correctly rejects this development-only
source; do not add broad exemptions or promote traffic. #742 GET-only
public smoke received HTTP 403 before reaching the baseline app; no successful
production comparison is implied. Owner go/no-go stays under #333.

## V136.026 — public Discover URL/search/list convergence (active development)
Session: `ANEVUM.WEB.UPDATE.2026-10-25.006.DISCOVERY-LAYOUT-CONTINUITY`.
Implementation branch: `build/parity-v136-discovery-20261025-026`.
Parent baseline: exact #735 development merge `9e1a82d2` after #745.
Status: DRAFT SOURCE, **NOT released**; no owner visual acceptance yet.

Bounded functionality: the existing `DiscoverPage` owns approved public
`readProjects` and optional approved `readPackageCatalogue`. The Grid/List
selection is now URL-owned as `view=list` (Grid is the default), so shared
links and Back/Forward restore it; category/free/search/cursor changes preserve
view, while a genuinely new search/category/free selection clears stale cursor.
Reset preserves the current List setting. No new endpoints or data model.
Legacy and full-flag V136 paths share the same state and true index.
List means one compact, full-width approved result per row, with editorial
legacy project records and existing package-card compact presentation.
Creators' actual approved uploaded package covers remain Grid priority;
the existing first-party category fallback remains for missing media.
Real counts state 'approved published', not verified creator identities.
The mobile search field is 16px to avoid unwanted iPhone zoom.

Acceptance: new source contracts and loopback-only full-flag Playwright QA at
1440, 390, 320; synthetic fixture projects explicitly labelled as non-public,
true Grid/List geometry, filter/free/search/pagination and history restoration,
recorded screenshots, no external/private/non-read requests or runtime errors.
Exact-head CI, screenshot review, parent merge and production authorization
are **not** implied by source commits. #335 owns concept visual acceptance;
#333 owns any future sealed release; #337 remains responsible for uncapped
XP/product implementation, not this UI slice. Main, providers, Stripe draft
#739, auth, D1, publishing and baseline/canary remain unchanged.

## V136.027 — real Commons URL and identity continuity (isolated draft)
Session: `ANEVUM.WEB.UPDATE.2026-10-25.007.COMMONS-URL-IDENTITY-CONTINUITY`.
Stack: `build/parity-v136-commons-20261025-027` builds upon V136.026
Discover candidate #748. Parent V136 development #735 remains isolated from
this source pending its own review and exact-head CI.

**Implemented in draft:** public Community tabs, approved project category,
moderated discussion sort and creator name/handle search now derive entirely
from validated URL parameters (`view`, `category`, `sort`, `q`).
Back/Forward, reload and share preserve relevant selections. View changes clear
filters that would otherwise remain invisible in another tab. No additional
query parameters are accepted by the API. Input is capped at 72 characters
and the mobile search uses native 16px text to avoid iOS zoom.
Unlinked legacy authors and invalid creator handles cannot generate fabricated
`/creators/null` routes. Public counters describe **approved publication**
instead of implying legal identity verification. Actual `readStatus`,
`readProjects`, `readCreators` and separately gated `readCommunityPosts`
remain canonical; moderation and forum posting remain server controlled.
No made-up activity, rankings, avatars or extra front-end data stores.

**QA gate:** source assertions and compiled local Chromium test with explicitly
synthetic approved fixture records at 1440/390/320, URL/Back/category/sort/q,
real API reads, invalid-handle fallback, feature-disabled discussions, no
write/external calls, no layout overflow, 12 labelled captures. Tests and
new CI are proposed source until actual exact-head receipts pass.
Owner did not approve this unseen slice merely by accepting V136.026.
No production release, backend, D1, auth, member XP, payment, publisher
or feature-flag modification. Sealed V136.024 candidate #741 remains intact.

## Unified continuation — V136.026 integrated; V136.027 regression repair
Session: `ANEVUM.ANEVUM.PACKAGE.2026-10-25.002.UNIFIED-OVERHAUL-WORK-CONTINUATION`.

PR #748 source `b0b54bfc3cacfa9755f06be050baaba88acbc352` passed exact-head
Creator V1 Verify (40223670854), Spatial QA (40223670846), focused Discover
QA (40223670849), and the returned V081/V083/V084/V091/V095/V096 checks.
Owner visual approval is recorded in #748. Original compiled 1440/390/320
Grid/List screenshots and acceptance JSON were inspected; no overflow or
forbidden requests. #748 merged using a guarded merge commit into #735 at
`888bf4ccbdbe04442c166dea9f84bc2529eea2d1`. The targeted release failed
solely at the unchanged reviewed-source guard; upload-inactive was skipped.

PR #750 was retargeted from #748 to #735 after that merge. The development
merge is incorporated as a second parent without rebasing, force-pushing,
losing source commits or duplicating Discover. Previous Commons head `073f01ba`
passed focused 40224267418 and Spatial 40224267651; original 12 Commons
captures were inspected. Creator V1 run 40224267439 passed all source/privacy
regressions, then failed the older package-discovery compact-layout assertion
because it read before React committed the URL-owned List state. The harness
now waits for the real selected URL, four compact cards and hidden covers,
retaining the original strict assertions. Fresh exact-head broad CI is required.

Commons creative acceptance remains pending. Screenshot review found legacy
serif typography overriding the shared Institute styles. Next bounded work:
repair that cascade and preserve the new browse state through project detail
return links, which currently discard layout/Commons filters. Keep it scoped
to existing public routes, with strict privacy/navigation regression coverage.
No main, sealed #741, provider, canary, authentication, payment, database or
publication changes. The previous public HTTP 403 remains unresolved evidence.

## V136.028 — public journey continuity and actual Commons typography
Session: `ANEVUM.ANEVUM.PACKAGE.2026-10-25.002.UNIFIED-OVERHAUL-WORK-CONTINUATION`.
Branch `build/parity-v136-browse-return-20261025-028`, stacked only on
#750 `2bf7504c7b74a1f3c834b4381a9dcfdb4cd5501b`. ACTIVE DRAFT.

Implemented: project detail return links retain Discover/creator-directory List
mode and route-scoped Commons project/category, discussion sort or people search
context. Unknown fields, private routes, control characters and external targets
remain excluded by the existing public return sanitizer. Commons project cards
and linked discussion projects now pass their real filtered return context.
The player credit and project channel action reuse publicCreatorHandle, so
missing/null/undefined/invalid channels stay truthful and unlinked.

Actual compiled screenshots revealed legacy important font declarations beat
the new unlayered V136 styles. A narrowly scoped correction inside the existing
legacy layer restores Institute sans typography and strong heading weights;
no global cascade reset or flag-off restyle. Both original concept boards
(Creator Universe Dashboard and Neon UI Showcase) were visually re-inspected.

Local verification: TypeScript and full-flag production build PASS; 152 targeted
public navigation/player/V136/media/moderation contracts PASS. Extended real
compiled Discover and Commons browser tests both PASS at 1440/390/320, including
actual project-detail navigation and return, original Back/filter tests, missing
identity, rendered font family/weight, no overflow, no page errors, forbidden=[].
Reviewed desktop and narrow-phone Commons screenshots after the cascade fix.
All records are explicitly synthetic loopback fixtures. Local browser is
Chromium 153; pinned CI Chromium and broad exact-head checks remain required.
The existing browser workflows now watch their real navigation/player/CSS
dependencies. Owner creative acceptance is still pending; not merged/released.

Read-only Cloudflare receipt now supersedes the older provider snapshot:
gateway deployment `77ceaf3d-5bfb-4f07-b64d-1655a3093065` remains at baseline
`ec5f106b-482c-4415-9c66-d6f8daf219ad` 99% / sealed V136.024 candidate
`cedb7ac1-74ca-4fcd-9a40-ce56964f1785` 1%. No provider writes were made.
Stripe retirement #739 at `126915b6` remains a separate unmerged source track.
Next bounded UI slice: public Creator channel identity/work hierarchy, preserving
actual profile-service capabilities, uploaded media and private/public routing.
