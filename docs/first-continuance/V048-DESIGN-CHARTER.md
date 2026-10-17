# ANEVUM / The First Continuance - V048

Session: `ANEVUM.WEB.BUILD.2026-10-16.001.FIRST-CONTINUANCE-XP-PROTOTYPE`

Status: **design contract locked, no production deployment**. Branch based on `build/community-forums-v041-20261016` for review only.

## Permanent decisions

- **30 levels total**, beginning at level 1. An unissued account mark may exist but is not Level 0.
- **Six collectible chapters of five levels:** Origins, Discovery, Invention, Threshold, Continuance, First Light.
- **Level 30 is the permanent summit**, named **The First Light**. Verified lifetime XP can continue above the summit, but never grants Level 31.
- Total XP to reach level `L`: `75 * (L - 1) ** 2`, for 1 <= L <= 30. Level 30 requires **63,075 XP**.
- **30 individually directed collectible objects**, not a shared insignia/coin template. Achievements remain separate awards. The visual reference is the reward satisfaction of classic creator communities, not copied art.
- **No bought XP.** Purchases, supporter subscriptions, currency, ad exposure, mechanical button presses, logins and refreshes award no XP. Ranks never expire.
- All earning must be server-authoritative, idempotent and fraud reviewed. No rank grants moderation privileges.

## XP grant schedule (prototype contract)

| Trusted event | XP | Cap |
|---|---:|---|
| Meaningful daily participation | 10 | 1 per UTC day |
| Discover a distinct eligible non-owner creation | 5 | 3/day; once per creation per account lifetime |
| Independently confirmed helpful feedback | 10 | 1 per UTC day |
| Approved original publication | 150 | 1 rewarded publication in any rolling seven days |
| First approved original publication | +100 | once for lifetime, bundled with first eligible publication |
| First valid wall entry | 10 | once |
| Complete profile milestone | 25 | once |

First three sources have a **combined daily ceiling of 35 XP**. All grant amounts are server-fixed. Publication and first-time milestones are outside this daily ceiling. Future game events require separately approved budgets and proof schemas.

## Website UX

Permanent artifact cabinet; current collectible on user cards, walls and threads; inspector with lore, materials and subtle individual animation; level-up reveal of ~1.8-2.2 seconds; quiet static and reduced-motion fallbacks; open gallery of locked states; optional archive dossier reveals at 25%, 50%, 75% of rank progress without additional XP.

All 30 objects have a title, silhouette brief, material direction, lore and ambient-motion direction in the V047/V048 production register. Five reference concepts exist at levels 1, 5, 10, 20 and 30; **they are concept studies, not final approved artwork**. Each eventual object needs a separate native HD source, scalable presentation, and small icon. The remaining 25 artwork masters are pending.

## Migration is mandatory before release

The current development implementation uses **60 level-artifact entries**, the formula `1 + floor(sqrt(xp/25))`, and a **test-only** `member_xp_events` table that accepts `test_button` entries of 5 XP. Its two legitimate once-only milestones are `first_signal` (+10) and `world_shaper` (+25). Do **not** silently convert testing XP to earned XP or double-count old milestone awards. Archive test provenance, backfill legitimate milestones once, run shadow comparisons, get account-level reconciliation approval and feature-flag the new implementation.

No production data, XP, rules, notifications or artwork has been migrated or changed in this branch. The interactive prototype is offline/local and assumes verified proofs solely for simulation.

## Acceptance criteria

- 30 thresholds and summit cap tested.
- Daily and rolling caps, one-time grants, self-discovery prohibition, proof verification, and retry idempotency tested against trusted DB events under concurrency.
- 60-to-30 migration documented, reversible and audited; test-button XP excluded from public ranks.
- Full 30-artifact high-resolution QA at 32/64/256/512px and native iPhone Safari.
- All member surfaces and notifications use a single authoritative 30-level manifest and server ledger.
- Launch requires owner approval after staging evidence.

**Source-of-truth package:** ANEVUM-FIRST-CONTINUANCE-V048-PROTOTYPE (design register, XP policy JSON, 30-level catalog, pure XP math, simulator, browser review, tests). This README is a tracked marker of locked design decisions, not authorization to deploy.
