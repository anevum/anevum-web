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
