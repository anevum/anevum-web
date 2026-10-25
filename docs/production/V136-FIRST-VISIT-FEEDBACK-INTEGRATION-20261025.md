# V136.026 — First-visit clarity and external feedback integration

Session: `ANEVUM.WEB.UPDATE.2026-10-25.006.FIRST-VISIT-FEEDBACK-INTEGRATION`  
Coordination: `ANEVUM.ANEVUM.PACKAGE.2026-10-25.001.UNIFIED-WORKSTREAM-CONTINUITY`  
Scope: existing public homepage, First Visit, Status and existing feedback/IREN streams.  
Source: `SRC-20261025-LI-001`, one consenting external first-time participant, summarized without identity or private-message contents in [#719](https://github.com/anevum/anevum-web/issues/719).  
Status: **ACTIVE DEVELOPMENT / DRAFT, NOT DEPLOYED**. Design priority is clarity and task completion, not another renderer or new top-level navigation system.

## Authority, implementation owner and collision avoidance

- Existing V136 creative direction, approved October 24 concept boards and functional Studio/Wayfinder implementations remain authoritative. Do not duplicate the scene renderer, persistent five-station console, IREN dock, live search, account registration, moderated community or publisher review.
- Source starting point is #735 development head `9e1a82d250e0b5a2eca0f1555e3110cdba7c6dae`, after V136.025 Creator Directory #745 was merged into the development branch. This source-only slice is isolated at `build/v136-first-visit-clarity-20261025-001`. **Do not merge directly into main or the sealed #741 release candidate.**
- Protect the approved creator-upload-first / native-type-thumbnail-second boundary, native procedural media rather than ANEVUM-owned generated filler imagery, existing accessibility and console controls.
- IREN target patch [#747](https://github.com/anevum/anevum-web/pull/747) is independent. Its source addresses signed-in member tour steps 4 and 7, but its focused V097 browser run failed during a first-contact prerequisite before the new target assertions. Do not silently import, claim resolved or promote it. Reconcile the changes from its older #745 base onto the current website source only when targeted end-to-end QA passes.
- The separate Feedback Relay [#744](https://github.com/anevum/anevum-web/issues/744) / [#746](https://github.com/anevum/anevum-web/pull/746) owns cross-channel intake. This presentation slice does not introduce a duplicate inbox, secretly collect LinkedIn/Facebook data or create anonymous public write endpoints.

## Evidence, not extrapolation

One outside builder offered voluntary first-user feedback. These are *seven observations from one person*, not seven users, measured conversion cohorts or unanimous community demand.

| Ledger | Evidence | Product implication | Acceptance |
| --- | --- | --- | --- |
| FDB-017 | Member tour steps 4/7 could not highlight | Fix only the genuine responsive anchors in the canonical IREN component | Real signed-in member, 320/390/1440, zero missing target; back/skip/dismiss intact |
| FDB-018 | Signup described as effortless | Preserve auth, email OTP, profile/username flow, privacy | Signup unchanged; verify real external OTP in separate account acceptance |
| FDB-019 | Homepage purpose insufficiently concrete | Immediately identify discoverable work, community and access limits | In 20 seconds of an unprompted task, user can explain what ANEVUM currently does |
| FDB-020 | Navigation initially overwhelming; search helpful | Preserve search; replace ambient choices with priority hierarchy and optional explanations | Find one published project and a creator with no explanation from founder |
| FDB-021 | Suggest familiar social patterns, reduced visible clutter | Use disclosure, sensible grouping, stable links and consistent language | No horizontal overflow or buried primary action on 320px, 390px, 1440px |
| FDB-022 | Suggest incremental core releases, transparent roadmap or voting | Separate verified capabilities from non-binding Now / Next / Exploring priorities | Never label a development idea live or imply a vote has been recorded |
| FDB-023 | Interest in creative/game workflows, 3D learning | Pilot only actual tested Studio creation flow; do not promise Blender/Unity replacement | Demonstrate edit, local preview, export and eligible submission end-to-end first |

## Implemented in this draft

1. **Homepage:** Preserve V136 hero geometry, original Institute media, authentic project index, actual public search and five-station console; revise only supporting text for concrete project categories and publishing restrictions.
2. **Practical first-contact guide:** One optional panel *below* the hero (not a takeover), with real Discover, Status, Start, Join/member and Community links. Three native `<details>` questions default closed and disclose browsing requirements, Creator Studio publication boundaries, and the state of community feedback. No account state stored, no background analytics beacon, no autoplay tutorial, no second Wayfinder or IREN mount.
3. **Start Here:** Remove older static copy claiming registration or the public discussion board is universally closed. Instead point to existing routes and the Status page, which probes service/account capabilities. Joining never implies publishing permission.
4. **Public development focus:** A bounded, explicitly non-binding `Now / Next / Exploring` section on the existing Status page, *below* the read-only verified capabilities. It contains no fake voting buttons, imaginary progress counts, release dates, API mutation or commitments.
5. **Testing:** Node source and integrity contracts; compiled loopback React at 1440, 390 and 320px with real disclosure and links, Start page, Status page, keyboard-capable native elements, zero external requests and no fake account. A short custom workflow has blank cloud credentials and cannot deploy.

## Interaction and copy contract

- The first screen answers **what is ANEVUM**, **what can I do without signing in**, **where is a real destination**, and **what requires permission**.
- Limit the primary actions to the existing Discover and Join/My Space. The optional first-visit area is after these actions, before the catalogue; it must not crowd the mobile first fold.
- Search is a first-class working action already present in the homepage and header; never replace it with fake category tiles or a new search index.
- Avoid asserting ordinary members can upload, publish, vote, moderate, receive XP, use paid tools or access a complete game engine.
- Use the actual service Status route to verify onboarding/Studio/account permissions. Source-complete or feature-flagged code is **not** production access.
- User-initiated FAQ disclosure keeps keyboard focus and native accessibility, with at least 44px targets and forced-color / reduced-motion variants.
- App pages remain consistent with V136 high-definition Institute style using CSS/DOM materials, real media and no generated filler images.

## Research/measurement design — not yet instrumented

Use optional, privacy-minimized first-use testing rather than inventing product analytics:
- Scenario A, anonymous: identify ANEVUM's purpose, browse Discover, use search and open one verified project.
- Scenario B, member: complete canonical signup, verify identity, open space and understand default visibility. Record aggregate timing/failure *only with consent*; never record OTP, credentials, message bodies or private profiles.
- Scenario C, creator: distinguish private Studio access, eligible pilot upload and reviewed public release; do not invite uploads when the flag or role is absent.
- Scenario D, guided tour: IREN step 4/7 genuine target halo at phone and desktop breakpoints, including collapsed menus and an accessible fallback.
- Goal measures (future targets, **not achieved metrics**): fewer wrong-path clicks, task-completion rate, median time to find a project, first-page comprehension, disclosure use, responsive overflow failures, real session tour completion and moderated feedback follow-through. Record numerator, denominator, consent and test device when available.
- Qualitative coding uses source IDs, one respondent ID per source group, positive/negative theme, affected route, severity, confidence and evidence links. Do not double count screenshots, comments or tester accounts.

## Feedback Relay and roadmap evolution

**Current:** internal sanitized ledger #719, external voluntary messages and partial channel-specific intake. One reviewer may provide multiple findings; they remain one respondent.

**Next:** coordinate with #744 before writing any new ingestion connector. Legitimate linked notifications/API privileges only. Reddit replies can sometimes be derived from existing notifications; LinkedIn personal-message and Facebook personal-profile content are not assumed retrievable. Do not scrape private messages or expose names/screenshots publicly.

**Later, explicitly gated:** public feature-request submission / voting requires genuine authentication or abuse throttling, consent, spam and moderation controls, duplicate reduction, role-appropriate privacy, transparent vote accounting and unsubscribe/delete handling. Until implemented, the page must say voting is not available; public priorities are editorial statements, not a data-driven vote ranking.

A consenting outside tester remains an ordinary user with no implied partner, adviser, staff or developer privileges. Ask for device/browser and bounded retests only as needed; do not expose Command, private finance, user data or unfinished Studio permissions.

## QA and release acceptance

**Automatable source checks:** actual JSX parse, route integrity, current copy, no false voting or fabricated accounts, CSS bounds / focus / responsive rules, unchanged join/OTP source.

**Compiled browser gates:** 1440/390/320 first-visit panel and real links, native disclosure closed/open/closed, zero horizontal overflow, live capability Status navigation, Start Here description, no external/non-read-only requests, no extra IREN or Wayfinder. Capture screenshots/acceptance JSON with exact git head.

**Separate human gates:** first-fold concept fidelity compared to the approved October 24 visual boards, actual iPhone Safari/VoiceOver, controller focus navigation on Xbox Edge when available, genuine fresh member/OTP and IREN signed-in walkthrough, audience comprehension with more than one independent tester. The image/styling overhaul is not declared finished based on synthetic Chromium alone.

**Release:** explicitly review the PR atop the current #735 branch, preserve unrelated concurrent changes, obtain exact-head green CI and owner sign-off. Any promotion is a separate guarded release with existing Cloudflare rollback and unchanged 40 routes / permissions / D1 / bindings. Strict sealed-worker allowlist failures are blockers, not permission to weaken release guards. No changes to payments, Stripe retirement, trading, family or infrastructure are in this slice.

## Immediate next actions

1. Run exact-head source, typecheck, full-flag compilation and 1440/390/320 guest browser acceptance in the draft PR.
2. Fix observed failures and visually inspect the saved screenshots for legibility, visual hierarchy, IREN overlap and native disclosure.
3. Reconcile #747's signed-in IREN fix after its actual compiled member checks pass; keep separate and unmerged meanwhile.
4. Obtain voluntary retest by the same participant after an actual authorized release, preserving the reported signup positive.
5. Continue the **existing** sitewide V136 UI concept-fidelity work, Creator Studio viability and Feedback Relay roadmap; no new duplicate backlog or redesign.
