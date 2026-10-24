# ANEVUM / Living Progression development candidate

Session: **ANEVUM.WEB.BUILD.2026-10-23.001.LIVING-PROGRESSION-AND-REWARDS**
Date: October 23, 2026 (America/New_York).
Status: source development and isolated tests. **Not a live earning economy.**
Base: `6fd78935d7392f0a1ccffff102d452f2d7137402`, NEXT Living Commons PR #679.
Branch: `build/continuance-progression-20261023-001`.
Coordination: #325; progression ownership #337; discovery #331; doctrine #344; visual review #335.

## What is actually implemented

1. A typed catalog of 19 contribution paths in four tracks, searchable and filterable in the actual React application. Each entry has criteria, provenance requirements, caps, a proposed value and a real existing destination. Staging-only rating XP is explicitly not canonical member XP.
2. A default-off `/__review/progression` route inside the existing Shell. It uses the genuine OrbitalMark and existing IREN help control, not a second assistant. Three optional expedition cards explain the journey without pretending to enroll, verify or award a member.
3. Private, server-backed progression and earned-history views using the canonical API, bounded reads and explicit loading/error/retry states. Account-keyed components prevent a former member's snapshot from appearing under a new identity. Inconsistent XP/level thresholds fail closed. The personal atlas is a decorative projection of earned milestones, with an equivalent accessible timeline; it is not an invented social network.
4. An isolated SQLite/D1-shaped contribution ledger prototype for six pilot sources: accepted review, confirmed bug, first discussion, first response, original project publication and substantive versioned release. It is NOT imported by any Worker or production reader.
5. Local model, source and real SQLite tests; a source-only exact-head CI workflow; a compiled React browser suite with labelled synthetic fixtures at 1440/390/320 pixels. A suite's existence is not a claim that a particular CI run passed.

## Preserved decisions

- Keep all 30 permanent Evolution specimens and the current `75*(L-1)^2` contract. Level 30 starts at 63,075 XP. The old unlimited-level proposal is historical, not authorization to override the newer implementation.
- Never reveal unreached specimen images, names or descriptions. All earned art uses the existing entitlement-checked LevelEmblem endpoint. A public proposal can explain an activity without exposing a hidden reward design.
- Existing First Signal (+10) and World Shaper (+25) remain authoritative. No duplicate profile-completion award is added. The earlier proposal for first-save XP is corrected to zero: saving is useful, but not a paid click.
- XP, cosmetic affinity, independently awarded badges, service ribbons, prestige medals, reputation and staff authorization remain separate. No purchases, voting power, ranking boosts or financial redemption are attached to XP.
- V131, retired XP diagnostics, historic ledgers, notifications, recognition grants, private accounts and pending migration0014 remain untouched. No reset, backfill, migration, provider connection, deployment or production mutation is performed.

## Candidate earning matrix

All new numbers below are review proposals; none is a production promise.

| Track | Activity | Candidate XP | Main bound |
|---|---|---:|---|
| Discovery | Honest eligible rating | 2 | Existing separate staging only; 5/day |
| Discovery | First meaningful save | 0 | Personal milestone, no XP |
| Discovery | Independently accepted review | 15 | 2/day; one/project |
| Discovery | First accepted review bonus | 25 | Once; adapter not implemented |
| Discovery | Confirmed bug | 30 | 3/week |
| Discovery | Accessibility finding | 40 | 2/week |
| Discovery | Original curated collection | 40 | 1/month |
| Community | First approved substantial discussion | 25 | Once |
| Community | First approved helpful response | 20 | Once |
| Community | Additional accepted answer | 15 | 3/week; no first-reply stacking |
| Community | Resolved creator request | 35 | Unique verified issue |
| Creation | First approved original project | 150 | Replaces ordinary publication award |
| Creation | Further approved original project | 100 | Rolling 14-day cooldown |
| Creation | Substantive project release | 60 | Per-project UTC calendar month |
| Creation | Original tutorial | 40 | 2/month |
| Creation | Original reusable resource | 75 | One/qualified resource; no duplicate project payout |
| Collaboration | Credited contribution | 75 | Distinct independently verified work |
| Collaboration | Open-source contribution | 60 | 3/month, identity and provenance checked |
| Collaboration | Creative-jam entry | 60 | One/event, published free-entry rules |

Review evidence cannot be inferred from word count, likes, raw uploads, time on a page, an outbound click or an AI evaluator alone. Negative feedback is eligible on the same terms as positive feedback. Reports must not require a positive rating. Staff/moderator independence is verified separately from XP.

## Reward experience and rollout order

**Existing, preserved:** earned-only Evolution specimens; authentic badge cabinet; player card; independently reviewed ribbons/medals; existing cosmetic auras; IREN recognition queue.

