# ANEVUM V007 — staging migration reconciliation and release runbook

**Status:** 2026-10-14, **review gate only**. The current source is draft PR #397 against `release/a-staging-community-v006-20261014`. Neither this document nor any passing offline test authorizes Cloudflare mutations, automatic deployment, public signup, staging account linking, or apex changes.

## Authenticated source and actual staging inventory

The Cloudflare account's read-only inventory confirms that `anevum-creator-v1-a-staging` serves `a.anevum.com` with the dedicated D1 binding `COMMUNITY_DB` to database **`anevum-creator-v1-staging`**. That same isolated D1 is also bound to the separate, existing `anevum-member-auth-staging` Worker serving `next.anevum.com` member endpoints. The public Worker has only `ASSETS` and `COMMUNITY_DB` and does not accept member writes.

The October 14 metadata audit found exactly six applied migrations: `0001_initial_creator_platform`, `0002_staff_authoring`, `0003_member_identity_staging`, `0004_member_project_workflow`, `0005_voting_progression`, and `0006_account_privacy`. Neither `community_posts` nor `member_showcase_selections` exists yet. At the audit: one active member, two active creator profiles, zero published approved projects, zero XP events and zero active ratings.

Read-only **metadata** snapshot: `docs/creator-platform/V007-STAGING-SCHEMA-SNAPSHOT-2026-10-14.json`. It contains only table names and migration versions; no account identifiers, emails, secrets, sessions, or rows. **It is dated, not a substitute for a new live inventory before any approved release.**

## Open-PR migration ownership conflicts

| Version | Current proposal | Open draft / action |
| --- | --- | --- |
| 0007 | Moderated community posts, private submissions and post votes | Present in V007 branch; unapplied |
| 0008 | Community reply reviews | Present in V007 branch; unapplied |
| 0009 | No accepted canonical proposal found | **Reservation/gap requires owner and maintainer decision** |
| 0010–0012 | Member worlds, follows and forum discussions | Draft PR #381 only; independently review, not implied by V007 |
| 0013 | Project-linked community discussions | Present in V007 branch; unapplied |
| **0014** | `project_assets` private quarantine and reservations | **Draft PR #393; proposed owner of 0014** |
| **0014** | `creator_featured_awards` one selected achievement | **Draft PR #398; conflicting, do not independently apply** |
| 0015 | `member_showcase_selections` one equipped earned artifact, zero to three earned featured awards, opt-in | V007 draft PR #397; unapplied |

**Recommended resolution, not yet authorized:** reserve prefix `0014` for the reconciled private asset schema if approved; do **not** install the older single-award `creator_featured_awards` table as an additional permanent source of truth. V007 `member_showcase_selections` is the proposed superseding design: it supports three selected earned awards, an equipped earned item, privacy opt-in, revision checks, and revalidation of current eligibility on read. If historical featured-award preferences ever exist in a deployed database, an audited, explicit one-time migration will be needed to preserve consent and ownership; do not auto-import or assume consent. All outstanding migration prefixes must be assigned an authoritative owner before any sequential staging application. Prefixes do not themselves guarantee safe dependencies or replay order.

PR #399 contains a separate signup/identity reconciliation with the other proposal lineage. Do **not** silently union its authentication model, `0014` migration, or signup screens into V007.

## Offline rehearsal command

From the repository root with Node.js 22 or newer:

```sh
node creator-v1/ops/verify-v007-migration-readiness.mjs --snapshot docs/creator-platform/V007-STAGING-SCHEMA-SNAPSHOT-2026-10-14.json
node --test creator-v1/test/v007-migration-readiness.test.mjs
```

This creates an **in-memory SQLite database only**, applies the actual checked-in baseline 0001–0006 SQL, inserts one synthetic member/project record, and transactionally rehearses migrations 0007, 0008, 0013 and 0015. It verifies tables, ledger, preserved fixtures, a private `is_public=0` default, foreign keys, database integrity and savepoint rollback. It reports both competing 0014 claims and ends in `MIGRATION_REVIEW_REQUIRED` even on a successful offline replay.

The script **does not connect to Cloudflare, read live member data, operate on R2, create backups, approve a migration, or deploy**. It intentionally refuses `--apply`, `--deploy`, and `--live`.

## Release gates and owner-authorized deployment order

1. **Identity and scope:** Decide canonical member identity, profile permissions, whether `next.anevum.com` is to remain the private account environment, and the explicitly authorized surface for saving showcase choices. Do not copy or relay cross-origin cookies onto the read-only `a.anevum.com` Worker.
2. **Migrations:** Resolve missing 0009 and staged 0010–0012 decisions, both competing 0014 claims, and the exact 0015 migration. Enforce single ownership of each prefix and specify approved dependencies before attempting staging changes.
3. **Fresh read-only inventory:** Confirm Cloudflare account, Worker bindings, exact staging D1 UUID, migration ledger and table names. Compare against updated authorized release manifest; do not assume this October 14 snapshot remains current.
4. **Explicit backup authorization:** Create a staging-specific D1 backup/bookmark/export with a documented time and verify a disposable recovery/restore process. A local SQLite rollback is not a Cloudflare recovery test.
5. **Approved controlled migration:** Apply only the reviewed SQL to the intended isolated Creator V1 staging D1, with a migration ledger / schema / `PRAGMA foreign_key_check` / consent default check after each step. Stop immediately on drift or unexpected table collisions.
6. **Deploy independently and deliberately:** Promote the exact reviewed Worker build(s) **only after a separate explicit owner instruction**. Maintain GET/HEAD-only public `a.anevum.com`; owner-only member writes require an authorized authenticated origin and cannot be simulated by public reads.
7. **Real two-account staging acceptance:** Validate member A selected three verified awards and an earlier-level artifact; member B must see only A's explicitly public selection. A must never modify B's records. Anonymous and signed-in B must not access hidden XP. Revoke an award, publish/unpublish a post, opt out, and verify immediate public disappearance and correct private owner access. Confirm no privileged RHEN owner account/brokerage state leaks into member APIs.
8. **Visual acceptance:** Inspect the exact-head 1440/390/320 compiled React screenshots, keyboard and reduced-motion behavior, edge cases with no XP/awards, and high-definition approved media quality.
9. **Protected launch:** Leave `anevum.com` as the January 1, 2027 countdown page. Do not enable open registration, merge draft PRs or promote staging until separately authorized.

## Acceptance boundaries

**Source/CI-ready is not live-ready.** The separate required V007 browser capture only validates synthetic offline fixtures against actual compiled React. It does not prove real hosted sessions, email delivery, claim validation on migrated D1, production performance, or that genuine collectibles exist. Staging data had no real XP or published releases at the time of the audit, so real populated profile screenshots cannot legitimately be claimed.

**Release decision:** `BLOCKED / REVIEW REQUIRED` until migration ownership, identity, backup recovery, hosted A/B account checks and visual approval are complete.
