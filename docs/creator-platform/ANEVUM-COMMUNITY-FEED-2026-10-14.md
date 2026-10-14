# ANEVUM Creator V1 — Community-first Front Page and Moderated Discussions

Status: **developer implementation under review**, October 14, 2026.  
Owner: ANEVUM Community / Creator V1. Canonical board: #325, publishing gates #329.  
Branch: design/featured-play-interaction-20261014 (historical name; no Orbit Align).
Pull request: #384.

## First impression and information hierarchy

The homepage is not a cinematic marketing hero or an artificial game. The persistent single top navigation retains the Menu, member identity and settings, and the rest of the screen contains verified activity:

1. Concise network heading plus Share a Project and Explore actions.
2. Public counters from anonymous status only; unavailable numbers render em dashes, not zeros.
3. Selected approved project and clear creator attribution. Illustrated category artwork is labeled; original creator thumbnail assets are not synthesized.
4. Main submission feed with six broad discovery topics, pagination and refresh from the approved public catalogue.
5. Sidebar/secondary phone modules: hot/new approved community posts, actual public creator profiles, category counts and transparent IREN editorial status.

Mobile uses one column and prioritizes actual submissions before secondary modules. Desktop uses one primary editorial column and a compact sidebar. No fixed secondary mobile navigation is introduced.

## Real data and ranking

- Projects: GET /api/v1/projects, actual staff-published records; no hidden drafts in any visitors' queries. Filter and pagination by the existing API cursor. Feed timestamps are sourced from published_at and never invented.
- Creators: GET /api/v1/creators, actual profiles tied to publicly approved work; a provisional ranking by real number of approved projects. No synthetic "online now", followers, or endorsement status.
- Categories: GET /api/v1/categories, actual public counts.
- Community: GET /api/v1/status returns features.communityPosts true **only if the four staged post/reaction/reply/audit tables exist**. A false or absent flag renders a candid not-launched state.
- Approved community: GET /api/v1/community/posts?sort=hot or sort=new; sort is supported only from verified numeric reaction/reply counts on publicly visible, staff-approved posts. The initial service uses a bounded 1–24 item read, with no social advertising or fabricated votes.
- Full moderated discussion: GET /api/v1/community/posts/:id includes approved replies only. Plain text is displayed as text. No raw HTML rendering or arbitrary URL previews.

The public post feature remains subject to staged rollout and cannot accept anonymous writes. Missing migration is not represented as a populated feed. Post pagination, subscribed feed, robust freshness ranking and event-based live updates are separate future acceptance items.

## Private submission and staff review

Creator V1 staging schema: auth/migrations/0007_community_post_stream.sql, **not applied automatically to any production D1**.

Authenticated, invited members use POST /api/v1/member/community/posts with server-side title/body/topic validation and a small per-hour rate limit. New posts have pending_review status. GET /api/v1/member/community/posts/mine returns only the authenticated author's own private submissions and statuses.

The signed Cloudflare Access owner studio provides a real review queue at /api/community-posts. Staff publication, rejection and hiding require a 12–800-character editorial reason, optimistic revision check, staff identity in the audit trail and an atomic transition. Only active authors and published, non-future items appear in anonymous queries.

Member reactions on published posts:
- GET /api/v1/member/community/posts/:id/react returns only the authenticated member's prior reaction.
- POST /api/v1/member/community/posts/:id/react is bounded, per-member, revision checked, cannot target one's own post, and can be reversed. These are feedback signals, not moderation authority or permission to appear in rankings.
- Unapproved/rejected/hidden posts cannot be publicly reacted to.
- Posts do not award arbitrary client-generated XP. IREN is not presented as posting, moderating or awarding rewards automatically.

## Trust boundaries

- Public reader: anonymous, read-only API Worker; never forwards members' cookies or credentials.
- Invited-member writes: existing verified session, same-origin request metadata and rate-limiter at the Member Worker. Public preview Workers cannot reach these write paths.
- Staff controls: Cloudflare Access identity verified server-side before any moderation data read or action; independent of popularity/rating.
- Studio / staging DB: separate from legacy V5 systems and RHEN. No brokerage, payments, cross-creator private data or arbitrary creator-uploaded code used in feed.
- When publishing is disabled, the interface must explain exactly that instead of displaying fake messages or invented likes.

## Acceptance evidence

Integration: integration/community-posts.integration.test.mjs checks staging migration, private submissions, staff approve/reject/hide transitions, approved public reads, member reactions, revision/rate limits, replies and the absence of hidden data. It runs in isolated in-memory SQLite; it does not mutate real D1.

Browser: test/capture-community-feed.mjs checks desktop 1440px and phones 390px/320px against explicitly marked **offline synthetic fixtures**. Checks single header, real configured API calls, project spotlight, categorized public feed, maker links, no fabricated community posts, menu and removed Orbit Align route, and horizontal overflow. The public workers.dev review forwards only anonymous GETs, serves no DB/auth/secret bindings, and sets noindex.

This development review is **not** approval to change anevum.com production, open registration or automatically publish posts. Owner design feedback and real multi-account staging acceptance remain required.

## Next implementation gates

- Genuine discussion replies compose/edit/report, staff review and private moderation interface.
- Rate-limited following and subscribed creator activity, with notification preferences.
- Efficient deterministic hot-score time decay and anti-manipulation reporting.
- Creator-owned artwork/media upload with rights checks and human review.
- IREN editorial role with signed provenance, independent human override, audit and replay.
- Real accessibility and abuse-evaluation results across touch, keyboard and screen readers.
