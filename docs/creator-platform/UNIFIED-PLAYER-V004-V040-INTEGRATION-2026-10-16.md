# ANEVUM Player V004 — Source-only integration review on V040

Session: ANEVUM.WEB.BUILD.2026-10-16.001.UNIFIED-PLAYER-SHELL
Source player: `build/unified-player-shell-v002-20261016` at `65fd94123d09e352af5d1e3d03395c7e44035849` (draft PR #443).
Integration parent: `build/supporter-privacy-v040-20261016` at `94d516cfdc3c39fccf1ed7769040ed8db71630ee` (draft PR #447).
Integration branch: `build/unified-player-v004-v040-review-20261016`.
Status: UNMERGED REVIEW / NOT DEPLOYED.

## Exact composition
Copy player-only ProjectPage, ProjectPlayerShell, registry, CSS, browser offline fixture, cinematic world source-move test, player selector tests, browser acceptance and original handoff from #443 into **the V040 source tree**. Preserve all untouched V040 files, including canonical auth Worker, signup/member components, rewards/Stripe/supporter privacy, finance snapshots, scheduled reconciliation, Wrangler staging configuration, member DB and original V040 tests. Merge `creator-v1/package.json` by appending the player tests to V040's existing full `test` command; never drop previous V040 test suites.

This is not a merge of existing PRs, an authorization to use V040 on a live site, or a replacement for independently approving the supporter lineage. V040 itself is a draft and must pass its own review and release gates.

## Security and experience invariants
- **a.anevum.com** uses `anevum-creator-v1-a-staging` with two staging-only D1 bindings and existing canonical-auth configuration. `anevum.com` remains an independent construction/countdown Worker.
- No Worker route, D1 database/migration, Stripe live credentials, payment settings, R2 asset, upload pipeline or real project is changed by this integration candidate.
- Player URLs remain validated external HTTPS links; never execute third-party games/apps inside ANEVUM's primary origin. Source code is not a playable game.
- Project records remain public, approved and real. Images in the offline QA fixture are first-party ANEVUM category art, never unreviewed user media; its sample titles, game, host names and statuses are NOT public submissions.
- Canonical A-stage account sessions are separate from the older Creator V1 rating/library API. Do not infer an authenticated player rating/save route just because A-staging auth works; in the absence of server support, controls must fail closed and award no XP.

## Verification and release gates
1. Exact-head CI builds production/staging Vite assets and runs both the full V040 supporter/account/privacy suite and V002/V003 player tests.
2. The offline compiled-browser matrix covers six player states at 1440/1024/390/320, including long title/summary, category art, sharing, section anchors and secure external links. Preserve screenshot artifacts for human review.
3. Owner review on real phones (Safari especially), keyboard/screen readers, reduced motion, long content, contrast and touch targets.
4. First rights-cleared and approved public creator project: confirm actual demo and source URLs, attribution, license/cost/device statements and moderation status. As of read-only A-stage check October 16, 2026, the public API returned zero projects/creators; sample fixtures do not count.
5. Cross-account and guest acceptance for canonical member sessions and user-authorized engagement; preserve signup/email/profile and privacy behavior, support rewards/account closure.
6. Before any authorized staging deployment, verify current A-worker version and complete rollback, double-check the two D1 bindings, secrets and Worker routes, and validate no public `anevum.com` change.

**No automatic merge, staging push, public launch or real billing action.**

## V005: canonical project participation, source-only QA
- The published project shortcut is now `PARTICIPATE`, not `RATE / SAVE` on a host where those actions cannot be completed.
- The original Creator V1 member participation panel now explicitly classifies only the known canonical A-staging member health schema (`service=anevum-canonical-auth-staging`) as `canonical-readonly`, and intentionally makes **no** rating, saving, project identity bridge, or XP request. It displays a clearly labeled not-active state, real community link, and invite-only member access link; sign-in is never presented as enabling rating.
- Existing legacy `ok` member service keeps its server-authorized rating/save path; unknown or failing health remains closed. No replacement login, cookies, token storage, client XP, Worker routes or D1 changes.
- The synthetic offline browser now asserts canonical preview on every player variant and viewport, and checks independent legacy-guest and unavailable states on desktop and phone. This fixture is not bundled into deployed assets.
- No schema/auth server change or live staging deployment is implied. Canonical member project voting/saving needs an independently designed, authorized backend and cross-account E2E before activation.

## V005 browser-probe verification fix
- Corrected CDP Runtime.evaluate expressions for quoted CSS attribute selectors. Probe source now lives in `test/player-browser-probes.mjs` and is syntax-checked with Node's VM parser and a synthetic DOM contract before browser acceptance. Timeouts report the last exception instead of hiding parse errors.
- This is an offline-test correction only. Its green combined CI run, including canonical/legacy/closed browser states, remains a required gate.
 
## V006 browser proof for canonical participation
- Every synthetic canonical player route now checks a loopback-only request trace: no calls to legacy `/me`, `/library`, project rating or vote routes are allowed. The trace resets on each scenario so stale requests cannot pass.
- At all four viewport widths, the browser scrolls directly to the canonical participation panel, checks that both outbound-on-platform actions are readable, at least 44px tall, entirely within the viewport, and that no voting or saving controls are rendered.
- The CI artifact includes dedicated `player-v006-canonical-participation-<width>.png` captures for owner review. The synthetic-only watermark is moved to the bottom edge so it does not conceal the shortcut controls.
- This verifies read-only presentation only; it does not constitute authenticated member voting, rights clearance or a deployment authorization.
 
## V006 touch-target correction
- The first V006 browser run rejected the real 1440px participation actions at **43 CSS px**, below the 44px touch-target floor, even though the source styling had a 48px minimum. It did not fail the canonical identity isolation check.
- Increased the specific participation links' nominal minimum size to 56px without modifying unrelated buttons. Keep the rendered 44px browser assertion at all viewports; a source-only CSS assertion is not a substitute.
- Recheck V006 exact-head browser screenshots, canonical request tracing, and full V040 combined tests before treating this change as verified.
 
## V006 final CSS cascade diagnosis
- The first minimum-size adjustment still rendered 43px because the later site-wide selector `.av9-shell :is(.button, ...)` had equal effective specificity to `.avp-project .avp-participation-actions a` and overrode its `min-height`.
- Target the canonical participation links with `.av9-shell .avp-project .avp-participation-actions a`; this has higher specificity while remaining scoped to this player. No global design tokens or other controls change.
- Verified with the **actual compiled site stylesheet** in a minimal Chromium DOM: original selector rendered 43px, scoped selector rendered 56px. The full compiled offline site and all four viewport checks still require exact-head CI acceptance.

## V007: source-only canonical project save pilot
- Separate additive migration `canonical-auth/migrations/0007_private_project_saves.sql` targets only the canonical `MEMBER_DB`, never the community, legacy, RHEN or production database. **It has not been applied.**
- New isolated `project-saves.mjs` verifies published project ID and active creator from the existing **read-only COMMUNITY_DB**, while saving only the project's opaque 32-character ID to the authenticated user's **MEMBER_DB**. The UI does not trust client-selected owner IDs.
- Per-member save limit 200, rate limit 60 changes/hour; idempotent PUT/DELETE, withdrawal-resistant DELETE, revalidation on GET, ON DELETE CASCADE for account removal. No rating, XP or level event.
- Canonical Worker routes only exact `/api/v1/member/project-saves/:id` GET/PUT/DELETE and requires `CANONICAL_PROJECT_SAVES_ENABLED=true` before discovery. PUT and DELETE share the existing exact same-origin CSRF/session boundary; foreign legacy cookies/tokens are stripped.
- Canonical health advertises `projectSavesReady` only while deliberately enabled, contingent on both isolated D1 schemas. A private export contains owned saved project IDs when the saved-project table is present, regardless of the current rollout flag.
- **Source-only, flag OFF, migration NOT APPLIED, no button enabled, not deployed.** Cross-database publication revocation cannot be made a distributed transaction; every read validates public status and never exposes withdrawn project content.
- Launch gates: migration inventory approval + separate staging backup/rollback; Creator publication integrity review; real canonical A and B sessions (owner isolation), withdrawn/private project tests; privacy export and erasure; owner sign-off. Do not combine this draft pilot with automatic billing, moderation, public signup or any XP award.

## V007 verification correction
- First combined CI run identified a real accounting error: rejecting a save over the 200-item capacity incorrectly consumed one of the 60 hourly mutation tokens. Corrected by checking the capacity before consuming allowance; the database INSERT retains its own atomic capacity predicate.
- An explicit regression assertion now verifies zero quota usage for an over-capacity rejection. Read-only, disabled-by-default staging and private member ownership contracts remain unchanged.

## V008: feature-gated canonical save controls
- Added a canonical-only project save client that uses the same-origin Better Auth cookie and GET/PUT/DELETE `/api/v1/member/project-saves/:id` with no user IDs, browser XP, legacy token, client-side ratings or local storage.
- The existing `projectEngagementGateway` switches from the read-only panel to a real save/remove control **only if** canonical health explicitly returns `projectSavesReady: true` and `status: ready`. Missing flag, missing migration, unknown health, unauthenticated session, unpublished project and network errors remain non-mutating.
- Guests are offered member access; verified members can save/remove privately with server-confirmed results and error feedback. Community remains accessible in every state; XP and ratings remain inactive.
- **The flag remains absent from Wrangler; no migration has been applied.** The default A-staging view remains the verified V006 read-only participation design until separately authorized.
- The V008 unit contract tests same-origin request semantics, invalid project ID rejection and the health-gated UI. Browser coverage for guest/member save interactions remains a follow-on release gate.

## V008 compiled-browser acceptance (synthetic only)
- The loopback-only fixture simulates a canonical save-enabled capability and an explicitly synthetic invited member. It does not touch real Better Auth, public Creator projects, Member D1, Stripe or XP.
- At 1440, 1024, 390 and 320px, the browser checks guest sign-in state, verified-member save/remove buttons, minimum 44px rendered touch target, no horizontal overflow, server-confirmed save and removal, and absence of legacy identity calls or voting controls.
- Each viewport produces `player-v008-canonical-save-guest/before/after-<width>.png` screenshots for visual acceptance. **No activation flag, database migration or real-member acceptance is performed.**
