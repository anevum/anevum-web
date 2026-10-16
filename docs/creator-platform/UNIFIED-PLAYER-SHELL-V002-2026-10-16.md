# ANEVUM / Unified Player Shell V002 — Implementation handoff

Session: ANEVUM.WEB.BUILD.2026-10-16.001.UNIFIED-PLAYER-SHELL
Parent: ANEVUM.WEB.DESIGN.2026-10-16.001.UNIFIED-CREATOR-PLAYERS
Status: SOURCE ONLY / DRAFT / NOT MERGED OR DEPLOYED.
Base: build/levels-awards-alerts-v031-20261016 at f3d5ba451472ba978ac53243eb7f0cbcceeff194.

## Implemented source
- Larger cinematic player stage on the canonical published /projects/:id route. Desktop public passport sits beside it; mobile passport stacks after it.
- Existing authentic project title, description, local ANEVUM category art, creator identity, AI/human disclosures, public source, ratings/saves, community conversations, creator links and licensing remain.
- Truthful Play/Try/Open/View Source actions based on existing safeExternal HTTPS checks; source-only and no-link states are explicit and never claimed to be runnable.
- Native Share or copy-link fallback, anchor navigation, 44px touch controls, reduced-motion and high-contrast support.
- Category-driven client player selector, tested by Node with TypeScript stripping. Does not grant privileges, create analytics evidence or mint XP.
- No invented projects, user activity, review counts, downloads or media.

## Excluded, not implicitly enabled
No developer HTML/JS iframes, direct Creator ZIP execution, private R2 key access, new upload viewer, public media CDN, video/3D runtime, external gameplay attestation, gameplay XP, signup changes, database migration, Worker or network changes. Source-only code and unvalidated projects remain outside the native runtime.

## Acceptance before release
1. CI exact source: TypeScript, both Vite builds, test/player-registry-v002.test.mjs and existing Creator V1 regressions.
2. Visual owner review: actual project route with approved real work at 1440/1024/390/320, supported phone Safari.
3. Accessible focus and reading order, back-link retention, no overflow, no auto navigation or sound, keyboard/clipboard/share behavior, reduced-motion and failed-link fallback.
4. Cross-account and guest states for original MemberEngagementPanel and ContextDiscussions unchanged.
5. Source/publishing/privacy release gates #325/#329/#332/#335 before integration into active staging; no production or public-launch deployment without explicit approval.
