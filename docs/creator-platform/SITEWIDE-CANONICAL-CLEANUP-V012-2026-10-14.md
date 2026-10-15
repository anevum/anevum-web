# V012 — Site-wide canonical design and navigation cleanup

**Session:** `ANEVUM.WEB.UPDATE.2026-10-14.001.SITEWIDE-THEME-CONSOLIDATION`
**Date:** 2026-10-14 | **Parent:** V011 `f3d7bf3d029fb0be92bb04515ef121264becf3df`.
**Authority:** #344 product doctrine, #325 engineering, #335 creative review, #308 launch.

## Locked, kept and unified
- Creator V1 authentic approved projects and public creator channels, read-only moderation-gated community, project passports, free guest discovery, member participation, XP/awards and safe private Creator Studio.
- One production-intended React `Shell` rather than the conflicting secondary Atlas/Morph global shell.
- Home / Discover / Community / Creators top navigation. Contextual Boards, Levels, Member profile, Library and Creator Studio appear in the directory; Start, Guide and Status remain in footer/search.
- All actively routed boards and discussion detail/editor links now point to the same canonical page paths. Historical `/atlas/*` deep links redirect to existing canonical routes; `/atlas/experience/:id` resolves to the genuine published project passport.
- Shared cinematic V009+V010+V011 theme tokens, display/technical typography, rounded glass surfaces, keyboard outlines, mobile touch targets, reduced motion and forced-color styles applied to legacy boards, discussion and member pages.

## Retired from public experience, preserved in source
- `/atlas` spatial/Morph second site shell, future Signals/Collaborate demo pages, and the unapproved focused experience/player.
- `/workspace` owner Lab and personal portfolio promotion. That public route now resolves through private member access. No underlying Lab service, portfolio static assets or legacy source files are deleted.
- Public "The Commons" subproduct terminology, oversized duplicate popup directory entries and portfolio listing on Platform Status.
- Old V5/RHEN public product promotion; no private RHEN brokerage data enters Creator V1.

## Deliberately held
- Canonical Better Auth accounts (#403), cross-system member linking (#402), selected showcase artifacts (#397), private upload proposals (#393) remain separate unmerged development branches. They need security/release reconciliation, not silent adoption.
- Real moderated creator/member journey, rights-cleared first published work, age and privacy policies and owner visual sign-off remain release blockers.

## Release and acceptance
Source-only draft. Verify exact-head build/CI and review real compiled Home, Discover, project, creator, community, boards, post, XP, public gate, account, Studio, private draft and error/empty screens at 1440/1024/390/320 widths. Check keyboard, 200% text zoom, reduced motion, contrast, link redirects, actual account isolation and moderation. Final owner visual review required.

**Not authorized or executed:** merge, `a.anevum.com` staging deployment, `anevum.com` January 1 construction replacement, new OAuth signup, D1/R2 changes, member data migration, role privilege expansion or public publication.

## V012 verified browser acceptance (offline synthetic fixtures)

- Exact head `1ef109e98632f0d4af409c3c92bd9937e0a19396` passed Creator V1 Verify [run 38677031882](https://github.com/anevum/anevum-web/actions/runs/38677031882). The run contains 48 **actual Chromium/Vite screenshots** of 17 named route states: 17 desktop at 1440px, 17 mobile at 390px, plus 7 key pages each at 1024px and 320px. Captures include a synthetic fixture notice, not actual account or live-site activity.
- Checked: one cinematic Shell, one global header/main, no Atlas second-shell, historical board redirect, no horizontal document overflow, and mobile Levels paragraph width with emblem decorative positioning.
- The mobile Levels hero initially squeezed text due to its decorative orbit emblem; a V012 responsive override now makes the emblem absolutely positioned and confirms readable copy at 390px/320px.
- A follow-up code check on this PR requires shared computed design tokens, rounded menu controls, and **no stale Atlas/Experience/Workspace/Portfolio/owner-Lab links** anywhere within rendered public navigation and content. It fails if the superseded "The Commons" product name reappears in a rendered main page.
- These tests protect continuity, but **do not constitute human visual acceptance**. Security, live signup and end-to-end real creator publishing remain separate acceptance gates.

### Public route disposition (stable until owner approves otherwise)

| Surface | Decision | Primary reason |
|---|---|---|
| Home, Discover, Project passport, Creator directory/channel | KEEP | Core approved creator-discovery loop |
| Community, public Boards, moderated post detail | KEEP | Genuine community submissions and conversation |
| Levels, recognition/account/library | KEEP | Locked participation/earned progression; member writes still gated |
| Member profile editor, private draft and Creator Studio | KEEP PRIVATE | Needed for creator participation; not open enrollment |
| Start, Field Guide | KEEP SECONDARY | Free onboarding/learning; not extra global menu items |
| Status | KEEP SECONDARY | Accurate staging/availability disclosure; not a marketing portal |
| Atlas/Morph, spatial universe, focused experience, Signals/Collaboration prototypes | ARCHIVE SOURCE / RETIRE ROUTE | Multiple competing site shells and unaccepted features |
| Owner Lab, RHEN, portfolio and historic V5 | SEPARATE / NO PUBLIC PROMOTION | Not the public Creator V1 product |
| Public sign-up activation, universal hosting/runtime, rich DMs, payouts and unofficial leaderboard signals | HELD / NOT PRESENTED AS LIVE | Security, cost, rights and product-acceptance gates |

**Developer note:** This disposition concerns current public routing and promotions. Archived source code and historical reports remain intact for rollback and reference. The public route inventory is not an instruction to delete member data, copyrighted assets or owner tools.
