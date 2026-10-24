# Continuance NEXT: Community and Profile Experience

Session: `ANEVUM.WEB.DESIGN.2026-10-23.003.COMMUNITY-PROFILE-EXPERIENCE`

**CONCEPT REVIEW ONLY. Not production implementation, owner visual acceptance, or deployment authorization.**

Base: draft #676 at `ec8ad65d687662fbc38cb0e2d6ea92875dd79ab9`. Successor work stays separate from V131 publication, Studio #658, public surfaces #667 and migration0014. #325 remains the engineering board; #335 owns visual review.

## Product direction

Community is the social heart of ANEVUM's existing creator-discovery platform, not a new Commons subproduct or a generic social feed. The internal Commons label describes a gathering place. Use Community in canonical navigation.

Retain the orbital mark, transcosmic/Continuance Institute atmosphere, midnight/bone/copper/lavender language, and cinematic editorial hierarchy. Make working areas calmer and denser than public introductions. Do not restart the framework, identity, account model or publication pipeline.

## The seven concept surfaces

| Surface | Experience | Preserved integration contract |
| --- | --- | --- |
| Community | Human-first arrival, paths into people/conversation/identity, approved-public signal board | `/community`, existing public projects, discussions, creators and capability/status APIs |
| Discussions | Topic filtering, useful questions, feedback and moderated composition | Existing post/forum routes; authenticated writes and staff review remain authoritative |
| Discussion reader | Readable original post, author identity, project context and separately approved replies | `/community/posts/:id`; no pending private replies in public views |
| People directory | Searchable public creator channels and opt-in member identities | `/creators` and public member directory; never enumerate private accounts |
| Creator channel | Expressive cover, original published work, updates, credits and genuine recognition | `/creators/:handle`, existing identity resolver and public catalogue; no inferred account ownership |
| Public member world | Personal cover/avatar/headline, public wall, shared creations, recognition and biography | `/@handle`, canonical public profile/space/wall endpoints; independent wall failure must not hide an otherwise valid profile |
| Private My space | Profile composition, local preview, theme and explicit visibility | `/member`, existing Better Auth identity, private-first claim, immutable beta handle, revision-aware save and authoritative readback |

Creator channels, member worlds and private account settings share components but not permissions. The existing resolver may connect verified identities; matching handles or email must never merge them.

## Concept source and scope

`creator-v1/web/review/continuance-community-profile/index.html` is a self-contained offline HTML study. It adds no npm dependency and makes no network request, account write, storage write, AI call, XP change, or real publication. Every sample identity and content record is explicitly fictional. Follow/save/reply/composer controls demonstrate local states only.

The downloadable conversation package contains the longer page specification and desktop/mobile screenshots. This repository note is the integration brief; screenshot attachments and the expanded local package are not committed here.

## Reusable design system

- Wayfinder: clear desktop navigation and reachable mobile navigation. Reconcile with the existing Shell and PortalLauncher rather than stacking two production navigation systems.
- Signal Board: content kind, human author, topic, approved state and relevant next action. Do not fabricate engagement or equate outbound clicks with confirmed plays.
- Conversation Paper: restrained reading typography, clear original/reply hierarchy, source context and review receipts.
- Identity Plate: adaptable cover, avatar/handle, readable introduction and verified optional distinctions. Preserve existing earned artwork, role indicators and owner appearance settings.
- Creator Passport: approved releases, honest destinations, compatibility/cost/rights/AI disclosure and verified credits.
- Member World: selective public expression, not a view into private Studio or account records.
- Profile Composer: real labels, bounded text, explicit privacy, preview, unsaved-state handling, revision conflict feedback and account-switch clearing.

## Required production behavior

Community filters and topic-room filters must remain independent. Preserve URL query, sort and cursor pagination. Distinguish loading, no matches, empty, service unavailable and permission denied; concept in-memory filtering is not production search.

Public content is approved and currently visible, not merely known by ID. Render untrusted text as text. Validate linked project/destination identity independently. Pending posts/replies remain visible only to their author and authorized reviewers. Reactions, follow/save controls and publication must depend on actual server capability, authenticated ownership, revisions and moderation.

Create profiles private-first; publish only through a later deliberate verified save. Public endpoints must not distinguish a missing identity from a protected identity. Keep email, provider accounts, private drafts, exports and deletion controls outside public layouts.

XP/levels/earned rewards remain server-ledger driven and independent of paid appearance and staff authority. Do not change reward rules as a side effect of UI work. A failed recognition service does not authorize invented progress or deletion of an existing public identity.

Keep one IREN companion. Production contextual help uses the existing `anevum:iren-open` event and route anchors; no duplicate assistant, model session, tour or notification system.

## Integration sequence

1. Owner reviews actual desktop-first (1440px) and matching phone (390px) concept captures, with fictional content clearly disclosed.
2. Reconcile #667's shared public surfaces before editing CommunityPage; preserve real catalogue/query/moderation behavior. Reuse #676's scoped tokens and reusable components.
3. Adapt Community and discussions to existing APIs behind isolated review controls. Do not replace production App/main/Shell through this concept PR.
4. Integrate creator channels and public member worlds separately, preserving identity resolution and independent profile/wall failures.
5. Connect private profile editing to existing canonical account/revision validation and verified server readback. Retain export/deletion and account switching.
6. Run complete React integration, visual/accessibility/security and real-account acceptance. Reconcile current approved release head and obtain separate release approval.

## Validation boundaries

The initial standalone study was checked locally with Chromium across 320/390/768/1024/1440/1920px, with 12 desktop/mobile captures. The original local pass comprised 36 top-level layout checks and 13 interaction checks. Browser automation used an in-memory HTML document, not a hosted deployment.

Those checks do not establish full WCAG compliance, physical iPhone Safari, production performance, real account/member isolation, genuine moderation, persistence, integrations, server field validation, or production availability. The initial study also leaves keyboard-tab semantics, per-person destination fidelity and complete motion choreography for refinement; do not treat an introductory visual prototype as accepted product behavior.

## Owner decisions still open

Community content density and hero prominence; desktop rail versus existing global navigation; profile cover treatment and theme presets; balance of projects and conversations; and contextual IREN presentation. Preserve already selected Orbital identity and real earned reward assets. This first proposal is not approval to create a new brand, product, data model or permission policy.
