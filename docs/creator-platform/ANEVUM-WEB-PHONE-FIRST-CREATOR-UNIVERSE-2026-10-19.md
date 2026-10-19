# ANEVUM Creator Universe — Phone-first Unified Experience

**Session:** ANEVUM.WEB.DESIGN.2026-10-19.001.PHONE-FIRST-CREATOR-UNIVERSE  
**Status:** Design-only implementation contract; not deployed  
**Parent:** V091 #554, `build/v091-experience-integration-20261019-001` at `6e04e2bb6a895afd62d9f004d626c0b90f84b656`  
**Development owner:** Existing engineering board #325; creator publishing #329; locked doctrine #344.

## Product promise

Someone with only a phone can make a simple game or creative project directly in ANEVUM, privately save and playtest it, submit it for moderated approval, and find the published version on their own optional public space and in Discover. Beginners should never need ZIP, GitHub, HTML, or a separate website. Experienced creators may import HTML now and multi-file ZIP packages only after security and runtime approval.

**One canonical member ID + one project ID + one publication lifecycle.** Do not build competing member spaces, creator registries, upload systems or public destinations.

## Existing assets to reuse

- V091 #554: unified shell, creator-route identity repair, project-card identity and QA gates (draft, not deployed).
- Live alpha documented on `alpha/player-uploader-20261018`: `/upload`, staff-reviewed self-contained HTML, approved Single Drift, isolated player, Discover adapter; signed-in and iPhone acceptance still pending.
- Canonical private Studio: draft/edit/attachments/review receipts in member session; currently does not directly approve/publish to public catalogue. Its pending review states must never be reported as published.
- Safe text/branching Workbench #466 and portable `.anvg/.anva/.anvs/.anvw/.anvp` native pack editors #486; quarantine-only pilot #497; immutable ZIP/runtime draft #516. All are **unmerged draft resources**; reconcile their data contracts, never blindly merge their old branches.
- Existing V078–V091 earned player cards, true XP, IREN, protected founder/reviewer grants, moderation, public/private identity and current projects stay unchanged.

## Information architecture

Primary phone navigation: **Discover / Create / My Space / Community**; Creator Studio reachable directly from Create and My Space. Desktop uses a compact left rail and contextual player-card identity. Do not replace V091 navigation wholesale until the responsive acceptance gates.

| Surface | Target / retained route | Responsibility |
| --- | --- | --- |
| Discover | `/discover` | Real released projects, phone-usable filters, verified activity only |
| Quick Create | `/create` | Visual starter selection, safe scene/story/quiz composer |
| Editor | `/studio/:id/edit` (proposed) | Scene outline, declarative blocks, media, private autosave and preview |
| Studio | `/studio` | Owned drafts, review status, releases, analytics, settings, version history |
| My Space | `/member` | Owner-only dashboard, wall, public visibility, pinned released projects, earned card |
| Public world | `/@handle` | Public profile, earned identity, approved pinned work, updates; respect privacy |
| Project/player | `/projects/:id` | Creator content first, play, immersive, save, discuss, report |
| Staff review | `/staff/projects` | Independent authentic staff review; no client-side approval |

## Design system

Continuance Institute premium midnight/navy. Tokens: background `#070D19`; surface `#0E182B`; raised `#17253F`; text `#EDF4FF`; secondary `#B4C4DC`; functional create/focus cyan `#A6E7EF`; orbital violet `#C6B3F0`; earned rose-gold `#D8B8A0`. Restrained 120–240ms interaction motion, never motion-dependent semantics; reduced-motion alternative. Display serif for meaningful section leads; readable sans-serif for controls. Genuine approved creator screenshots for project art, never generic stand-in art or fabricated metrics. Every touch action >=44px; 320/390/768/1440 responsive gates and iOS safe areas.

## Quick Create / P0 vertical slice

1. Home/Create offers one obvious **Make a Mini-game** action.
2. Creator enters a title and edits a scene's narration, adds 2 choices and a second scene with destinations.
3. Playtest renders only validated React/declarative content in an on-page stage.
4. Revisioned **private autosave** with visible Saved/Saving/Offline/Conflict states; queued local edits do not imply server persistence.
5. Private Studio shows draft and local playtest; import and export of validated portable native pack is an advanced option.
6. Creator enters straightforward rights/credits and submits for independent staff review.
7. Immutable staff-approved version becomes indexed by project ID in Discover, creator portfolio when public, and canonical project player. A private profile never leaks a real handle merely because the project is public.
8. User B can play and use enabled genuine review/save/report functions. Creator makes a v2 draft without mutating v1; reviewer approves the next release or rolls it back.

