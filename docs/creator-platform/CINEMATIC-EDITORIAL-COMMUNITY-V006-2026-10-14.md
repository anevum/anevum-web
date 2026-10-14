# ANEVUM / V006 tactile editorial community experience

Session: ANEVUM.WEB.DESIGN.2026-10-14.001.TACTILE-EDITORIAL-COMMUNITY
Visual inheritance: owner-selected October 14 cinematic concept images and existing V005 draft. Typography reference: Continuance Institute / Transcosmic document styling **as a design influence only**, not a fictional brand identity for the ANEVUM community platform.

## Purpose
The new homepage is an ongoing public community index rather than a set of duplicate promotional shelves. The most valuable public surface is a real item beside the identity of its real creator. Every category has its own discoverable home. The documentation-inspired serif editorial titles, index metadata, subtle numbered panels and microtype coexist with the cosmic indigo/violet/cyan art.

## Implemented in the V005 draft branch
- `CommunityHomeFeed.tsx`: one chronological public index mixing genuine published projects from the existing API with already-reviewed community posts **only** when the existing feature capability is active. Projects and posts are separate typed records. Sorting uses available published timestamps, not claimed popularity.
- Linked creator attribution beside each card; public handle navigation, genuine published-project count when the creator appears in the public creators response. No fabricated avatar uploads, follow counts, rankings, badges, presence or notifications.
- Bounded category index, creator directory and actual public board/Studio/Levels links. Category latest entries are chosen from the existing fetched public page; this is **not** a site-wide award or editorial recommendation. Avoid calling these category entries `featured` until a moderator/editorial data contract exists.
- `tactile-editorial-v006.css`: physical edge/light/shadow, pill actions, round content frames, press and lift states, editorial serif headings and monospaced index labels. Reduced motion, forced colors, keyboard focus, narrow-phone composition.
- Consolidated V005 homepage: remove redundant `CinematicCatalogueSections`, `CinematicDiscoverySections`, `HotCommunityPosts`, category duplicate strips, private RHEN/XP dashboard promotion and repeated modules **from the homepage only**. Those source modules and existing routes are not deleted.
- Keeps V005's decorative approved art and genuine published API, private MemberGate, staff review authority, independent Atlas, RHEN owner isolation and public production Worker untouched.

## Design direction
- Material language: large-radius panels (18-26px), tactile buttons with inset top highlight and a physical bottom edge; movement is subtle, never a glint sweep or constant pulsing glow.
- Typography: serif titles with warm archival proportions; concise modern sans body; precision monospaced index/time/section markers; no total-site giant all-caps.
- Density: a compact welcoming cover followed immediately by readable posts and creator cards. Avoid repeating category/product sections; use the right rail only for category latest, creator directory, community paths.
- Identity: use actual public creator channel, not generic avatar avatars presented as uploaded user photos. Letter icons are honest fallback.
- Bots/indexing: a read-only scheduled **future** curation/indexing service may surface latest verified items per category and public site notices. Moderator picks require an authorized editorial record; do not invent auto-generated awards or override moderation.

## Before any staging/release
1. Run exact-head TypeScript, both frontend builds, V005/V006 tests, member/staff/privacy checks.
2. Obtain real compiled browser screenshots at 1440/1024/390/320px, across nonempty and zero-content fixture states. Verify 200% zoom, focus, motion reduction, no horizontal overflow, and type/crop at mobile width.
3. Verify project and discussion links, creator handle privacy, actual API availability, empty discussion capability, and no unauthorized content exposure.
4. Confirm chronological ordering and page-limit semantics; current combined feed is a **bounded homepage excerpt**, not a fully paginated site-wide timeline.
5. Test actual hosted staging login, forms, OAuth and project publishing in their separate reviewed branches only. Signup PR #390 is not implicitly merged.
6. Seek owner visual signoff before deployment to `a.anevum.com`. Production `anevum.com` stays as the January 1, 2027 launch terminal until explicit authorization.

## Not implemented
Real editorial bot pipeline, per-category moderator-pinned features, uploaded thumbnails, public creator avatar delivery, new likes/follows/private messages, reactions, realtime notifications, algorithmic ranking, per-user personalized feed and deploy. These require their own truthful backend/API, moderation and privacy contracts. The current component does not imply that any of those already work.
