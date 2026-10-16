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

## V003 trust and staging-integration review — October 16, 2026
- The project passport uses approved public catalogue metadata, not independent verification of ownership, licensing or external price. Show **PUBLIC PROJECT RECORD**, **LISTED AS FREE** and **LICENSE AS LISTED** instead of implying a rights audit or guaranteeing offsite costs.
- Extended the offline browser gate with a long-title, long-summary, long-creator-name synthetic fixture; no fake user or public project is introduced. The fixture stays loopback-only. All player variants must remain free of horizontal overflow at 1440/1024/390/320.
- Last completed exact-head CI before these changes: `2e86772097c4775053640328195e107e53afe173`, run `38958234299`, success. New V003 source must obtain its own green verification.
- Read-only Cloudflare routing audit: **a.anevum.com/** maps to `anevum-creator-v1-a-staging`; **anevum.com/** maps to `anevum-construction-terminal`; **next.anevum.com/creator/** maps to a different staging Worker. Never use the `creator-v1-react-staging-release.yml` workflow to release this player onto A staging.
- A staging uses `creator-v1/wrangler.a-progression-v031.jsonc` with two isolated staging D1 bindings and existing canonical member/auth secrets. The older public-only `wrangler.a-staging.jsonc` is **not** a safe drop-in replacement: it omits canonical auth and MEMBER_DB. Do not replace the Worker, reset vars, or migrate D1 as part of the player shell.
- Cloudflare observed A-staging active Worker version `33510e51-41f9-4438-b2b9-31e445e063b2` at 19:52 UTC on October 16, 2026. This is **an observation, not a deployment pin**: re-check the actual current version and capture rollback before any release.
- This PR was based on V031; separate draft member/supporter work has advanced more than a hundred commits since V031. Reconcile with a reviewed integration baseline before deployment; do not cherry-pick or overwrite pending account, commerce, storage, or profile features blindly.
- The original `MemberEngagementPanel` remains legacy-member-API based, and canonical A-staging auth uses a distinct health/session contract. Ratings and saves require separately verified canonical server support before being claimed available. Guest/unavailable states remain fail-closed. Do not bridge identities or award XP in the browser.
- Remaining release gates: a genuine reviewed creator submission with confirmed external destination/rights/access details; authenticated member A, guest, staff and member B acceptance; Safari/device checks; current Worker/D1/secret snapshot; exact reviewed candidate SHA; rollback plan; isolated A-staging smoke; explicit owner staging authorization. None of these gates have been bypassed by the source-only player CI.
