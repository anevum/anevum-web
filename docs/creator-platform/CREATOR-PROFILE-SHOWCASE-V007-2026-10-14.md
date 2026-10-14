# ANEVUM Community Creator Showcase — V007 implementation

Session: `ANEVUM.WEB.BUILD.2026-10-14.002.CREATOR-PROFILE-SHOWCASE-V007`

**Status: source implementation in a draft review branch. Not merged, not deployed. Migration 0015 NOT applied.**
Visual reference: the owner-reviewed `ANEVUM.WEB.DESIGN.2026-10-14.004.EQUIPPED-PROFILE-SHOWCASE` V4 design.

## Product

Creator post identity now shows real, independently verified member recognition directly beside community posts on desktop, above posts on mobile:

- Creator identity links to their public channel.
- Ornamental level crest showing ledger-derived numeric level; no editable rank or staff/verification claim.
- Equipped *Series One* milestone artifact from the already-issued legacy series, or the current earned artifact until one is selected. Unissued cosmetic inventory and unsupported rarity labels are **not** invented.
- Up to three member-chosen, previously earned achievement medallions, with original ANEVUM emblem art and accessible labels.
- No fictitious awards, dummy public creators, hidden drafts, upload attachment conflation, or XP changes. Empty states are permitted.

Source files:

| Layer | Implementation |
| --- | --- |
| Public DTO | `creator-v1/shared/public-showcase.mjs` |
| Real level item roster | `creator-v1/auth/community.mjs` |
| Private selection database | `creator-v1/auth/migrations/0015_creator_profile_showcase.sql` |
| Auth-only GET/POST preferences | `creator-v1/auth/showcase.mjs` and `auth/worker.mjs` |
| Public bounded batch read | `creator-v1/api/worker.mjs`, `web/a-staging-worker.mjs` |
| Frontend API client | `creator-v1/web/src/lib/api.ts`, `lib/member-api.ts` |
| Public dossier | `web/src/components/PublicAuthorShowcase.tsx` |
| Homepage and discussion | `web/src/components/CommunityHomeFeed.tsx`, `web/src/pages/CommunityPostPage.tsx` |
| Owner-only selection UI | `web/src/components/MemberShowcaseSettings.tsx`, `web/src/pages/MemberAccountPage.tsx` |
| Original styles | `web/src/creator-showcase-v007.css` |
| Tests | `creator-v1/test/showcase-v007.test.mjs` |

## Verified staging state and deployment prerequisites (October 14, 2026)

Read-only audit of ANEVUM's actual Cloudflare account:

- `anevum-creator-v1-a-staging` is the current Worker for `a.anevum.com`, deployed V006 at `d2a980ae-dfe6-45f5-9555-da6024964d86`; bindings are only static `ASSETS` and the dedicated D1 `COMMUNITY_DB` (`anevum-creator-v1-staging`).
- `anevum-member-auth-staging` is a separate Worker using that D1 database. It has existing identity bindings; its current deployed version predates V007. Neither deployment was changed by this work.
- D1's actual `schema_migrations` contains `0001` through `0006` only. There is NO `community_posts` or `member_showcase_selections` table yet. The repository contains proposed `0007`, `0008`, `0013`, `0015` and another upload proposal references `0014`; resolve prerequisites/conflicts and run a staging D1 backup before any migration.
- Aggregates at audit time: **1 active member, 2 active creator profiles, 0 approved published projects, 0 XP ledger events and 0 active project ratings**. Real member reward cards therefore cannot yet be truthfully demonstrated through public data. No sample records were inserted into staging.
- The exact source branch for V007 has changed since the first successful CI run. Final CI/screenshots must be taken against the final head commit.

The **default is now PRIVATE**, including absence of the migration, absence of a saved selection, and a saved `is_public=0` preference. A member must explicitly save `is_public=true` before anonymous reward details appear. The legacy public member-profile API now redacts raw XP and full achievement inventory for non-owners; authenticated owners retain their private cabinet. Public creator channels also use the explicit public showcase projection, not the old raw member data.

