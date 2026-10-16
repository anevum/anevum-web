# ANEVUM / COMMUNITY FORUMS — V041
Session: ANEVUM.WEB.BUILD.2026-10-16.001.COMMUNITY-DISCUSSIONS
Environment: a.anevum.com canonical staging ONLY.
PR: https://github.com/anevum/anevum-web/pull/449
Status: DEPLOYED AND ENABLED on a.anevum.com staging (2026-10-16). No DNS, apex or production changes.

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

## Staging release outcome and evidence (October 16, 2026)
- Source release GitHub Actions [38976436738](https://github.com/anevum/anevum-web/actions/runs/38976436738) **completed successfully**, deploying the exact reviewed application build from `78933fdb678a017af84ca5e74b8fad1472f646c3` with the forum flag OFF first. Browser regression included Chromium, WebKit, member signup/profile, V041 forum and responsive checks.
- Canonical staging `MEMBER_DB` additive migration `0006_member_community_forums.sql` was applied by the Cloudflare connection and all five tables verified. Pre-migration D1 recovery bookmark was recorded privately; no destructive table action. The original counts were 2 users, 1 creator profile and 38 XP events, and remained unchanged after the migration. `PRAGMA foreign_key_check` returned zero violations; the public D1 SQL read was executed successfully. No real or synthetic forum submissions were seeded.
- Cloudflare Worker `anevum-creator-v1-a-staging` was then enabled using an atomic, versioned secrets update. `CANONICAL_FORUM_ENABLED` is `true`; `CANONICAL_FORUM_REVIEWER_IDS` holds the verified canonical `@devon` account ID without publishing the identifier in GitHub. Other Worker secrets, both D1 bindings and the public countdown route were preserved. Moderator self-approval is intentionally forbidden.
- Independent **hosted** smoke run [38977120012](https://github.com/anevum/anevum-web/actions/runs/38977120012) **passed**, including approved-thread GET, topic query, invalid cursor/topic rejection, protected moderator/submission endpoints, Origin/CSRF checks, existing member health/auth routes, community feed, level artwork and unchanged `anevum.com`.
- The project remains a staging community. `CANONICAL_PUBLIC_SIGNUP_ENABLED` remains OFF; the existing invite/email access policy was not expanded during the forum release. `anevum.com` remains the January 1, 2027 coming-soon page.

## Remaining acceptance beyond deployment
- Perform a real signed-in member-to-member journey on staging: member A creates a thread, different staff B approves, member C replies/reports/reacts, staff resolves, author withdraws, and public reads cease. Synthetic isolated CI covers those flows; live real-account participation must be checked separately.
- Appoint a trusted second reviewer before `@devon` submits threads intended for public publication, because `@devon` cannot approve their own submissions.
- Review ongoing community guidelines and incident escalation before a broader public onboarding launch. Public registration and production promotion require separately scoped decisions.

## Rollback
Set the versioned `CANONICAL_FORUM_ENABLED` binding to literal `false` first; leave existing `/community` and all other public paths available. If necessary restore the last checked pre-V041 staging Worker version through a versioned Cloudflare deployment. Leave additive table records intact unless an authorized, verified restoration calls for removal. Never roll back the unrelated canonical auth/session tables.

## Continuing work
Finish manual authenticated multi-account staging acceptance, configure a second trusted reviewer, and continue community discovery/search, member moderation tools, and new creator/community integrations without affecting apex or production.
