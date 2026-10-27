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
