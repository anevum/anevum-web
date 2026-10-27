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
  Reuses the V136 approved cinematic arrival component.
- `/severance`: non-playable overview of persistent worlds, survival,
  reconstitution, emergent alliances, hostile ecology, archives and technical gates.
- `/about`: clear studio identity and scope.
- Shared header + console Wayfinder: Home, Severance, Discover, Status.
- Compact menu: Severance, Discover, Development, Creator Studio; utility
  destinations Community, Creators, Library and About.
- Status page: read-only capability checks remain source of truth; separate
  future game targets from verified available website services.
- Initial HTML + per-route meta copy: avoids misleading marketplace marketing.
- Design: midnight Continuance, restrained copper/teal detailing, mobile
  responsiveness, reduced-motion support, no remote art/fonts.
- Isolated stylesheet wins the existing V136 cascade only through an explicit
  narrow Vite layering exemption, with new selectors `.av137-*`.

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
cover truthful copy, existing routes, four-station navigation and CSS layering.
Compiled browser checks in `creator-v1/test/stage-focused-v137-browser.mjs`
exercise Home, Severance, About and Status with read-only local synthetic API
responses at 1440, 390 and 320 CSS pixels; screenshots are CI artifacts.
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
