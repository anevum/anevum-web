# ANEVUM.WEB.UPDATE.2026-10-27.001.STAGE-FOCUSED-SEVERANCE-SITE

Date: 2026-10-27. Scope: ANEVUM Creator V1 / public React presentation.
State: ISOLATED DEVELOPMENT CANDIDATE, NOT RELEASED.
Base: V137 development branch `build/parity-v136-controller-route-probe-20261025-038`.
Candidate: `build/stage-focused-severance-site-20261027-001`.

## Product decision and purpose

ANEVUM is presently an independent game/software workshop, not an already operating
large creator marketplace. The primary public narrative should be the ongoing
work and its real limitations. TRANSCOSMIC: SEVERANCE is an intended browser-first
persistent survival-horror PvPvE game. It is in game design / technical-prototype
work; do not advertise a playable server, online population, beta, leaderboard,
fixed map size or launch date.

The homepage should lead with the actual studio, Severance and verified
development status. The approved public catalogue remains genuine and open.
No fabricated releases, numbers, user activity, votes, rendered creator art or
in-progress projects may be represented as launched.

## Candidate changes

- `/`: stage-focused independent studio hero, current game concept, genuine
  published projects, compact work program and visible development caveat.
  The V138 hero uses original deterministic SVG environment art (broken ring,
  Institute complex, foreground survivor, fog and lighting), not a fabricated
  screenshot or unapproved production media.
- `/severance`: non-playable overview of persistent worlds, survival,
  reconstitution, emergent alliances, hostile ecology, archives and technical gates.
- `/about`: clear studio identity and scope.
- Shared header + console Wayfinder: Home, Severance, Discover, Status.
- Compact menu: Severance, Discover, Development, Creator Studio; utility
  destinations Community, Creators, Library and About.
- Status page: read-only capability checks remain source of truth; separate
  future game targets from verified available website services.
- Initial HTML + per-route meta copy: avoids misleading marketplace marketing.
- V138 owner-approved visual direction: obsidian / charcoal / fog gray,
  bone-white distressed industrial titles, limited crimson warning light.
  Four original environment-illustration plates: perimeter, containment,
  outpost and signal relay; all labeled as concept, never screenshots.
- Shared studio/navigation chrome and existing public Discover, Commons,
  creator directory and Status pages receive scoped theme treatment;
  protected Studio editor and private systems retain their own structural CSS.
- A reduced-motion fallback, explicit 320px and 390px breakpoints,
  high-contrast controls, and no remote fonts, scripts or image downloads.
- The original scene is built with SVG in the React component tree rather
  than another shared animated canvas or WebGL renderer.
- The V137 and V138 stylesheets win the old V136 cascade only through narrow
  Vite layering exemptions; the visual selectors are `.av137-*` and `.av138-*`.

## Intentionally preserved

All existing Studio authoring, editor state, packaging, uploads, moderation,
accounts/authentication, profiles, approved public catalogue, creator channels,
community, IREN companion, member permissions, legacy redirects, stored awards,
supporter systems, staff console, existing APIs and D1 migrations remain. These
functions are demoted in primary navigation, not removed or reauthorized.
No backend endpoints, databases, secrets, production Cloudflare routes, pricing,
account records, or production site versions are changed.

## Explicit exclusions

No change to `anevum.com` or live game-server provisioning; no Godot
multiplayer implementation in this change. The sealed V136/V67 production
release mechanism is not modified. The new presentation cannot be published via
the old immutable-blob V136 package without a separate reviewed release approval.

## Verification / acceptance

Source checks in `creator-v1/test/stage-focused-severance-v137.test.mjs`
and `creator-v1/test/severance-cinematic-v138.test.mjs` cover truthful
copy, existing routes, four-station navigation, SVG-only graphics, no fake
server or screenshots, preserved public data and scoped CSS layering.
Compiled browser checks in `creator-v1/test/stage-focused-v137-browser.mjs`
exercise Home, Severance, About and Status, including the V138 concept
illustrations, with read-only local synthetic API responses at 1440, 390
and 320 CSS pixels. Exact-head screenshots and a receipt are CI artifacts.
The superseded V136 first-contact Chromium test is updated to verify
current-stage content and the retained `/start` deep link instead of
asserting that the retired homepage guide is still visible.
Existing Wayfinder privacy/focus and Creator Studio browser checks should also
be reviewed. Real iPhone Safari, Android and user-account acceptance are
separate gates. Do not claim successful compilation or runtime QA until
GitHub Actions produces passing evidence.

