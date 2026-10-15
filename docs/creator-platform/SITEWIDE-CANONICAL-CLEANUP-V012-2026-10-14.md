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
