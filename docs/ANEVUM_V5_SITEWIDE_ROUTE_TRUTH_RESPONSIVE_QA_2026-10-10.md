# ANEVUM V5 — Sitewide route truth and responsive QA continuation

Session: `ANEVUM.ANEVUM.UPDATE.2026-10-10.001.V5-UNIFIED-OVERHAUL`  
Main tracker: https://github.com/anevum/anevum-web/issues/259  
Upstream integrated candidate: https://github.com/anevum/anevum-web/pull/275 (pinned staging source `511de938061e4d532fb3bb1ff21ece24a5580d06`).

## Scope and motivation

This source-only follow-up is developed off, but **does not move**, the exact WEB candidate already deployed to isolated Alpaca reviewer staging. It repairs public website semantics that the previous homepage-first work left incomplete:

1. Unknown public routes and missing note/release records previously redirected to the homepage or used generic indexable metadata. They now retain the requested path and display a truthful Commons missing-page view, with `noindex,nofollow,noarchive` and no canonical link in the hydrated client.
2. The moderator-only route `/communities/moderation` is explicitly non-indexable both in client meta and in Worker `X-Robots-Tag`, with private/no-store response cache handling. No moderation API or server authorization logic changes.
3. Server HTML metadata now uses **actual** published Field Note source records and the canonical public Topics/Learning/Privacy/Terms routes. RHEN product/evidence descriptions disclose **SUSPENDED_FOR_REBUILD**, not live brokerage or invented performance. Unknown/archived routes receive a response `X-Robots-Tag: noindex`. Metadata interpolation escapes HTML attributes.
4. Browser QA checks missing/unpublished records and private moderation routing, plus focused responsive evidence at 320/390/768/1024/1440 widths across public/project/research/member/brokerage entry screens. The full route sweep remains at 390/1440 to contain runner costs.

## Explicit limitations and gates

- The Vite single-page fallback may still return HTTP 200 for a missing public route; this slice implements a visible missing-page state and search-engine noindex, **not a guaranteed edge HTTP 404**. Evaluate true HTTP 404 semantics separately only with an alias/SSR migration and rollback map.
- Current staging deployment remains pinned to the old `511de938061e4d532fb3bb1ff21ece24a5580d06` commit for the Alpaca review. Do not redeploy or repin the reviewer Worker merely because this UI/metadata branch is green.
- Website production, live RHEN, D1 migrations, public Commons social-write features and actual Alpaca OAuth are unchanged.
- Only after separate review and owner approval should this change join the post-review website integration. Do not merge the entire parent #275 as a shortcut.
