# ANEVUM V079 — Home and Wayfinder production release

**Session:** `ANEVUM.WEB.RELEASE.2026-10-18.004.HOME-WAYFINDER-V079-LIVE`
**Date:** 2026-10-18
**Outcome:** PASS — live on https://anevum.com
**Approved V079 source:** `ef111c9a0ad2f3e0388bcdeb2f3df04e1f960c0d`
**Guarded release workflow source:** `28b9dfe0d539385453e20f52604e30aaaf1e50fe`
**Release branch:** `release/home-wayfinder-v079-approved-20261018`
**Passing release:** https://github.com/anevum/anevum-web/actions/runs/39170219430
**Cloudflare Worker:** `anevum-apex-prelaunch-gateway`
**Live Worker version (100%):** `df09d4b8-6d42-4cf3-a816-0c3c5682f947`
**Previous verified rollback version:** `50d33296-cee0-4565-93c6-a81777f23c85`
**Worker deployment (UTC):** `2026-10-18T22:00:47.81241Z`

## Delivered

- Replaced image-heavy four-panel menu with **Continuance Wayfinder**: direct Play, Discover, Community, Create destinations; field shortcuts; global public search; and authenticated-owner player card.
- Reduced the homepage to a concise launch hero, four choices, one verified approved featured creation, a bounded recent-work excerpt, and user identity/invitation.
- Reused existing V078 player card component for owner, creation, and creator contexts without inventing badges, XP, medals, or membership links.
- Kept real approved game **Single Drift** discoverable without requiring an associated published creator-channel handle.
- Enabled verified public project and creator lookup from the main-site quick switcher.
- Introduced phone-first responsive layout with keyboard/focus, reduced-motion, and forced-color support.
- Preserved original 30 Evolution specimens, the 152 packaged native assets, locked-level media gates, 3D collectible viewer, and V078 earned-only artwork.

## Evidence and safeguards

All release steps passed in [workflow 39170219430](https://github.com/anevum/anevum-web/actions/runs/39170219430):

1. Checked out only the exact reviewed frontend source plus its release workflow.
2. Rebuilt 152 Evolution assets and passed React TypeScript checks, production/staging Vite builds, V079 regression tests, and V078 reward/media tests.
3. Browser-tested real compiled React at desktop and 390px/320px widths, including menu/search and the approved-but-unlinked creator regression.
4. Confirmed the prior V078 Worker version before the first write. Recorded the rollback version and installed an automatic rollback trap.
5. Verified production JavaScript byte-for-byte as the reviewed prefix (existing authorized social/player Worker can append scoped content), and verified the canonical V079 stylesheet and V078 player styles at their real browser paths.
6. Confirmed the public pages /, /discover, /community, /recognition, /join, /creators, and the public member profile shell; email sign-in-method availability; and privacy-sensitive earned-media behavior.
7. Confirmed unchanged **24 Worker bindings**, including both D1 databases and all secret binding names, identical plain-text feature flags, and the same **23 zone Worker routes**, including staff, uploader, native player, frame policy, and discovery.
8. Independently fetched the public live homepage, discovery, community, and join pages after rollout. The homepage displayed the V079 title and real approved public work.
9. Independently queried Cloudflare after the job: `df09d4b8-6d42-4cf3-a816-0c3c5682f947` was active at 100%, all 24 Worker bindings were present, and all 23 route entries were unchanged.

**Member privacy:** A member may make a previously public profile private. In that case publicly denied earned artwork/scene requests are expected; they must remain denied. The release validation accepts either a verified public award or the correct private-profile denial, never a fabricated public reward.

**Incident history:** Prior attempts in runs 39169292405, 39169764052, and 39169928237 were unsuccessful and did not receive release approval. The guarded workflow rolled back to V078 when required, or stopped before writing. The successful run is 39170219430. Earlier checks exposed CSS propagation timing and a stale assumption that one specific member's earned media had to remain public. Both were corrected without changing private-account state.

## Operational boundaries

No database migration, XP change, moderation approval, upload, account creation, sign-in state modification, or route rewiring was authorized or made by V079. Production access to existing uploaded projects, staff, forums, native player, member auth, and rewards remains governed by their existing Workers.

**Do not replay older V078 release workflows or merge development drafts onto the live V078 release branch.** The V079 live source is the separately guarded release branch. For recovery, use Cloudflare's Worker deployments API to restore the immediately preceding verified version `50d33296-cee0-4565-93c6-a81777f23c85`, keeping independently versioned route-overlay Workers untouched.

Design and integration history: [PR #522](https://github.com/anevum/anevum-web/pull/522). Original unreconciled draft PR #521 was superseded and closed.
