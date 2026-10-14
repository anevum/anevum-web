# ANEVUM Creator V1: Member Worlds + Series One Artifact Atlas

**Session:** `ANEVUM.WEB.BUILD.2026-10-13.016.ARTIFACT-MEMBER-WORLDS`  
**Canonical engineering:** #325; progression #337; community #331; identity/privacy #328; publishing #329; release #333.  
**Base:** `production/creator-v1` after #371, not historical V5 root.  
**Status:** reversible **source review only**. No production deployment, auth enablement, schema migration, public posting or asset hosting.

## User intent and product contract

- Personal member URLs: `anevum.com/@handle`, for **all opted-in eligible members**, including noncreators with zero published projects. Canonical identity is the verified Member Worker profile. Legacy `/creators/:handle` remains compatible until safe redirects and independently accepted public-member endpoints are in place.
- The user controls a personal profile space: display name, biography, permitted banner/avatar, page appearance, selected module order, project shelf, achievement cabinet, selected public activity, safe external links and privacy visibility. Dynamic HTML/CSS/JS injected by members is **never** accepted.
- Public-safe view is different from authenticated account settings. Email, sessions, recovery, private drafts/library/notes, family details, brokerage and moderator data are excluded from public DTOs. Unlisted and suspended profiles must fail closed; profile deletion and rename implications require acceptance.
- Strong visual direction: the retained midnight navy / luminous gold cinematic world, original dimensional materials and legible editorial content. Member art is not a universal copy/paste avatar template. Default first-party backgrounds are safe; private image uploads need a separate approved media-security pipeline.
- Forums, moderated posts, follows, collections and profile cards are connected **only** to actual active member identities and server-derived earned status. There are no invented engagement metrics or population.

## Current source contribution in this draft

1. A real React route for `/@handle` and a read-only `MemberWorldPage` that uses the same-origin member profile endpoint, with public catalogue fallback for already-published channels. Empty/missing identity and missing earned XP are not fabricated.
2. A fuller profile view with hero world, real work, real achievements (earned only), truthful community state, XP sidebar, responsive phone layout and reduced-motion/high-contrast CSS.
3. A 60-item `series-one.ts` presentation index that exactly matches `auth/community.mjs` existing relic order. CI contract checks every level's authoritative name at its server threshold, and verifies level 61 remains uncapped without a new Series One relic.
4. An interactive `ArtifactAtlas` museum within the existing Levels page. Four illustrated concept studies (1, 2, 30, 60) are shown as studies; all 56 other item slots use number-and-name inventory identifiers clearly labelled **illustration pending**. This is not a finished icon set or earned user inventory.
5. A **disabled-by-default** staging Member Worker module `auth/worlds.mjs` with owner-scoped `GET/POST /api/v1/member/world`, public opt-in `GET /api/v1/member/worlds/:handle`, bounded appearance validation, rate limiting, exact-origin POST enforcement, and private-by-default visibility. Explicit feature gate `MEMBER_WORLDS_ENABLED=true` only after isolated D1 migration `0010_member_worlds.sql`, privacy checks and approval.
6. Authenticated `/account/world` editor with server-confirmed save, four safe named themes, four existing first-party banner scenes and three ordered page modules. Public pages render optional server-authorized appearance and verified achievements only after public-world opt-in. No user-supplied CSS or arbitrary HTML.
7. Staged SQLite integration contract covering missing opt-in, zero-project member visibility, two-member isolation, suspension, cross-origin refusal, strict payloads, protected export, and feature-disabled safety.

## Explicit outstanding integration

**PUBLIC NONCREATOR MEMBER PAGES ARE NOT LIVE.** Existing public catalogue pages enumerate publishers and its API may return 404 before someone publishes a project; the separate original member-profile API is currently staging-only. `/@handle` is a review route, not a guarantee that arbitrary new accounts appear on production.

1. **Source implemented, not deployed:** opt-in public world DTO and server-private default are now in the gated Worker. **Still needed:** independent authorization/privacy/age/legal review and provider-backed Member A (no projects) -> guest open exact `/@a` -> Member B isolation -> inactive/unlisted/deleted acceptance. Avoid using the public project catalogue as an authentication or identity source of truth.
2. **Source implemented, not deployed:** authenticated server-validated presets for theme/first-party banner scene/section order and privacy export, backed by unapplied `0010_member_worlds.sql`. **Still needed:** Cloudflare D1 backup/restore rehearsal, schema sequence reconciliation, provider acceptance and verified account erasure, moderation/age policy, accessibility contrast review, individualized portrait and pinned contributions. Custom uploaded artwork awaits the separately reviewed uploader/scan pipeline.
3. Reconcile existing draft #365 (follows) and #366 (moderated forum) against current canonical production source. Both use conflicting staging migration **0008**, while Member Worlds provisionally reserves **0010**. **Do not apply any of these migrations unchanged before confirming a contiguous, restore-safe sequence**. Review migrations, choose safe next sequence numbers, test restore/reversal and integrate role-separated moderation and verified author cards. No automatic XP for posts or follows.
4. Conduct actual owner-device review at 1440/390/320 widths and keyboard/reduced-motion, full exact-head TypeScript/React/member/staff tests, staged two-member participation acceptance, privacy/security review and explicit rollout approval.

## Art production acceptance for the sixty relics

The existing sixty **names** are locked to current backend definitions but the visual artwork is **not** complete or approved. No new rarities, level powers, colors-as-authority, or XP pacing changes are implied.

- Each distinct named relic becomes an original readable **illustrated object** (e.g. Foundry Spark is an ember-metal ignition relic; Copper Key is a carved mechanical key), not a generic medallion with a swapped glyph.
- Large illustrated master: square transparent full-quality asset, photographed / rendered with distinct geometry, materials, and silhouette, dark cosmic stage as optional page background rather than baked into icon transparency. Generate detailed transparent WebP masters plus retina 96/192/384 presentation derivatives and intentionally simplified 24/32px legibility silhouettes when needed.
- Visual families may share an overall craft language (copper, blackglass, bone, aurora, cobalt, iron, gold), but no two consecutive items should share the same object outline. Premium 3D illustration and polished lighting matter more than vector-only scaling.
- The backend only assigns a Series One name to the member's current verified level. A catalogue preview is not an earned reward and does not imply that every lower-level item has been issued to that member.
- No stage or release should claim that all sixty final artifacts have been produced when only four concepts are installed.

## Launch boundary

This draft requires exact-head successful CI before a preview release can be proposed. It does not merge community schemas, flip signup flags, route new member APIs, generate XP, publish projects or expose private identity. Maintain historical V5 archives, current anevum.com presentation and Lab Access boundaries.