**Implemented review surface:** ways to contribute, criteria dialogs, optional expedition routes, private earned-milestone atlas/timeline, verified progress summary, existing reward destinations.

**Designed, not yet issued or implemented as entitlements:** additional cosmetic borders/nameplates, card atmospheres, earned title treatments, archival lore transmissions, curated event patches, contributor-credit decorations and additional display presets. These should be deterministic accomplishments, not random loot boxes. Future artifact series must not replace earned originals or reveal designs prematurely.

**Later and separately gated:** persistent expedition enrollment, project-linked research requests, verified collaboration edges, group goals and four-week optional creative events. Events do not erase permanent history or penalize missed days. Cash, merchandise, grants and paid service credits require explicit budgets, eligibility and fulfillment review; XP is never an exchange balance.

The pilot should implement a small number of complete source integrations before commissioning dozens of new assets. Milestones must provide worthwhile recognition between slow level thresholds. Do not make useful publishing, accessibility, core navigation or account privacy into rewards to unlock.

## Ledger architecture and limits

The canonical migration0005 `member_xp_events` table only accepts the retired test-button source and amount 5. This work does not relax that constraint. The experimental schema lives outside migration directories and has no deployment path.

The candidate uses independent evidence, grants, append-only delta events and independent review decisions. An award is a single INSERT SELECT with ownership, approval, timestamp, duplicate, lifetime-safe-integer and earning-cap checks. Its history row is inserted by a transactional trigger; a history failure aborts the grant. There is no check-then-insert cap race. Database evidence, not client-selected points, determines the award.

A first project pays 150, not 150+100. Subsequent original projects observe a rolling 14-day cooldown. Release IDs deduplicate versions while a separate project scope enforces monthly limits. Revocations do not return cap capacity. A reviewed appeal restores only the original amount, with expected-revision checks and a unique decision ID; retries and stale decisions cannot mint additional XP. Account totals are derived from journal deltas, not browser state.

**Missing production integration, explicitly:** authenticated canonical source-to-evidence adapters; definitive source attribution and source-status invalidation; appeals/staff UI; account deletion/retention policy for cross-member reviewer references; materialized totals and performance budgets at scale; full export and privacy review; transactional notification integration; rate approval; staging migration rehearsal and release authorization. A caller cannot be treated as trusted just because it supplies an evidence ID. Do not expose a generic browser award endpoint.

Authoritative transaction reference: https://developers.cloudflare.com/d1/worker-api/d1-database/#batch
Local SQL tests establish SQLite behavior, not Cloudflare production or genuine independent-account acceptance.

## Balance simulation: current rates are NOT release-ready

These are hypothetical steady weekly earning profiles, not observed engagement or guaranteed earnings. One-time bonuses and existing earned milestones are excluded.

| Profile | XP/week | Level at week4 | Level at week13 | Level at week52 | Weeks to level30 |
|---|---:|---:|---:|---:|---:|
| Occasional reviewer | 15 | 1 | 2 | 4 | 4,205 |
| Explorer | 40 | 2 | 3 | 6 | 1,577 |
| Regular contributor | 95 | 3 | 5 | 9 | 664 |
| Creator with reviewed releases | 80 | 3 | 4 | 8 | 789 |

The catalog diversifies earning, but the existing curve plus these rates still produces very slow completion of the 30-specimen series. Do not solve this through compulsory daily activity or inflated spam rewards. Before release, approve first-session, month-one and long-term pacing, meaningful intermediate milestones and the treatment of the final series threshold. Any curve/rate revision must be explicitly reviewed against preserved member progress.

## Verification and release boundary

Run on Node22:

```sh
node --experimental-strip-types --test creator-v1/test/progression-next-model.test.mjs creator-v1/test/progression-next-ledger.test.mjs
npm run check:creator-v1-web
VITE_PROGRESSION_NEXT_REVIEW=true npm run build:creator-v1-web
node creator-v1/test/progression-next-browser.mjs
```

The dedicated CI checks exact scope, full React types, default-bundle exclusion, explicitly enabled compilation and synthetic browser behavior. Source/ledger tests cover default-off behavior, duplicates, same-source submissions, self-review, ownership, clock boundaries, caps, failed transactions, immutable history, first-release exclusivity, revocations, appeals, malformed totals, filtering and motion/route contracts.

Release still requires actual desktop/mobile visual inspection, physical Safari and assistive technology, real guest/member/reviewer isolation, a reviewed additive schema and backup/restore rehearsal, trusted source integration, and a separately approved successor release. Do not waive inherited frozen-scope CI guards or claim the entire stacked PR green because the dedicated suite passes.
