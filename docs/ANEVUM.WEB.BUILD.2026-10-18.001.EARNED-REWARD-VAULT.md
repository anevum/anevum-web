# ANEVUM / V075 — Earned-only Evolution and Recognition Vault

**Session:** `ANEVUM.WEB.BUILD.2026-10-18.001.EARNED-REWARD-VAULT`  
**Date:** 2026-10-18  
**Parent review:** V073 module experience, draft PR #514  
**Branch:** `design/earned-reward-vault-v075-20261018-001`  
**Status:** Source-only, separate design/security review. **Not released or deployed.**

## Locked creative design

- Preserve **all 30 existing Evolution of Everything artworks and native 3D meshes** exactly. No new level 4 or entire collection redesign.
- **No public 30-level gallery, badge encyclopedia, unearned image previews, revealable locked thumbnails, or random preview levels.**
- Every member starts with only what their saved, canonical progression grants. Their own **earned collection** is available on /levels and in Awards & Stats.
- Other people may inspect a member's rewards on their opted-in public profile. A focused **popup inspector** reveals that member's verified earned level model, or a selected public badge, ribbon or medal. Never let a user-selected client level number or URL authorize reward media.
- Inspection supports full native V059 geometry/materials, rotate, zoom, pause/restart, pointer drag, reduced motion and safe poster fallback. The old animated miniature canvas is retired and remains retired on all author cards.
- XP thresholds, granted badges, honorary distinctions, and privacy controls remain server-owned. Looking at a model grants nothing.

## Implementation in review branch

- Replace the publicly visible LevelsPage and RecognitionRegistryPage with earned-only, authenticated views; the old LevelCollection remains as a dead historical component, **not mounted**.
- `EarnedRewardVault` requests the canonical **earned inventory** from `/api/v1/member/rewards/inventory` or opted-in `/api/v1/members/:handle/rewards/inventory`. The response contains only previously achieved levels (1 through the user's verified current level), no future names.
- `RewardInspector` dynamically loads a separate `RewardModelRenderer` only when a verified tile is clicked. No hidden full-model canvas or prefetch exists on public pages.
- `LevelEmblem` uses `/api/v1/{member|members/:handle}/rewards/levels/:level/{icon|preview|poster}` instead of the public Evolution asset paths. These queries independently check eligibility and public consent.
- Per-level native files `scene`, `runtime`, `height` and `albedo` have similarly gated endpoints. The shader runtime is stripped to the earned level's color rather than sending an entire multi-level color catalog.
- Old static `/evolution/*` and `/assets/levels/*` paths are blocked at apex, staging and public Worker boundaries, including direct scene.gz, WebP, JSON and index routes. The packaged original source files are intentionally retained internally.
- Public member reward-media reads require visibility=public, verified email, **show_stats enabled**, and authoritative D1 level; private/disabled/missing records fail closed. Owner reads require a verified Better Auth session and canonical saved member identity.
- Public insignia use the existing canonical recognition projection (only selected, earned badges and honors); own insignia use the private recognition ledger or already earned founding milestones.
- The notification motion sample no longer pretends to award level 30 or show an unearned badge.

## Explicit security boundaries

A visual-only locked-card design cannot protect unearned assets. Release must independently verify:

1. **No unintended external route bypass** to V059/V060 static meshes/posters (old apex gateway deployments, additional Workers, and any separate bucket/CDN domain).
2. **No client-bundled hidden reward details.** Level names are migrated to a server-only earned-inventory response; the obsolete gallery component is no longer imported on the active route. The V065 badge art/definition source is still part of the original client bundle for earned and featured badges, and requires a separate badge-media secrecy audit if source-level secrecy is required.
3. **Member privacy:** private profiles, opted-out stats, unverified users, hidden badges, revoked grants, impersonation and forged query params cannot return an unearned reward.
4. **Legitimate XP:** live XP-test button was designed for staging and must not authorize meaningful production rewards if testing XP remains artificially farmable. Disable test XP in production and reconcile it with the canonical reward unlock authority before publication.
5. **Static asset packaging:** the image/model pipeline is generated, not checked into V075. The source-only CI cannot certify decoding original 1024px poster and running full WebGL. Test against actual packaged assets and real authenticated user sessions before launch.
6. **No access authority changes:** reward recognition is identity, not a moderation, financial, or administrative permission; no billing, XP ledger mutation, grants or D1 migrations in this review.

## Verification gates

- TypeScript check, React public/staging builds and full Creator V1 suite.
- V075 tests: owner sign-in, earned-level bounds, public visibility/stats consent, strict image MIME, HEAD, no spoofed query, sanitized shader runtime.
- Browser QA at 320, 390, 1024 and 1440 pixels checks anonymous /levels and /recognition reveal **no** gallery/locked detail or model, no horizontal overflow.
- Separately authenticated browser QA: earned profile (levels 1..N and verified badges), declined public stats (no model), unattained level (HTTP 404), modal pointer/keyboard and rendered V059 original full mesh.
- Review technical/visual acceptance first. Only after security and approval may a separately authorized release route be proposed.

**No production deployment, feature flag activation, data mutation or external communication in this V075 PR.**
