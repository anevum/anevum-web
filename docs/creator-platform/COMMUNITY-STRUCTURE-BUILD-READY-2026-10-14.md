# Creator V1 — Community-first website restructure: build-ready architecture

**Session:** `ANEVUM.WEB.BUILD.2026-10-14.002.COMMUNITY-RESTRUCTURE`  
**Status:** proposed structure + source-only IA candidate, no public release authorization.  
**Starting point:** staged V006 release branch `release/a-staging-community-v006-20261014`, [PR #391](https://github.com/anevum/anevum-web/pull/391). Canonical integration still requires review against [visual PR #388](https://github.com/anevum/anevum-web/pull/388), [member signup #390](https://github.com/anevum/anevum-web/pull/390), [private uploads #393](https://github.com/anevum/anevum-web/pull/393), and [Home Screen #405](https://github.com/anevum/anevum-web/pull/405). **Do not merge stacked drafts indiscriminately.**

## 1. Locked boundaries
- Reuse the approved V006 cinematic cosmic imagery, 01 ORBIT identity, dark layered panels, tactile controls, typography and motion. This is an **information architecture and interaction cleanup**, not a visual redesign or migration to legacy V5.
- Preserve public `anevum.com` construction/countdown; `a.anevum.com` is canonical visual staging; do not deploy this draft, enable signup, change DNS/Workers/D1/R2, increase spend or touch owner Lab/RHEN.
- Keep the real current API catalogue and community feed; no synthetic creators, trending, forum activity, "played" counters, unread messages, awards or enabled controls.
- Keep project ownership, identity, member/staff separation and all existing deep URLs intact. Front-end navigation never unlocks a gated backend capability.
- Existing registered member, uploader, project editor, XP, private assets and moderated threads must be integrated only after accepted independent A → staff → guest → B end-to-end verification.
- No Apple Developer fee or native app required. Installable website is a separate draft #405.

## 2. One information architecture, one route owner
| Experience | Canonical destination | Current source / compatibility |
| --- | --- | --- |
| Homepage dashboard | `/` | Existing `CinematicLandingPage` + `CommunityHomeFeed`; preserve real-data selectors, hero art, community-first ordering and useful empty state |
| Discover all media, games, apps and creators | `/discover` | Existing `DiscoverPage`; project `/projects/:id`, creators `/creators/:handle`, directory `/creators`; no invented filters |
| Community public forum | `/community` | Existing `CommunityPage`, `HotCommunityPosts`, `/community/posts/:id`, staff-reviewed `/community/write`; forum before roadmap/marketing modules |
| Personal account/dashboard | `/account` | Existing `MemberGate`, `MemberAccountPage`; XP and achievements only server-verified |
| Creator Studio within Account | `/account/studio` | Reuse `MemberProjectsPage`; existing `/create`, `/create/new`, `/create/:projectId` remain valid alias/deep editor routes; no destructive redirects |
| Personal library | `/library` | Existing member-owned saved projects only |
| Profile settings | `/account/edit` | Existing member profile editor |
| Optional extra routes | `/levels`, `/boards`, `/guide`, `/start`, `/status`, `/atlas`, `/workspace` | Still deep-linkable; optional quick search and contextual surfaces rather than eleven permanent header items |
| Private messaging/collaboration | NOT ROUTED | Needs consent, block/report, moderation, storage and cost policy first |

Top header: home logo, accessible search/quick finder, member icon and one pop-out navigation menu. Primary drawer only Home / Discover / Community / Account; grouped supporting links for Creators/Levels/Guide and account-only Studio/Library/Profile Settings. Preserve keyboard shortcut, escape/outside dismissal, browser history, empty/loading/error flows. The cinematic side rail remains a shortened desktop context aid, not a second competing full sitemap.

## 3. Homepage dashboard contract
First screen: existing branded hero with an authentic approved featured creation when available; no fabricated creator, ranking or card. Under the hero: one real chronological **community index** mixing approved projects with approved forum posts; linked creator profile cards and honest empty states; filters apply only to loaded excerpt. Portal gateways remain available for discover, play, learn, community and Account-based Studio, but should not outrank the activity dashboard. Later personalization is gated on real signed-in APIs and meaningful consent. No extra homepage API fanout or new autoplay/motion.

## 4. Forum and ANEVUM community participation
- A thread has id, author identity, topic, title, body, created/edited state, optional linked project, safe reactions/replies, moderation and reporting. Thread deep links stay stable. Project and creator pages link relevant discussions.
- Existing moderated public `CommunityPostPage` and `HotCommunityPosts` become primary rather than building a second comment system. Threads remain hidden until staff-approved, and unavailable API returns truthful closed state.
- Four useful topic groups: Games & Play, Software & Making, Art/Media/Stories, Site Feedback & Collaboration; implement as **real moderated topic filters** only when the backend supports them. No fake category hubs or empty forums asserted as busy.
- Community-assisted ANEVUM improvements: feature proposals, bug reports, approved art/design contributions, documentation patches, code contribution via reviewed GitHub PRs. Contributor names/credits only with consent and rights, staff review and no live CSS/HTML/code deployment from posts.

## 5. Member dashboard / Studio
- `/account` owns profile, notifications availability, verified account XP/artifacts, earned game-specific trophies when authorized, library, collaboration availability, settings and creator tools. Member-specific details stay behind the existing `MemberGate`.
- Studio editor remains the current `MemberProjectsPage` and `ProjectEditorPage`: private draft → upload/link/disclosure → staff review → approved release with immutable assets, changelog and takedown. Existing `/create*` routes remain until safe migration and inbound link review.
- Personal account includes a clear non-clickable **collaboration not yet available** explanation; no fake messaging inbox.
- Use present UI surfaces and styles; do not redesign the personal award cabinet.

## 6. Private messaging and project collaboration — future gated service
Separate **DM** (consented 1:1 messaging) from **project room** (invite-only, durable project association). Proposed data model: `conversation`, `conversation_membership`, `message`, `attachment`, `project_room`, `room_member_role`, `asset_revision`, `project_release_link`, `report`, `moderation_audit`. Roles `owner`, `editor`, `reviewer`, `viewer`; identity must be server-derived, not supplied as arbitrary member ID by a client.

Flow: request/consent → room invite acceptance → role-authorized discussion/private file sharing → quarantine/signature and malware checks → reviewer notes/version revisions → explicit owner submission to Creator Studio → independent staff moderation/public release. Private attachment never becomes public merely by appearing in a room. Per-member and platform-wide storage/egress caps, abuse/block/report, revocation, exports/erasure, retention limits, room deletion and audit must be designed before API access. No public messaging or presence counts before security and policy acceptance.

## 7. Creator-controlled game/app achievements — future gated integration
Proposed entities: `achievement_definition` tied to published `project_id` and version, `game_integration` with approved origin/backend identity and scopes, `achievement_event` with unique idempotency key, `member_award` and moderated reversal reason. Creators can design project-specific achievements but never mint global ANEVUM XP or modify another person's account.

Award flow: member explicitly authorizes game integration → trusted game server emits signed/scoped event with authenticated ANEVUM member linkage and unique event id → server validates project, definition, consent, rate, proof and duplicate → reversible member trophy record → optional profile cabinet display. A public HTML5 game cannot be trusted merely because its JavaScript claims a player won. Owner can revoke integration, abuse report and rollback. Global XP bridge (if any) is a separately simulated, capped, approved rule under #337; no passive plays, pay-to-rank or farmable awards.

## 8. Player and mobile contracts
Keep external game/app launchers honest at P0. Approved safe images/audio/documents later select specific native viewers after quarantine/asset approval. HTML5 or third-party game execution must be on a separate isolated site origin (not authenticated ANEVUM), with trusted communication only through scoped server validation. Project URLs and personal saved library should work on phones; optional Add to Home Screen needs real iOS/Android acceptance. No Apple fee/SDK store requirement.

## 9. Build order and acceptance gates
**Slice A — source-only IA now:** shared route map, short global/drawer navigation, preserve contextual cinematic rail, collapse duplicate navigation on homepage, show Account → Creator Studio, make forum threads primary. Route regression tests, no backend changes.
**Slice B — authentic core journey:** real member identity, creator edit/submit, independently privileged moderation, real public guest discovery, independent reviewer save/feedback and XP, backup/restore/privacy; unblock #325/#328/#329/#331/#332/#333.
**Slice C — creator asset players:** R2 quarantined assets/derivatives after accepted PR #393, scanner, quotas and review manifest; safe viewer registry; #405 optional web install acceptance.
**Slice D — collaboration pilot:** one private invited room, no public DMs, deletion/consent, first-party member/role isolation and fake-event resistance, cost gate.
**Slice E — achievement pilot:** one rights-cleared trusted game/app with idempotent scoped awards; do not credit global XP without a separately approved rule.

**Required source/acceptance evidence:** exact commit SHA; CI TypeScript, two Vite builds and Node tests; viewport screenshots 1440/1024/390/320; direct-refresh, back/forward, focus/escape and out-of-menu taps; none of account/DM/upload/award paths leak into read-only public staging; visual side-by-side before/after with unchanged art assets and major CSS. Reviewer completes member A/staff/B separation. Rollback source-only via closing PR; later staging rollback via restore previous verified Worker deployment, not by restoring a retired V5 deploy.

**No duplicate issue program:** implement under canonical #325, feature owners #328 identity, #329 publishing, #331 community, #332 security, #333 release, #335 visual, #337 XP. #308 remains launch ops. Later full messaging/game integration requires bounded scoped approval as part of the existing trackers, not speculative P0 scope.