Next P0 template families: safe interactive stories, gallery, audio playlist and quiz. In-product media upload only after scanning, quotas, ownership checks and safe moderation.

## Personal world

Owned `/member` and public `/@handle` must use the same canonical identity. Public world shows genuine banner, portrait, earned player card, bio, pinned released projects, release grid, creator updates and moderated discussion. **Released project references are server-derived**, not wall text that the creator manually pastes. Owner drafts and project analytics remain private.

Keep project visibility, profile visibility and attributed public creator identity as separately reviewed choices. Hide private identities and permissions. Do not leak email, staff grants, drafts, private assets, account status or hidden rewards.

## Player

Prefer real playable app/gallery/story over category artwork. On mobile show stage first, title and author, then Save/Share/Review and detailed passport. Desktop stage dominates 65–80% of useful width. Immersive mode resizes the **same** iframe/render tree without remounting or losing session; Exit/Options remain accessible, Back/Escape exit, Safari visualViewport and safe-area fallbacks. Restart is explicit. Error offers Retry/Details/Report instead of a blank frame.

Declarative native packs render with trusted data-only components. Untrusted HTML and future ZIP packages remain sandboxed without account-origin privileges and ultimately require a **separately registrable** execution origin, strict CSP, allowlisted postMessage, safe storage and quotas. No user project may mint XP or gain IREN/staff/RHEN access.

## Publication and infrastructure contract

Core entities: CanonicalProject(ownerMemberId, projectId), DraftRevision, CreatorAsset, Submission, ReviewDecision, ImmutableRelease, PublicProjection, FeaturedProjectPin, Engagement, ProjectEvent. A release pins content hashes, licenses, provenance, public attribution status and moderation receipt. Staff approval emits an idempotent outbox event. Reconcile cross-D1 public projection asynchronously; do not assume cross-database atomic commits. Revocation/takedown must hide unsafe releases promptly and preserve audit trails. Distinguish `draft`, `submitted`, `changes_requested`, `rejected`, `approved`, `published`, `archived`, and `removed` honestly.

**Do not** create a new role/identity mapper based on handle equality. Do not expose quarantined R2 objects or automatically publish private Studio attachments. No arbitrary scripts in canonical web origin; protect auth, CSRF, rate limits, revision conflicts and account deletion/export.

## Age and privacy boundary

Product must be learnable by a child, but general child account eligibility is **not approved**. Complete age eligibility, parental-consent rules where relevant, privacy, content labels, communications limits and moderation before onboarding minors. Default drafts private; no inferred location, exact age, contact details or public identifying information.

## Acceptance and delivery

**Gate 0**: Finish V091 #554 authenticated owner/reviewer, guest and iPhone Safari acceptance; ship existing guarded release before unrelated expansion.

**Gate 1**: Build typed private Quick Create two-scene flow on canonical Studio with autosave, revision conflict and local preview; independent two-account privacy tests.

**Gate 2**: Unite Create/Studio/Upload navigation, implement immutable reviewed release bridge, project ownership and approved creator-space indexing. Staff remains independently authenticated.

**Gate 3**: Native pack hosting/renderers, actual artwork/screenshot pipeline, phone-first immersive player, version history, saves and moderated feedback, privacy-minimized analytics.

**Gate 4**: Separately certified ZIP app import/runtime, additional formats, licensed collaboration/remixes.

**End-to-end proof:** on iPhone 390px, creator A builds a two-scene game without code, saves and resumes, gets independently reviewed; guest B sees a public playable project and the corresponding optional creator world; unrelated member B saves or reviews legitimately; A updates to version 2 without changing published URL or XP; private profile and rejected content remain hidden. Repeat at 320px and 1440px. Confirm rollback, reporting, keyboard, motion and session safety.

## Status

This is a design record, **not functional code or production deployment**. The standalone local HTML prototype is supplied separately for interaction review; its approval button is a simulation, not a staff action. The detailed standalone README and prototype were generated in the associated design handoff. All real build work should continue from V091 and the existing project engineering board.