## Follow-through

1. Validate the isolated PR's exact-head source, build, and screenshots.
2. Verify all visible destinations, 320/390/1440 layout and no fake play CTAs.
3. Check existing auth, editor, moderation and staff routes with owner QA.
4. Review old V136 screenshot checks against new owner-approved stage direction;
   do not disable protected release boundaries just to turn checks green.
5. Only then authorize separate, controlled public release/rollback and device QA.

## V138 integration checkpoint — 2026-10-27

The source-of-truth PR remains #786 based on #763, not a replacement
or competing rebuild. The V138 work introduces:

- `creator-v1/web/src/parity/SeveranceWorldSceneV138.tsx`
- `creator-v1/web/src/parity/StageFocusedHomeV137.tsx` (rewritten V138 public front)
- `creator-v1/web/src/pages/SeverancePage.tsx` (world dossier and anchors)
- `creator-v1/web/src/severance-cinematic-v138.css`
- Shared header search/status links, mobile Wayfinder and hash-navigation
  reliability without new account permissions or database changes.

The concept image approved in conversation is a *visual direction*, not
verification that games, screenshots, multiplayer services, or Discord
integration actually exist. Its speculative PLAY NOW/WATCH TRAILER/JOIN
DISCORD controls are intentionally replaced by real development routes.

No direct merging into production or Cloudflare traffic changes are permitted
until the exact built frontend and server boundaries are verified. The historic
V136 immutable release gate is expected to reject unreviewed new UI blobs;
the correct resolution is a new release authorization with reviewed bytes,
not weakening or circumventing the existing gate.

## Production cross-check and next release authority — 2026-10-27

Read-only Cloudflare deployments/versions API verification found the current
`anevum-apex-prelaunch-gateway` Worker at **version 67, 100% traffic**
(the latest listed deployment was October 26, 2026 at 22:33 UTC).
The previous full-traffic version 63 remains recorded in deployment history.
These are authoritative Cloudflare observations and **not** a V138 release.

The historical `parity-v136-release.mjs` workflow pins a different prior
asset/source cohort and a fixed root-script snapshot. It rejects the new
site's changes. This rejection is a release-boundary result and must not be
silenced or used to justify switching production to an obsolete gateway
payload. The current production Worker v67's code, bindings, secrets,
route ownership, redirects and failure/rollback behavior must be treated
as the baseline for a separate reviewed V138 frontend-only release.

A new **read-only** scope preflight is in
`creator-v1/ops/v138-public-presentation-scope.mjs`. It verifies the
exact approved V137 parent tree, requires the exact CI head, audits the
complete changed-path list against a closed list, and fails on Worker, auth,
D1, static-asset, package, payment or secret/config modifications. The
exact-head compiled Chromium QA executes only after this step passes.
This is a scope receipt, **not** permission to deploy.

### Remaining rollout gates

1. Exact-head CI complete including 1440, 390, 320 px, keyboard/controller,
   creator/member/staff boundaries, and historical V136 spatial tests with
   updated four-link expectations.
2. Human review of screenshots, independent artwork quality, reduced-motion,
   low-end iPhone Safari and Android input/performance.
3. Review the exact v67 live Worker deployment settings, bindings, static
   package source, route ownership and immutable previous version for
   rollback. Do not infer v67 internals from the old V136 script.
4. Build and review a separate V138 frontend-only upload package pinned to
   the approved source SHA; require production change authorization and a
   fail-closed cutover/rollback mechanism before moving any traffic.
5. After controlled activation, confirm real anonymous pages, auth, Studio,
   uploads, moderator boundaries, public metadata and mobile UX against the
   live domain; stop and rollback on regression.

No production upload, deployment, traffic switch, migration or GitHub merge
has been executed by this V138 presentation continuation.

## Review packaging and legacy media retirement — 2026-10-27

