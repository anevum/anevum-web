# ANEVUM / COMMUNITY FORUMS — V041
Session: ANEVUM.WEB.BUILD.2026-10-16.001.COMMUNITY-DISCUSSIONS
Environment: a.anevum.com canonical staging ONLY.
PR: https://github.com/anevum/anevum-web/pull/449
Status: Source-implemented, deployment gated. No DNS, live D1 or production changes authorized here.

## Purpose
Extend the established canonical member system into one real forum experience with four topics: Games & Play; Software & Making; Art, Media & Stories; Community & Collaboration. Thread and reply author cards show the same public avatar, earned level emblem, and chosen real awards as member worlds. Private member submissions, independent staff approval, community reporting and owner withdrawal are included.

## Explicitly not in this release
No new account issuer or linkage to the older Creator V1 members. No automatic awards or XP for posting, liking or reporting. No DMs, file-sharing, child-access defaults, algorithmic popularity, paid boosting, RSS scraping, public user counts, or AI-generated community activity. No changes to anevum.com, lab, RHEN, trading, Stripe, or existing level artwork.

## Architecture
- Worker: creator-v1/canonical-auth/worker.mjs routes exact /api/v1/community/threads and authenticated /api/v1/member/forum-* paths. The canonical Better Auth cookie stays same-origin. Writes require exact Origin and acceptable Fetch Metadata.
- Storage: additive creator-v1/canonical-auth/migrations/0006_member_community_forums.sql in the D1 binding MEMBER_DB only. Threads, replies, reactions, reports, audit log; foreign keys to canonical user(id). Do not execute against COMMUNITY_DB, any V5 database or a production database.
- Flag: CANONICAL_FORUM_ENABLED must be the literal string true and schema must pass readiness; otherwise the API returns 404 or 503. Not enabled by default. Reviewer privilege is only from CANONICAL_FORUM_REVIEWER_IDS matching verified canonical user IDs.
- Privacy: published records require verified author email and public profile at read time. Thread and reply counts follow that rule. Owner withdrawal hides a pending or published thread and keeps an audit-friendly record; independent staff approval cannot revive a withdrawn pending item.
- UI: /community forum is added ahead of existing archive; /community/threads/:id is the public thread; /community/review is the guarded moderator desk. Existing member walls, creator catalogue, old discussion URLs, and home screen remain intact.
- Content: users may submit plaintext; no user HTML execution, file attachments or URLs auto-embedded. 4 threads/member/hour, 12 replies/member/hour, 10 new reports/member/day; DB-enforced idempotent submission keys.

## Required acceptance gates before deployment
1. Review base/head of PR #449, confirm all checks are green for EXACT final SHA, including Creator V1 build, existing member acceptance, and dedicated forum API and browser screenshots at 1440, 1024, 390 and 320 px. CI screenshots are fixtures, not proof of live D1 readiness.
2. Confirm the live staging routing and current deploy source independently. Take a verified D1 backup and restoration checkpoint of only MEMBER_DB; account and binding identifiers must match the staging manifest before any migration.
3. Apply ONLY 0006 to canonical staging MEMBER_DB after owner sign-off. Verify all five tables exist and no existing account, profile, wall or progression records changed.
4. Deploy the reviewed exact build to a.anevum.com, feature OFF first. Verify other routes/signup and existing community feed still work. Enable flag only through a separately approved staging release action and set reviewers by verified user id.
5. Independently test member A creates pending thread, staff B (different account) approves, anonymous guest reads only approved content, member C replies/reports/reacts, staff resolves report, member A withdraws, and guest URL stops exposing it. Verify A cannot review own thread and B cannot withdraw it.
6. Confirm mobile 320/390, keyboard focus, no overlapping cards or broken text, errors, back/forward, session switching, privacy toggle, no client-side XP and no surprise page/API egress.
7. Obtain explicit separate authorization before merging/releasing staging, enabling the flag, applying any D1 migration or taking public launch action.

## Rollback
Set CANONICAL_FORUM_ENABLED=false first; leaves existing /community and all other public paths available. Revert Worker to the previously recorded staging SHA. Leave additive table records intact unless an authorized, verified restoration calls for removal. Never roll back the unrelated canonical auth/session tables.

## Ongoing work
Member-to-member manual acceptance, in-place staging verification and final release sign-off remain open. Review the moderation policy and escalation protocol before opening guest contribution beyond pilot accounts.