Visual acceptance uses `creator-v1/test/portal-offline-preview.mjs` and the real compiled React in `capture-v007-showcase.mjs`. These showcase specimens include explicitly synthetic, offline examples of an equipped earlier artifact, selected awards and an opted-out creator. The captured pages are watermarked and cannot publish any fake record to D1.

## Data and security constraints

Public showcase endpoint: **GET/HEAD only**, `/api/v1/community/showcases?handles=<1–10 handles>`.
Returned data is a sanitized per-handle projection, only for active visible creators who have actual approved published work or moderated public posts. A hidden account/opted-out profile results in no projected record; the post author name itself remains visible because the post is already public. Queries never return private member ID, email, session, drafts, uploads, or unearned awards. The public batch read uses two or three bounded D1 queries for up to ten approved authors instead of running N+1 queries per post. Official/system profiles without a real active member account receive no gamified progression claim.

The selected artifact and award keys are only **presentation references**. No records of item ownership are minted here. Every read and write derives eligibility afresh from the authoritative existing XP ledger and approved publication/release/rating counts. The zero-dependency public Worker embeds a self-contained parity-tested mirror of the existing 20× progression curve, 60 issued names and six achievement definitions; CI must fail whenever it drifts from the member Worker definitions. Levels do not confer privileges, ranking influence, stronger votes, staff identity, or rewards for payment.

Authenticated editing is limited to the same-origin session-protected member Worker at `next.anevum.com` (the existing staging MemberGate). POST enforces owner session, write Origin/Fetch-Site, rate limiting, strict payload shape, one earned artifact, at most three unique actually-earned awards, and an integer revision precondition. Opting out hides the entire public loadout. The visitor-to-member staging identity mismatch remains a release blocker; never route or forward member cookies through the public read-only `a.anevum.com` Worker to make editing appear to work.

Existing published post visibility and editorial/staff review remain authoritative; a profile dossier never grants the author approval to publish or bypasses moderation.

## Deployment and migration gates

1. Exact-head GitHub CI must pass TS, Vite, worker syntax, public/member/authoring/security and V007 SQLite tests.
2. Check responsive compiled React at 320, 390, 430, 900, 1024 and 1440px, including fixtures for genuine equipped/pinned/hidden/revoked states. Browser screenshot capture may be synthetic OFFLINE QA; do not represent it as live member evidence.
3. Review migration numbering relative to Creator upload draft `0014_private_creator_assets`; never apply to Cloudflare D1 until approved, reconciled, backed up and tested against the live staging schema (currently reportedly through 0006 in the upload branch). New 0015 is additive only and must be applied in order.
4. Confirm account isolation and privacy opt-outs using at least two distinct staging member identities.
5. Resolve canonical identity architecture and separate signup project #390. Public browse experience remains functional when member API is absent.
6. Only after explicit owner approval may this be promoted to `a.anevum.com`; the public `anevum.com` construction page remains unchanged through January 1, 2027 unless independently authorized.
7. If rollback is needed, revert the staged branch/Worker. Hide the public endpoint first; preserve database audit and preferences until retention/erasure rules are approved. Do not drop tables by default.

## Honest remaining work

- New universal collectible inventory with externally uploaded image models, rarity metadata and themed animated treatments is **not yet backed by authoritative issuance/storage**. The existing 60 progression artifacts and six verified achievements are reused.
- Public creator profile avatars are letter-avatar placeholders because real approved member avatar media contract is not available here; don't fetch unverified user uploads.
- The existing 60 names are server-defined, but only four pieces have unique established emblem studies. The remaining names now receive category-relevant temporary ornamental motifs; they are NOT 60 bespoke high-definition collectible renders. A separate illustration/asset validation pipeline remains necessary.
- Editing can be enabled only after the approved member identity/migration gates; `a.anevum.com` remains READ-ONLY without account cookies.
- Community features remain bounded by moderation, security and real published data. No infinite scroll, notifications, follower totals or fabricated world stats are introduced.
- Additional full-profile and reply-card layouts, richer original illustration assets, award art beyond existing motifs, and device-grade visual acceptance can follow after first CI and owner review.

## Review disposition

Keep the source PR a **draft**; do not merge, enable public signup, apply migrations, edit DNS/routes, deploy or promote the apex construction page as a side effect of implementing this component.
