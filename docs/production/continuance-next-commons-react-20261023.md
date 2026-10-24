# ANEVUM NEXT — Living Commons React integration slice 01

**Session:** `ANEVUM.WEB.BUILD.2026-10-23.006.LIVING-COMMONS-REACT-BRIDGE`
**Status:** IMPLEMENTED AS OPT-IN REACT REVIEW ONLY; NO LIVE ROUTE REPLACEMENT, NO PRODUCTION DEPLOY, NO DB OR ACCOUNT MUTATION.
**Source lineage:** Protected V131 exact candidate -> NEXT foundation #676 -> profile/community #677 -> Living Commons prototype #678 -> this narrow real-data React bridge.

## Decision and recommendation

Adopt **Signal Board first, District Atlas second** as the recommended *review design*. The Atlas is the differentiated spatial experience, but public projects, constructive discussion and a clear participation path should be immediately accessible. A third People & Worlds view presents existing approved creator channels. Do not convert this owner recommendation into production publication without #335's 1440/390 review and independent #655 release approval.

## Real implementation

The disabled-by-default `VITE_LIVING_COMMONS_REVIEW=true` flag mounts `/__review/commons` only on an intentionally flagged build, inside the **existing** `Shell`. This new page contains:

1. A cinematic orbital cover using the repo's real `OrbitalMark` and ambient Motion/CSS animation; it honors reduced-motion and local pause. The shell owns the only IREN instance.
2. **Verified status**: uses `readStatus` counts; shows an em dash when unavailable, not zero or fabricated proof.
3. **Original releases**: uses existing `readProjects` with bounded query/category (first 24 records) and `projectDetailPath` and actual creator profile route; source stays in the canonical record. When a next cursor exists, users can continue in full Discover; the first-page count is never misrepresented as the total.
4. **Moderated conversations**: `readCommunityPosts` runs **only** when authoritative `status.features.communityPosts === true` and the Signal Board is selected. Closed, error, loading and no-content states remain distinct. Existing `/community/posts/:id` continues owning discussions and actual replies/reactions.
5. **Eight category districts**: stable categories map to existing identifiers. `readCategories` supplies truthful published totals. The fixed positions are taxonomy, NOT actual density or activity. Each district links back into the exact same project records on the Signal Board; the equivalent readable list is available alongside it.
6. **Creators**: `readCreators` is called only on People & Worlds, and links only to real approved creator channels. Private canonical member worlds are not enumerated or inferred.
7. **Context Lens**: deterministic links to existing Discover, Community, Creators, member space, recognition and review-gated discussion submission. No autonomous AI and no privileged actions.
8. **URL state**: pure `decodeCommonsQuery`, `nextCommonsQuery` with safe view/category/sort/query validation, and navigation history semantics.

## Exactly what does not happen

No new auth, D1 migration, API endpoint, Worker, uploaded media, profile write, social follow, XP, rewards, badges, staff privileges, fake demo accounts, generation model, extra IREN companion, Studio merge, or V131 deployment. Private member profiles remain independent from creator channels. Server authorization and moderation remain authoritative.

## QA / acceptance

- Local source and URL-model tests must pass.
- GitHub exact-head CI must prove pinned `npm run check:creator-v1-web` and **both** Vite builds: default `VITE_LIVING_COMMONS_REVIEW=false` excludes all `lnx-root` markers, while explicitly flagged true builds contain it. No deployment commands in the workflow. A failure of the older foundation's intentionally narrow cumulative diff guard is not a release exception; preserve that guard and keep this stacked PR review-only.
- Actual browser QA on compiled React with mock API fixtures must show accurate empty/error/closed behavior; fixture screenshots must be conspicuously labeled, and final verified real-record acceptance uses live approved read-only endpoints only.
- Accessibility: keyboard operation, reduced motion, focus visibility, 320/390 responsive, contrast, screen reader and static map list. Accessibility and end-to-end production acceptance are **not** implied by local syntax tests.

## Recommended implementation order after this slice

| Next slice | Real-source integration | Gate |
| --- | --- | --- |
| 02 — Project Rooms | Existing `/projects/:id`, approved project-thread links and release provenance. No duplicate project DB. | Project visibility, authorship and destination checks |
| 03 — Deep Threads | Existing `/community/posts/:id`, `memberCreateReply`, revisions, rate-limit and staff review receipt. | A/B account isolation and moderation acceptance |
| 04 — Identity & Cabinet | Existing `CompactMemberIdentity`, `LevelEmblem`, `BadgeInsignia`, `EarnedRewardVault`; server-earned only. | Public/private reward visibility and 30 level artwork preservation |
| 05 — Personal Commons | Existing `/member`, saved works and opt-in avatar/banner preference; no client-controlled permissions. | Owner verified revision and export/deletion safety |
| 06 — Assemblies | New explicit lifecycle design, do not invent available membership now. | Consent, invitation, abuse/moderation, new schema and owner approval |
| 07 — Motion polish | Layout continuity, bounded shared-element transitions, optional ambient backgrounds, hardware profiling. | Reduced-motion, iOS Safari, CWV, energy and WCAG 2.2 AA |

## Related controls

Owner creative checkpoint: #335. Engineering board: #325. V131 protected release and rollback: #655. Public surfaces draft: #667. Creator Studio draft: #658. NEXT foundation: #676. Community/Profiles: #677. Living Commons prototype: #678. Keep independent PR reviews without mixing unfinished migrations, production artifact uploaders, or worker routes.