- The public web build now prunes `creator-v1/web/public/portfolio/`
  from the *compiled* V138 output, retaining the original Git files for
  archive/rollback. This removes stale RHEN/demo personal-portfolio assets
  from the site bundle without deleting user history or other repo data.
- The exact-head Chromium gate confirms old personal portfolio media returns
  HTTP 404 on the isolated loopback server.
- `creator-v1/ops/v138-static-inventory.mjs` inventories public build
  files with deterministic SHA-256 digests, detects forbidden debug/secrets,
  asserts the unapproved cinematic review media and retired portfolio are
  absent, and writes `evidence/stage-focused-v137/static-inventory.json`.
- After all dedicated V138 checks pass, GitHub Actions attaches an
  `anevum-v138-static-ui-<reviewed-head-sha>` archive for offline review.
  This is a **static artifact only**, not a Cloudflare Worker bundle and
  cannot itself authorize or trigger live traffic activation.

The public product remains closed to game launches until a real authoritative
server and playable build are independently verified.

## V139 cinematic motion continuation — 2026-10-27

The visual concept has been developed into an **actual locally encoded,
8-second, 24 fps, 1920x1080 H.264 loop** (original review render SHA256
`f8f3950b2fbe7d23c4da029b1708c7d099199cdf2dbaafb6d579685cb5ebd4b4`,
~1.30 MB), with blood-red industrial lighting, small glitch pulses,
mist, depth, storm and a stationary survivor in a devastated valley.
The clean source is 1672x941 and contains **no baked UI text**. It is
concept art, not captured Godot gameplay.

### First-party source and runtime contract

- The reviewed image master is **SHA256
  `71c1bb6ca774841386857a1e8b344420d7c95fa5e1e96a6fb23dc656df005ba5`**.
  Build CI retrieves the exact source from its temporary uploaded asset
  endpoint, **verifies the SHA before any decode**, and generates all
  finished files during the isolated reviewed build. The production site
  never requests the generation provider.
- `creator-v1/graphics/encode-severance-v139.py` generates the first-party
  video in 1080p desktop and 720p phone variants, a 1080p static WebP
  poster and **48 scrub frames per variant** (96 local WebP frames total).
- `SeveranceCinematicV139.tsx` replaces the old SVG-only hero and
  is used on both `/` and `/severance`. The original authored SVG is
  still the fallback if video or poster fails. The video plays muted,
  inline, looping and pauses while hidden/out of the viewport. Reduced
  motion and data saver do not fetch a moving video.
- `SeveranceScrollSequenceV139.tsx` inserts one native, scroll-linked
  film chapter on the homepage with real accessible HTML copy and a
  functioning `/severance` link. The optional 2D canvas uses a capped
  **six-decoded-frame cache**, requestAnimationFrame/IntersectionObserver
  and a static poster on reduced-motion, low-bandwidth or load failure.
- `severance-motion-v139.css` applies small CSS 3D hover lifts, bounded
  pointer parallax, crimson film-light/blood-edge treatments and brief
  signal glitches to public surfaces/header/Wayfinder without changing
  account permission, Studio editor layout, native inputs or readable copy.
- Every public media path respects Vite's `BASE_URL`: normal apex
  `/assets/severance/...` and isolated owner review under
  `/creator/assets/severance/...`. No JS CDN or live external video
  player, remote fonts or new game renderer.
- All original creator work, public project covers, account state,
  moderation, recognition and Studio file operations stay untouched.

### Media QA/release constraints

The dedicated V139 CI is **not a production deployment**. It verifies
the exact SHA256 source and locally encodes media before Vite builds;
the post-build asset inventory validates all three MP4/WebP core
assets **and all 96 scroll frames by SHA256**. Browser QA at
1440/390/320 tests the poster, reduced-motion, local 1080p file, local
frame and no third-party/write requests. UI clips and screenshots
remain explicitly labeled *concept visuals, not gameplay footage*.

The build currently retrieves its pinned master from a temporary
generation-asset URL. Before long-term production maintenance,
archive the exact source bytes in a first-party versioned media
repository/storage location and preserve its SHA256; do not build
infrastructure that depends indefinitely on a third-party asset URL.

The original V136 sealed release package remains intentionally
incompatible. A separate current-v67-compatible, audited,
rollback-safe release gate is still mandatory to touch live traffic.
