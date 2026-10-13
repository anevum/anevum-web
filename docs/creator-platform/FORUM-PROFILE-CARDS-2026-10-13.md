# ANEVUM Creator V1 — member profile cards beside moderated messages

**Session:** `ANEVUM.WEB.BUILD.2026-10-13.015.COMMUNITY-FORUM-PROFILES`

**Delivery:** source-only build in draft PR; not a staging or production release. Stacked atop the Transcosmic Observatory review branch. No mock members, badge awards, fabricated likes, follows or messages are included in deployable assets.

## Product behavior

The community consists of four real forum rooms: The Arcade (game/play), The Workshop (tools/open source), The Lab (creative/AI/research), and The Commons (general introductions and collaboration). Members can participate **without publishing a project**; a private invited account must have an active public handle and display name before writing. Public guests can read only actually approved threads and replies.

**Member account preview:** The existing authenticated member dashboard now displays the same shared author-card component using actual `memberMe`, verified `memberProgress` and server-derived `memberCreatorProfile` achievements. Users can see their display name, level, earned badges and icon before posting; if any needed source is unavailable, the UI shows a truthful unavailable state rather than synthetic awards. Local screenshot fixtures for this use a clearly watermarked synthetic test identity and are not deployable.

**Forum reading, desktop:** Each approved post is a two-part object: a permanently visible Newgrounds-inspired author rail on the left and a spacious, accessible message surface on the right. The author rail contains an original monogram-based orbital avatar (not an uploaded image), verified display name/handle, actual earned level, up to five **actually earned** achievement badges, and existing series artifact. Clicking the author opens a real community profile even if that account has never published a project. No account email, member UUID, roles, session, IP, moderation status, report history or staff privileges appear in the DTO. No public follower counts, bought cosmetics or rank advantage. On **mobile**, the rail becomes a compact horizontal author header above the readable, wrap-safe body. Device sizes 1440px, 390px and 320px are covered by built Chromium captures.

**Writing:** authenticated invited members can submit a bounded text-only topic/reply. The initial state is `pending` and never returned from public API. There is no public autopublishing or posted-before-review illusion: server responds explicitly with `pending` and a message to the author. For the initial small test cohort, all posts require manual review. Message text is never interpreted as HTML/Markdown in the UI; React text nodes and `white-space: pre-wrap` ensure untrusted markup cannot execute. No attachments, embeds, third-party avatar URLs, direct-message inboxes, reactions, votes, read-receipts, presence indicators or endless feed are provided in this phase.

**Verified progression:** the server aggregates existing, status-checked public-project/ratings/release data and existing XP ledger. It uses the canonical `progressionFromXp` and `deriveAchievements` helpers; only badge entries with `earned:true` are returned. Posting, replying, reading, reporting and staff approval **grant no XP or privilege**. Badge cabinets should remain empty until evidence exists. This prevents spam farming and pay-to-win incentives.

**Reports and moderation:** The Studio includes dedicated pending-post, member-report and hidden-post queues. Staff can hide publicly reported messages and separately restore hidden content after a reasoned review, with a database audit entry. signed-in members can confidentially report approved posts with a valid reason. Report counts and reporter details are never public. Staff use the existing **Cloudflare Access-signed, owner-allowlisted Studio Worker**, not a public privilege claim. A new isolated moderation panel lists pending topics/replies and open reports, displays message text as text nodes, and requires a recorded reason for decisions. Every approve/hide/restore and report resolve/dismiss action writes an auditable event. Hiding the opening post hides its entire thread from guests; hidden replies are excluded. Only member/staff service Worker boundaries accept writes.

## New schema and privacy controls

- `creator-v1/auth/migrations/0008_forum_discussions.sql` introduces 5 indexed staging-only tables: `forum_threads`, `forum_posts`, `forum_reports`, `forum_moderation_events`, `forum_report_events`.
- The migration has its own number; `0007_discovery_preferences.sql` belongs to separate unmerged PR #360 and is **not** a dependency for forum SQL. Ensure the actual applied migration history is reconciled and reviewed before running `0008`.
- FKs keep authored posts and audit history intact through member deletion until human-reviewed retention and legal/privacy obligations are resolved. No automatic hard deletion of member-authored posts on account removal is claimed. Existing account deletion REQUEST behavior is unchanged and still needs a separate fulfillment workflow.
- Recent-session authenticated privacy exports now provide sections `forumThreads`, `forumPosts`, `forumReports`, constrained by the current session's member ID. Moderation notes, reporter identity and emails remain staff-only.
- Three topics/hour/member, eight replies/hour/member, twelve reports/hour/member via the existing DB-backed limiter; strict request sizes, method/origin, category/ID allowlists, prepared SQL parameters, and unique reports per reporter/post.
- Public room and thread lists are paginated with bounded keyset cursors; no published content is returned for hidden/unreviewed threads, suspended authors or unpublished replies.
- Only *synthetic offline QA fixtures* show demo posts or author cards before real accepted member activity; these fixtures run exclusively on `127.0.0.1:4178`, are watermarked in compiled screenshots, and do not ship with Vite Worker assets.

## Sequence to release (NOT YET AUTHORIZED)

1. Review exact-head feature PR and mandatory Creator V1 suite, including actual 1440/390/320 screenshots and public/member/staff/report/export isolation tests. Test that no badge is earned from posts.
2. Complete a privacy/data-retention review and incident response design for abusive content. Establish reporting SLA, staffing, spam escalation, appeals, block/mute needs, community code of conduct and age-appropriate safeguards **before opening public submissions**.
3. Confirm exact existing Creator V1 staging D1 ID `fa96e36d-6257-4883-bf15-074947e11a13`, staging routes `next.anevum.com/api/v1/member/*` and `studio.next.anevum.com/*`. Never touch production D1 `6c7b5f0c-33db-4b6a-9569-0a6af5e07534`, legacy V5, or RHEN. Verify database backup/restore checkpoint first.
4. Apply only independently reviewed `0008` against isolated staging D1 and verify schema indexes/FKs. **This document does not authorize applying the migration.**
5. Roll out the Member Worker and Access-protected Studio Worker as separately reviewed exact-head deployments. Verify Access JWT and same-origin rejects on private endpoints, anonymous read API, empty real rooms, real moderator queue, and privacy exports. Do not deploy the React visual route before those services are ready.
6. With two actual distinct invited authenticated members and one independent staff reviewer, test Member A submits → anonymous cannot see → staff approves → anonymous sees A's verified profile rail/badges → Member B replies → anonymous cannot see pending reply → staff approves → A/B posts visible → report/review/hide/restore/private export.
7. Stage matching React Community/Room/Thread/Member pages under `next.anevum.com/creator/*` only. Verify keyboard, mobile, reduced motion, no XSS and zero cross-member leakage with hosted/browser tests. Preserve rollback Worker versions.
8. Obtain explicit owner approval before any self-service public registration or production forum. Open forum writes only when content moderation, reports, privacy and account recovery actually function with real people.

This is a *forum-style public discussion feature*, **not** private/direct messaging. DM consent, anti-harassment settings, minors' protections and moderation would be a separate product/security scope.

**Related:** #325 canonical, #331 community, #335 visual, #328 member identity, #333 release gates, #337 progression.
