# ANEVUM Community V010 — member-selected earned achievement

**Session:** ANEVUM.WEB.BUILD.2026-10-14.006.FEATURED-AWARD-CHOICE  
**Review branch:** build/creator-v1-featured-award-v010-20261014  
**Dependency stack:** #388 cinematic → #392 Community V007 → #395 Member V008 → #396 Recognition V009 → V010  
**Status:** source in draft review, no D1 migrations or member feature flags applied.

## Implemented

Previously the V009 creator identity card displayed the highest-priority currently earned achievement automatically. V010 allows a verified invited Creator V1 member to choose **one achievement they have already earned** as a public showcase badge. The private Member Profile Editor displays the original CelestialEmblem artwork with a dropdown of server-eligible achievements, clear/no-featured choice, confirmation, and optimistic-concurrency error messages.

The selection is stored only in the member-owned `creator_featured_awards` table proposed by staging migration `0014_creator_featured_awards.sql`. The exact private `GET/POST /api/v1/member/creators/showcase` route relies on the existing same-origin authenticated Member Worker and origin checks, rate limit, strict 256-byte JSON parsing, allowed award keys, server-recalculated earned achievement state, verified creator ownership, and compare-and-swap revision control. No client can grant XP or select someone else's award.

Public `GET /api/v1/member/creators/:handle` calculates the actual earned award on each read. It returns `showcase.featuredAward` only when the stored selection is *still earned*; moderated revocation hides it without exposing a private member ID. If the migration is not present or the member service is unavailable, public creator pages still work with no custom featured badge. The V009 client still displays the ordinary earned fallback when no preferred badge is valid.

The chosen badge is labeled **FEATURED** on public creator identity cards. This is an earned achievement chosen for display—not proof of endorsement, staff permissions, moderator role, special ranking, payments or authentic account ownership outside the staged member service.

## Boundaries

- This patch supports **chosen achievement only**. The level artifact is still the current computed earned level artifact; selecting a previously earned artifact and its privacy controls require separate data-model acceptance and are not implemented.
- Do not route the new member preference across the V5 Better Auth or archived identity database without an audited, separately authenticated migration. The staging Creator V1 identity service is not the approved canonical identity integration.
- Migration 0014 is proposed, not executed on any D1 instance. Existing stage without this table fails closed for private choice while public listings remain usable.
- The schema is owner FK-scoped; no marketplace prices, gamification engine updates, new XP triggers, account roles, promotion or moderation bypass.
- Account deletion, retention, account linking and export completion remain gated under #328/#332; do not turn on public registration based on source/CI alone.
- The January 1, 2027 launch page, Cloudflare routes, private Lab, Command/RHEN and broker services remain unchanged.

## Verification and release

`integration/social-profile-library.integration.test.mjs` gains cases for a real in-process signed-in owner selecting an earned award, independent member denied unearned awards, anonymous and cross-origin write rejection, forged identity fields, stale revision conflict, clearing, and moderation revocation that hides the public claim while not tampering with the XP ledger.

`test/featured-award-v010.test.mjs` validates pure earned-claim binding, backend/picker security contracts, migration, and accessible UI. Exact-head TypeScript/Vite, Worker and integration/CI must pass. The V009 offline recognition captures are *illustrative*, not proof the new selection API is deployed, exercised on hosted staging, or accessible to any real user.

**Remaining conditions:** owner-reviewed UI; isolated staging schema backup/restore and migration 0014 trial; authenticated Member A award selection and independent Member B public verification; account switching, concurrency, deletion, recovery, public permission and revocation tests; canonical identity integration acceptance; explicit production authorization. Never auto-merge, auto-deploy, apply migrations or activate public signup.
